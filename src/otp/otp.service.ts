import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { Otp } from '../otp/otp.entity';
import { Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/user.entity';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp) private otpRepository: Repository<Otp>,
    @InjectRepository(User) private userRepo: Repository<User>,

    private mailService: MailService,
  ) { }

  async generateOtp(email: string, type: string) {
    let user = await this.userRepo.findOne({ where: { email } });
    if (!user) {

      const code = Math.floor(10000 + Math.random() * 90000).toString();
      await this.otpRepository.save({
        email: email,
        code,
        status: 'pending',
        type: 'email_verification',
        created_at: new Date(),
      });
      await this.mailService.sendOtp(email, code);
      return {
        status: 'success',
        message: 'Código OTP enviado al correo electrónico',
        response: 'Ok',
      };
    } else {
      throw new BadRequestException(`El correo <b>${email}</b> ya está en uso.`);

    }
  }

  async generateOtpForgotPassword(email: string, type: string) {
    let user = await this.userRepo.findOne({ where: { email } });
    if (user) {

      const code = Math.floor(10000 + Math.random() * 90000).toString();
      await this.otpRepository.save({
        email: email,
        code,
        status: 'pending',
        type: 'email_verification', 
        created_at: new Date(),
      });
      await this.mailService.sendOtpRecoveryPassword(email, `${user.name} ${user.lastname} `, code);
      return {
        status: 'success',
        message: 'Código OTP enviado al correo electrónico',
        response: 'Ok',
      };
    } else {
      throw new BadRequestException(`El correo <b>${email}</b> ya está en uso.`);

    }
  }

  async verifyOtp(email: string, code: string) {
    const otp = await this.otpRepository.findOne({
      where: { email, code },
    });
    if (!otp) throw new BadRequestException('El código OTP es inválido');

    if (otp.status === 'verified') {
      throw new BadRequestException('Código ya ha sido verificado anteriormente');
    }

    // ⏳ Validar expiración (10 minutos)
    const createdAt = otp.created_at instanceof Date
      ? otp.created_at
      : new Date(otp.created_at);

    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    if (diffMinutes > 10) {
      throw new BadRequestException('El código OTP ha expirado');
    }



    otp.status = 'verified';
    otp.validated_at = new Date();
    await this.otpRepository.save(otp);

    return { valid: true };
  }

}
