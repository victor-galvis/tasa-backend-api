import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class RecaptchaGuard implements CanActivate {

  private readonly logger = new Logger(RecaptchaGuard.name);

  // Acciones válidas — deben coincidir con las del frontend
  private readonly validActions = [
    'login',
    'register',
    'reset_password',
    'generate_otp',
    'otp_forgot_password',
    'verify_otp',
  ];

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['recaptcha'];

    // ✅ Validación 1: token presente
    if (!token) {
      throw new UnauthorizedException('Token reCAPTCHA no proporcionado');
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const allowedHostname = process.env.RECAPTCHA_ALLOWED_HOSTNAME; // ej: tasaseguridad.antioquia.gov.co

    let data: any;

    try {
      const response = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {           // ✅ params en query, no en URL hardcodeada
            secret: secretKey,
            response: token,
          },
        }
      );
      data = response.data;
    } catch (error) {
      this.logger.error('Error al contactar Google reCAPTCHA', error);
      throw new UnauthorizedException('Error validando reCAPTCHA');
    }

    // ✅ Validación 2: éxito de Google
    if (!data.success) {
      this.logger.warn(`reCAPTCHA fallido: ${JSON.stringify(data['error-codes'])}`);
      throw new UnauthorizedException('reCAPTCHA inválido');
    }

    // ✅ Validación 3: score de riesgo
    if (data.score < 0.5) {
      this.logger.warn(`Score bajo detectado: ${data.score}`);
      throw new UnauthorizedException(`Score de riesgo insuficiente: ${data.score}`);
    }

    // ✅ Validación 4: acción específica
    if (!this.validActions.includes(data.action)) {
      this.logger.warn(`Acción no válida: ${data.action}`);
      throw new UnauthorizedException(`Acción reCAPTCHA no permitida: ${data.action}`);
    }

    // ✅ Validación 5: hostname (anti-bypass desde otros dominios)
    if (allowedHostname && data.hostname !== allowedHostname) {
      this.logger.warn(`Hostname no permitido: ${data.hostname}`);
      throw new UnauthorizedException(`Origen no autorizado: ${data.hostname}`);
    }

    return true;
  }
}