import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Otp } from '../otp/otp.entity';
import { UserHasInvoice } from '../invoices/user-has-invoice.entity';
import { MailModule } from '../mail/mail.module';
import { Invoice } from 'src/invoices/invoice.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, User, Otp, UserHasInvoice]),
    MailModule,
    AuthModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule { }
