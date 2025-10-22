import { Injectable } from '@nestjs/common';
import { Province } from './province.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ProvincesService {
  constructor(
    @InjectRepository(Province)
    private readonly repo: Repository<Province>,
  ) {}

  async findAll(): Promise<Province[]> {
    return this.repo.find();
  }
}
