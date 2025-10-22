import { Module } from '@nestjs/common';
import { ProvincesService } from './provinces.service';
import { ProvincesController } from './provinces.controller';
import { Province } from './province.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Province])],

  providers: [ProvincesService],
  controllers: [ProvincesController],
})
export class ProvincesModule {}
