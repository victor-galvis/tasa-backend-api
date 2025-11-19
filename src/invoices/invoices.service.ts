import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceS3 } from './invoices3.entity';
import { S3ServiceService } from 'src/s3/s3.service/s3.service.service';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(InvoiceS3)
    private readonly invoiceRepository: Repository<InvoiceS3>,
    private readonly s3Service: S3ServiceService,
  ) {}

  async findByFacturaAndCedula(invoiceNumber: string, cedula: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: { numeroFactura: invoiceNumber, numeroCedula: cedula },
    });

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    console.log('rutaCompleta', invoice.rutaCompleta);

    const url = await this.s3Service.getFile(invoice.rutaCompleta);
    return url;
  }
}
