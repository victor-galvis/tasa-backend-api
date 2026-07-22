import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { City } from './cities.entity';
import { CitiesService } from './cities.service';

@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get('province/:provinceId')
  async findByProvince(
    @Param('provinceId', ParseIntPipe) provinceId: number,
  ): Promise<City[]> {
    return this.citiesService.findByProvince(provinceId);
  }

  @Get('by-code-prefix/:prefix')       // ← endpoint nuevo
  async findByCodePrefix(
    @Param('prefix') prefix: string,
  ): Promise<City[]> {
    return this.citiesService.findByCodePrefix(prefix);
  }
}
