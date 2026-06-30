import { Module } from '@nestjs/common';
import { SapIntegrationService } from './sap-integration.service';

@Module({
  providers: [SapIntegrationService],
  exports: [SapIntegrationService],
})
export class SapIntegrationModule {}