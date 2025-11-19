import { Controller, Get, Query } from '@nestjs/common';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  @Get('/get-invoice')
  getInvoice(
    @Query('numero_factura') numeroFactura: string,
    @Query('numero_documento') numeroDocumento: string,
  ) {
    return this.service.findByFacturaAndCedula(numeroFactura, numeroDocumento);
  }
}
