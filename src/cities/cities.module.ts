import { Module } from '@nestjs/common';
import { CitiesService } from './cities.service';
import { CitiesController } from './cities.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { City } from './cities.entity';

@Module({
  imports: [TypeOrmModule.forFeature([City])],

  providers: [CitiesService],
  controllers: [CitiesController],
})
export class CitiesModule {}
