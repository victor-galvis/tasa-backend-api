import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private graphClient: Client;

  constructor() {
    const credential = new ClientSecretCredential(
      process.env.AZURE_TENANT_ID!,
      process.env.AZURE_CLIENT_ID!,
      process.env.AZURE_CLIENT_SECRET!,
    );

    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default'],
    });

    this.graphClient = Client.initWithMiddleware({ authProvider });
  }

  private async sendMail(to: string, subject: string, html: string): Promise<void> {
    await this.graphClient
      .api(`/users/${process.env.MAIL_FROM}/sendMail`)
      .post({
        message: {
          subject,
          body: {
            contentType: 'HTML',
            content: html,
          },
          toRecipients: [
            { emailAddress: { address: to } },
          ],
        },
      });
  }

  async sendOtp(email: string, code: string): Promise<void> {
    try {
      const templatePath = path.join(__dirname, 'templates', 'template.html');
      let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
      htmlTemplate = htmlTemplate.replace(/{{(CODE|EMAIL)}}/g, (_, key) => {
        const map: Record<string, string> = { CODE: code, EMAIL: email };
        return map[key];
      });

      await this.sendMail(
        email,
        'Confirma tu registro en el Portal Transaccional – Tasa de Seguridad Antioquia',
        htmlTemplate,
      );

      this.logger.log(`OTP enviado a ${email}`);
    } catch (error) {
      this.logger.error(`Error enviando OTP a ${email}`, error);
      throw new Error('No se pudo enviar el correo de verificación');
    }
  }

  async sendOtpRecoveryPassword(email: string, name: string, code: string): Promise<void> {
    try {
      const templatePath = path.join(__dirname, 'templates', 'template-recovery.html');
      let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
      htmlTemplate = htmlTemplate.replace(/{{(NAME|CODE)}}/g, (_, key) => {
        const map: Record<string, string> = { NAME: name, CODE: code };
        return map[key];
      });

      await this.sendMail(
        email,
        'Recuperación de contraseña – Portal Transaccional Gobernación de Antioquia',
        htmlTemplate,
      );

      this.logger.log(`OTP recuperación enviado a ${email}`);
    } catch (error) {
      this.logger.error(`Error enviando OTP recuperación a ${email}`, error);
      throw new Error('No se pudo enviar el correo de recuperación');
    }
  }
}