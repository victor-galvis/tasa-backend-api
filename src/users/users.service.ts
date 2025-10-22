import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { Invoice } from '../invoices/invoice.entity';

import { Otp } from '../otp/otp.entity';
import { MailService } from '../mail/mail.service';
import { UserHasInvoice } from '../invoices/user-has-invoice.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,

    @InjectRepository(Otp) private otpRepo: Repository<Otp>,
    @InjectRepository(UserHasInvoice)
    private userInvoiceRepo: Repository<UserHasInvoice>,
    private mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: any) {
    const hash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({ ...dto, password: hash });
    await this.userRepo.save(user);

    const savedUser = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    const payload = { sub: savedUser!.id, email: savedUser!.email };
    const access_token = await this.jwtService.signAsync(payload);
    return {
      message: 'Usuario creado exitosamente.',
      access_token,
      user: {
        id: savedUser!.id,
        name: savedUser!.name,
        lastname: savedUser!.lastname,
      },
    };
  }

  async addInvoice(userId: number, number: string) {
    const invoice = this.invoiceRepo.create({ number });
    await this.invoiceRepo.save(invoice);

    await this.userInvoiceRepo.save({
      user_id: userId,
      invoice_id: invoice.id,
      created_at: new Date(),
    });

    return { message: 'Factura creada y asociada', invoiceId: invoice.id };
  }
}
