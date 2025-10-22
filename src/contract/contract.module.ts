import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from './contract.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contract])],
  providers: [ContractService],
  controllers: [ContractController],
})
export class ContractModule {}
