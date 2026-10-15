import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceS3 } from './invoices3.entity';
import { InvoiceDownloadLog } from './invoice-download-log.entity';
import { S3ServiceService } from 'src/s3/s3.service/s3.service.service';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(InvoiceS3)
    private readonly invoiceRepository: Repository<InvoiceS3>,
    @InjectRepository(InvoiceDownloadLog)
    private readonly downloadLogRepository: Repository<InvoiceDownloadLog>,
    private readonly s3Service: S3ServiceService,
  ) { }

  async findByFactura(invoiceNumber: string, user?: { sub?: number; email?: string }) {
    const invoice = await this.invoiceRepository.findOne({
      where: { numeroFactura: invoiceNumber },
    });

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }
    const url = await this.s3Service.getFile(invoice.rutaCompleta);

    // Registro de la descarga — si falla no debe impedir que el usuario baje el PDF
    this.logDownload(invoiceNumber, user).catch((err) =>
      console.error('Error al registrar descarga de factura:', err.message),
    );

    return url;
  }

  private async logDownload(invoiceNumber: string, user?: { sub?: number; email?: string }) {
    const adminEmails = (process.env.ADMIN_EMAIL ?? '')
      .split(',')
      .map(e => e.trim())
      .filter(Boolean);
    const isAdmin = !!user?.email && adminEmails.includes(user.email);

    await this.downloadLogRepository.insert({
      userId: user?.sub ?? null,
      userEmail: user?.email ?? null,
      invoiceNumber,
      source: isAdmin ? 'admin' : 'client',
    });
  }
}
