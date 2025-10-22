import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { S3ServiceService } from '../s3.service/s3.service.service';

@Controller('files')
export class S3ControllerController {
  constructor(private readonly s3Service: S3ServiceService) {}

  @Get('pdf')
  async getPdf(@Res() res: Response) {
    const fileKey =
      'GobernacionAntioquia/Agosto2025/7423/0000000500958019-546.pdf';

    // 🔹 opción 1: devolver un link firmado (cliente descarga directo)
    const { url } = await this.s3Service.getFile(fileKey);
    return res.json({ url });

    // 🔹 opción 2: devolver el archivo directamente
    /*
    const stream = await this.s3Service.getFile(fileKey);
    res.setHeader('Content-Type', 'application/pdf');
    stream.pipe(res);
    */
  }
}
