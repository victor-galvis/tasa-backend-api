import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './cities.entity';

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City)
    private readonly repo: Repository<City>,
  ) {}

  async findAll(): Promise<City[]> {
    return this.repo.find();
  }

  async findByProvince(provinceId: number): Promise<City[]> {
    return this.repo.find({
      where: { provinceId },
    });
  }
}
