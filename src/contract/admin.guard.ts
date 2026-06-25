import {
  CanActivate, ExecutionContext, Injectable,
  ForbiddenException, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const auth: string = request.headers['authorization'] ?? '';
    const token = auth.split(' ')[1];

    if (!token) throw new UnauthorizedException('Token requerido');

    let payload: { email: string };
    try {
      payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'supersecret',
      });
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) throw new ForbiddenException('Admin no configurado');
    if (payload.email !== adminEmail) throw new ForbiddenException('Sin permisos');

    return true;
  }
}