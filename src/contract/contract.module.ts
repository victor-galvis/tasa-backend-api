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
import { NotificationUpdateModule } from 'src/notification-update/notification-update.module';
import { City } from 'src/cities/cities.entity';
import { Province } from 'src/provinces/province.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contract, City, Province]),
    UtilsModule,
    AddressValidateModule,
    UsersModule,
    AuthModule,
    NotificationUpdateModule,
  ],
  providers: [
    ContractService,
    ValidateContractRateLimitGuard,
  ],
  controllers: [ContractController],
})
export class ContractModule {}