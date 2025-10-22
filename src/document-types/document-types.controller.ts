import { Controller, Get } from '@nestjs/common';
import { DocumentTypesService } from './document-types.service';
import { DocumentTypes } from './document-types.entity';

@Controller('document-types')
export class DocumentTypesController {
  constructor(private readonly service: DocumentTypesService) {}

  @Get()
  async getAll(): Promise<DocumentTypes[]> {
    return this.service.findAll();
  }
}
