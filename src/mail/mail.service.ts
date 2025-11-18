import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,

    auth: {
      user: 'notificaciones.ti@valormas.gov.co',
      pass: 'Valormas2025*',
    },
    tls: {
      ciphers: 'SSLv3',
    },
  });

  async sendOtp(email: string, code: string) {
    // Ruta del template
    const templatePath = path.join(__dirname, 'templates', 'template.html');

    // Leer contenido del archivo
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Reemplazar el placeholder
    htmlTemplate = htmlTemplate.replace('{{CODE}}', code);

    await this.transporter.sendMail({
      from: '"Nelson Torres" <nelson.torres@valormas.gov.co>',
      to: email,
      subject:
        ' Confirma tu registro en el Portal Transaccional – Tasa de Seguridad Antioquia',
      html: htmlTemplate,
    });
  }
}
