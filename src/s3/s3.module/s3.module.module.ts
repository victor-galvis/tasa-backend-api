import { Module } from '@nestjs/common';
import { S3ServiceService } from '../s3.service/s3.service.service';
import { S3ControllerController } from '../s3.controller/s3.controller.controller';

@Module({
  providers: [S3ServiceService],
  controllers: [S3ControllerController],
})
export class S3ModuleModule {}
