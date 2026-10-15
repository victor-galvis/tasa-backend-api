import { Controller, Get, Query, Req } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly service: InvoicesService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('/get-invoice')
  getInvoice(
    @Query('numero_factura') numeroFactura: string,
    @Req() req,
  ) {
    return this.service.findByFactura(numeroFactura, this.getUserFromToken(req));
  }

  /** Lee el usuario del token si viene; no bloquea la petición si falta o es inválido */
  private getUserFromToken(req): { sub?: number; email?: string } | undefined {
    const auth: string = req.headers['authorization'] ?? '';
    const token = auth.split(' ')[1];
    if (!token) return undefined;

    try {
      return this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'supersecret',
      });
    } catch {
      return undefined;
    }
  }
}
