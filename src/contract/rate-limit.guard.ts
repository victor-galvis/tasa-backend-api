import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface RateLimitRecord {
  totalRequests: number;   // total de peticiones (mismo contrato cuenta)
  blockedUntil: number | null;
  windowStart: number;
}

@Injectable()
export class ValidateContractRateLimitGuard implements CanActivate {
  // Ventana de tiempo en la que se cuentan las peticiones (ms)
  private readonly WINDOW_MS = 10 * 60 * 1000; // 10 minutos
  // Máximo de peticiones totales permitidas dentro de la ventana
  private readonly MAX_REQUESTS = 10;
  // Tiempo de bloqueo cuando se supera el límite (ms)
  private readonly BLOCK_DURATION_MS = 2 * 60 * 60 * 1000; // 2 horas

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

    // ── 3. Verificar límite por IP ──────────────────────────────────────────
    this.checkAndUpdate(this.ipRecords, ip, now, 'IP');

    // ── 4. Verificar límite por usuario ─────────────────────────────────────
    if (email) {
      this.checkAndUpdate(this.userRecords, email, now, 'usuario');
    }

    return true;
  }

  private checkAndUpdate(
    store: Map<string, RateLimitRecord>,
    key: string,
    now: number,
    label: string,
  ): void {
    let record = store.get(key);

    if (!record) {
      record = { totalRequests: 0, blockedUntil: null, windowStart: now };
      store.set(key, record);
    }

    // Si está bloqueado, verificamos si ya expiró
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
      // Bloqueo expirado → reiniciamos
      record.totalRequests = 0;
      record.blockedUntil = null;
      record.windowStart = now;
    }

    // Si la ventana de tiempo expiró → reiniciamos el contador
    if (now - record.windowStart > this.WINDOW_MS) {
      record.totalRequests = 0;
      record.windowStart = now;
    }

    // Sumamos la petición actual
    record.totalRequests += 1;

    // Si supera el máximo → bloqueamos
    if (record.totalRequests > this.MAX_REQUESTS) {
      record.blockedUntil = now + this.BLOCK_DURATION_MS;
      console.warn(
        `[RATE LIMIT] ${label} BLOQUEADO por 2h: ${key} | Peticiones en ventana: ${record.totalRequests}`,
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