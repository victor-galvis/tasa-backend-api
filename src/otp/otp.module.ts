import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Otp } from './otp.entity';
import { UserHasInvoice } from 'src/invoices/user-has-invoice.entity';
import { MailModule } from 'src/mail/mail.module';
import { OtpController } from './otp.controller';

@Module({
    imports: [TypeOrmModule.forFeature([User, Otp, UserHasInvoice]), MailModule],
    providers: [OtpService],
    controllers: [OtpController]
})
export class OtpModule { }
