import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceS3 } from './invoices3.entity';
import { InvoiceDownloadLog } from './invoice-download-log.entity';
import { S3ServiceService } from 'src/s3/s3.service/s3.service.service';
import { InvoicesController } from './invoices.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([InvoiceS3, InvoiceDownloadLog]), AuthModule],
  providers: [InvoicesService, S3ServiceService],
  controllers: [InvoicesController],
})
export class InvoicesModule {}
