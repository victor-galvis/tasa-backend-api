import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST!,
    port: process.env.MAIL_PORT!,
    secure: false,

    auth: {
      user: process.env.MAIL_USER!,
      pass: process.env.MAIL_PASS!,
    },
    tls: {
      ciphers: 'SSLv3',
    },
  });

  async sendOtp(email: string, code: string) {
    const templatePath = path.join(__dirname, 'templates', 'template.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    htmlTemplate = htmlTemplate.replace(/{{(CODE|EMAIL)}}/g, (_, key) => {
      const map = {
        CODE: code,
        EMAIL: email
      };
      return map[key];
    });

    await this.transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_USER}>`,
      to: email,
      subject:
        ' Confirma tu registro en el Portal Transaccional – Tasa de Seguridad Antioquia',
      html: htmlTemplate,
    });
  }
  async sendOtpRecoveryPassword(email: string, name: string, code: string) {
    const templatePath = path.join(__dirname, 'templates', 'template-recovery.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    htmlTemplate = htmlTemplate.replace(/{{(NAME|CODE)}}/g, (_, key) => {
      const map = {
        NAME: name,
        CODE: code
      };
      return map[key];
    });

    await this.transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_USER}>`,
      to: email,
      subject:
        'Recuperación de contraseña – Portal Transaccional Gobernación de Antioquia',
      html: htmlTemplate,
    });
  }
}
