import { Module } from '@nestjs/common';
import { AddressValidateService } from './address-validate.service';
import { AddressValidateController } from './address-validate.controller';
import { AddressValidate } from './address-validate.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([AddressValidate]), UsersModule],
  controllers: [AddressValidateController],
  providers: [AddressValidateService],
  exports: [AddressValidateService],
})
export class AddressValidateModule { }
