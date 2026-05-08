import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface RateLimitRecord {
  totalRequests: number;
  blockedUntil: number | null;
  windowStart: number;
  lastContracts: string[]; // historial de contratos consultados
}

@Injectable()
export class ValidateContractRateLimitGuard implements CanActivate {
  private readonly WINDOW_MS = 10 * 60 * 1000;              // 10 minutos
  private readonly MAX_REQUESTS = 5;                         // máximo 5 peticiones
  private readonly BLOCK_DURATION_MS = 12 * 60 * 60 * 1000; // 12 horas
  private readonly CONSECUTIVE_THRESHOLD = 3;                // 3 contratos consecutivos = bot

  private readonly userRecords = new Map<string, RateLimitRecord>();
  private readonly ipRecords = new Map<string, RateLimitRecord>();

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const now = Date.now();

    // ── 1. Extraer IP del cliente ───────────────────────────────────────────
    const ip: string =
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.ip ||
      'unknown';

    // ── 2. Extraer email del JWT ────────────────────────────────────────────
    let email: string | null = null;
    try {
      const auth: string = request.headers['authorization'] ?? '';
      const token = auth.split(' ')[1];
      if (token) {
        const payload = this.jwtService.verify<{ email: string }>(token, {
          secret: process.env.JWT_SECRET || 'supersecret',
        });
        email = payload.email ?? null;
      }
    } catch {
      // Token inválido → solo aplicamos límite por IP
    }

    // ── 3. Extraer número de contrato del body 
    const contractNumber: string =
      request.body?.filters?.agreement?.toString() ?? '';

    // ── 4. Verificar límite por IP 
    this.checkAndUpdate(this.ipRecords, ip, now, 'IP', email, contractNumber);

    // ── 5. Verificar límite por usuario 
    if (email) {
      this.checkAndUpdate(this.userRecords, email, now, 'usuario', email, contractNumber);
    }

    return true;
  }

  // ── Detecta si los últimos N contratos son consecutivos 
  private hasConsecutiveContracts(contracts: string[]): boolean {
    if (contracts.length < this.CONSECUTIVE_THRESHOLD) return false;

    const last = contracts.slice(-this.CONSECUTIVE_THRESHOLD);
    const nums = last.map(Number);

    // Verificar que todos son numéricos
    if (nums.some(isNaN)) return false;

    // Verificar que son consecutivos (ascendente o descendente)
    const ascendente = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
    const descendente = nums.every((n, i) => i === 0 || n === nums[i - 1] - 1);

    return ascendente || descendente;
  }

  private checkAndUpdate(
    store: Map<string, RateLimitRecord>,
    key: string,
    now: number,
    label: string,
    email: string | null,
    contractNumber: string,
  ): void {
    let record = store.get(key);

    if (!record) {
      record = { totalRequests: 0, blockedUntil: null, windowStart: now, lastContracts: [] };
      store.set(key, record);
    }

    // Si está bloqueado, verificamos si ya expiró
    if (record.blockedUntil !== null) {
      if (now < record.blockedUntil) {
        const minutosRestantes = Math.ceil((record.blockedUntil - now) / 60_000);
        const ts = new Date().toISOString();
        const userInfo = email ? ` | usuario: ${email}` : '';
        console.warn(
          `[RATE LIMIT] [${ts}] ${label} bloqueado: ${key}${userInfo} | Desbloqueo en ${minutosRestantes} min`,
        );
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'TOO_MANY_REQUESTS',
            message: `Ha superado el límite de consultas permitidas. Por favor espere ${minutosRestantes} minuto(s) antes de intentarlo nuevamente.`,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      // Bloqueo expirado → reiniciamos
      record.totalRequests = 0;
      record.blockedUntil = null;
      record.windowStart = now;
      record.lastContracts = [];
    }

    // Si la ventana de tiempo expiró → reiniciamos el contador
    if (now - record.windowStart > this.WINDOW_MS) {
      record.totalRequests = 0;
      record.windowStart = now;
      record.lastContracts = [];
    }

    // Registramos el contrato consultado (máximo últimos 10)
    if (contractNumber) {
      record.lastContracts.push(contractNumber);
      if (record.lastContracts.length > 10) {
        record.lastContracts.shift();
      }
    }

    // ── Detección de secuencia consecutiva → bloqueo inmediato ──────────────
    if (this.hasConsecutiveContracts(record.lastContracts)) {
      record.blockedUntil = now + this.BLOCK_DURATION_MS;
      const ts = new Date().toISOString();
      const userInfo = email ? ` | usuario: ${email}` : '';
      console.warn(
        `[RATE LIMIT] [${ts}] ${label} BLOQUEADO por 12h (SECUENCIA CONSECUTIVA): ${key}${userInfo} | Contratos: ${record.lastContracts.slice(-this.CONSECUTIVE_THRESHOLD).join(', ')}`,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'TOO_MANY_REQUESTS',
          message:
            'Ha realizado demasiadas consultas de contratos. Su acceso ha sido bloqueado temporalmente por 12 horas.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Sumamos la petición actual
    record.totalRequests += 1;

    if (record.totalRequests > this.MAX_REQUESTS) {
      record.blockedUntil = now + this.BLOCK_DURATION_MS;
      const ts = new Date().toISOString();
      const userInfo = email ? ` | usuario: ${email}` : '';
      console.warn(
        `[RATE LIMIT] [${ts}] ${label} BLOQUEADO por 12h: ${key}${userInfo} | Peticiones en ventana: ${record.totalRequests}`,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'TOO_MANY_REQUESTS',
          message:
            'Ha realizado demasiadas consultas de contratos. Su acceso ha sido bloqueado temporalmente por 12 horas.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}