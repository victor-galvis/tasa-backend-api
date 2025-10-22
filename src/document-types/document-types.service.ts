import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentTypes } from './document-types.entity';

@Injectable()
export class DocumentTypesService {
  constructor(
    @InjectRepository(DocumentTypes)
    private readonly repo: Repository<DocumentTypes>,
  ) {}

  async findAll(): Promise<DocumentTypes[]> {
    return this.repo.find();
  }
}
