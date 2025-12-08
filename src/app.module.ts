/*
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
*/

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { OtpModule } from './otp/otp.module';
import { InvoicesModule } from './invoices/invoices.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { User } from './users/user.entity';
import { S3ControllerController } from './s3/s3.controller/s3.controller.controller';
import { S3ModuleModule } from './s3/s3.module/s3.module.module';
import { S3ServiceService } from './s3/s3.service/s3.service.service';
import { DocumentTypesModule } from './document-types/document-types.module';
import { AuthModule } from './auth/auth.module';
import { ContractModule } from './contract/contract.module';
import { ProvincesModule } from './provinces/provinces.module';
import { CitiesModule } from './cities/cities.module';
import { CompanyModule } from './company/company.module';
import { AddressValidateModule } from './address-validate/address-validate.module';
import { UtilsModule } from './utils/utils.module';
import * as dotenv from 'dotenv';
dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: 3306,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: false,
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecret',
      signOptions: { expiresIn: '1h' },
    }),
    UsersModule,
    MailModule,
    OtpModule,
    InvoicesModule,
    S3ModuleModule,
    DocumentTypesModule,
    AuthModule,
    ContractModule,
    ProvincesModule,
    CitiesModule,
    CompanyModule,
    AddressValidateModule,
    UtilsModule,
  ],
  providers: [AuthService, S3ServiceService],
  controllers: [AuthController, S3ControllerController],
})
export class AppModule { }
