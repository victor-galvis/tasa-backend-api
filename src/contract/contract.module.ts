import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from './contract.entity';
import { UtilsModule } from 'src/utils/utils.module';
import { AddressValidateModule } from 'src/address-validate/address-validate.module';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { ValidateContractRateLimitGuard } from './rate-limit.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';

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
    JwtAuthGuard,
    AdminGuard, // ← agregar
  ],
  controllers: [ContractController],
})
export class ContractModule {}