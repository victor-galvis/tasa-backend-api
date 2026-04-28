import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface RateLimitRecord {
  contracts: Set<string>; // contratos distintos consultados
  blockedUntil: number | null;
  windowStart: number;
}

@Injectable()
export class ValidateContractRateLimitGuard implements CanActivate {
  // Ventana de tiempo en la que se cuentan las peticiones (ms)
  private readonly WINDOW_MS = 10 * 60 * 1000; // 10 minutos
  // Máximo de contratos distintos permitidos dentro de la ventana
  private readonly MAX_DISTINCT_CONTRACTS = 10;
  // Tiempo de bloqueo cuando se supera el límite (ms)
  private readonly BLOCK_DURATION_MS = 2 * 60 * 60 * 1000; // 2 horas

  // Almacenamiento en memoria: clave → registro
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
      // Si el token es inválido dejamos email = null y solo aplicamos límite por IP
    }

    // ── 3. Extraer el número de contrato del body ───────────────────────────
    const contractNumber: string =
      request.body?.filters?.agreement ?? request.body?.filters?.contract ?? 'unknown';

    // ── 4. Verificar y actualizar límite por IP ─────────────────────────────
    this.checkAndUpdate(this.ipRecords, ip, contractNumber, now, 'IP');

    // ── 5. Verificar y actualizar límite por usuario ────────────────────────
    if (email) {
      this.checkAndUpdate(this.userRecords, email, contractNumber, now, 'usuario');
    }

    return true;
  }

  // ── Lógica central de rate limiting ──────────────────────────────────────
  private checkAndUpdate(
    store: Map<string, RateLimitRecord>,
    key: string,
    contractNumber: string,
    now: number,
    label: string,
  ): void {
    let record = store.get(key);

    // Si no existe registro, lo inicializamos
    if (!record) {
      record = { contracts: new Set(), blockedUntil: null, windowStart: now };
      store.set(key, record);
    }

    // Si está bloqueado, verificamos si ya expiró el bloqueo
    if (record.blockedUntil !== null) {
      if (now < record.blockedUntil) {
        const minutosRestantes = Math.ceil((record.blockedUntil - now) / 60_000);
        console.warn(
          `[RATE LIMIT] ${label} bloqueado: ${key} | Desbloqueo en ${minutosRestantes} min`,
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
      // Bloqueo expirado → reiniciamos el registro
      record.contracts = new Set();
      record.blockedUntil = null;
      record.windowStart = now;
    }

    // Si la ventana de tiempo expiró, reiniciamos el contador
    if (now - record.windowStart > this.WINDOW_MS) {
      record.contracts = new Set();
      record.windowStart = now;
    }

    // Registramos el contrato consultado (Set ignora duplicados automáticamente)
    record.contracts.add(contractNumber);

    // Si supera el máximo de contratos distintos → bloqueamos
    if (record.contracts.size > this.MAX_DISTINCT_CONTRACTS) {
      record.blockedUntil = now + this.BLOCK_DURATION_MS;
      console.warn(
        `[RATE LIMIT] ${label} BLOQUEADO por 2h: ${key} | Contratos distintos: ${record.contracts.size}`,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'TOO_MANY_REQUESTS',
          message:
            'Ha realizado demasiadas consultas de contratos. Su acceso ha sido bloqueado temporalmente por 2 horas.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}