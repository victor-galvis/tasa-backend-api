import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class RecaptchaGuard implements CanActivate {

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['recaptcha'];

    if (!token) {
      throw new UnauthorizedException('Token reCAPTCHA no proporcionado');
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

    const { data } = await axios.post(url);

    if (!data.success || data.score < 0.5) {
      throw new UnauthorizedException('reCAPTCHA inválido');
    }

    return true;
  }
}