import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from './contract.entity';
import { UtilsModule } from 'src/utils/utils.module';
import { AddressValidateModule } from 'src/address-validate/address-validate.module';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module'; // ✅ necesario para JwtService
import { ValidateContractRateLimitGuard } from './rate-limit.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contract]),
    UtilsModule,
    AddressValidateModule,
    UsersModule,
    AuthModule, 
  ],
  providers: [
    ContractService,
    ValidateContractRateLimitGuard, 
  ],
  controllers: [ContractController],
})
export class ContractModule {}