import { Controller, Get } from '@nestjs/common';
import { ProvincesService } from './provinces.service';
import { Province } from './province.entity';

@Controller('provinces')
export class ProvincesController {
  constructor(private readonly service: ProvincesService) {}

  @Get()
  async getAll(): Promise<Province[]> {
    return this.service.findAll();
  }
}
