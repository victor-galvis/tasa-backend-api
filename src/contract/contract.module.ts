import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from './contract.entity';
import { UtilsModule } from 'src/utils/utils.module';
import { AddressValidateModule } from 'src/address-validate/address-validate.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Contract]), UtilsModule, AddressValidateModule, UsersModule],
  providers: [ContractService],
  controllers: [ContractController],
})
export class ContractModule { }

