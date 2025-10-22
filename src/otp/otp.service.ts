import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { Otp } from '../otp/otp.entity';
import { Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp) private otpRepository: Repository<Otp>,
    private mailService: MailService,
  ) {}

  async generateOtp(email: string) {
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    await this.otpRepository.save({
      email: email,
      code,
      status: 'pending',
      created_at: new Date(),
    });
    await this.mailService.sendOtp(email, code);
    return {
      status: 'success',
      message: 'Código OTP enviado al correo electrónico',
      response: { email, code },
    };
  }

  async verifyOtp(email: string, code: string) {
    const otp = await this.otpRepository.findOne({
      where: { email, code, status: 'pending' },
    });
    if (!otp) throw new Error('Código inválido');

    otp.status = 'verified';
    otp.validated_at = new Date();
    await this.otpRepository.save(otp);
    return { valid: true };
  }
}
