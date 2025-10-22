import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Contract } from './contract.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
  ) {}

  findAll() {
    return this.contractRepository.find();
  }

  findByUser(userId: number) {
    return this.contractRepository.find({
      where: { user_id: userId },
    });
  }

  async findByNumberAndUser(
    number: string,
    user_id: number,
  ): Promise<Contract | null> {
    return this.contractRepository.findOne({ where: { number, user_id } });
  }

  async create(data: Partial<Contract>) {
    const newContract = this.contractRepository.create(data);
    return await this.contractRepository.save(newContract);
  }

  async remove(id: number) {
    await this.contractRepository.delete(id);
    return { message: `Contrato ${id} eliminado correctamente` };
  }
}
