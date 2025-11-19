import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceS3 } from './invoices3.entity';
import { S3ServiceService } from 'src/s3/s3.service/s3.service.service';
import { InvoicesController } from './invoices.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InvoiceS3])],
  providers: [InvoicesService, S3ServiceService],
  controllers: [InvoicesController],
})
export class InvoicesModule {}
