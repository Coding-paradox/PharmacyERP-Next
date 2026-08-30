import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SentMessageInfo } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter!: nodemailer.Transporter<SentMessageInfo>;
  private isConfigured: boolean = false;

  constructor(private readonly config: ConfigService) {
    try {
      const emailUser = this.config.get('EMAIL_USER');
      const emailPass = this.config.get('EMAIL_PASS');

      if (emailUser && emailPass && emailPass !== 'ton_mot_de_passe_applicatif') {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });
        this.isConfigured = true;
        this.logger.log('Email service configured successfully');
      } else {
        this.logger.warn('Email service not configured. Please set EMAIL_USER and EMAIL_PASS in .env');
      }
    } catch (error) {
      this.logger.error('Failed to configure email service');
    }
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn(`Email not sent to ${to}: Email service not configured`);
      return;
    }

    const resetLink = `${this.config.get('APP_URL', 'http://localhost:3002')}/reset-password/${token}`;

    const mailOptions = {
      from: `PharmacyERP <${this.config.get('EMAIL_USER')}>`,
      to,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h1 style="color: #0D6B6B; text-align: center;">PharmacyERP</h1>
          <p>Bonjour,</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour le réinitialiser :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #0D6B6B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p>Ce lien est valable pendant <strong>1 heure</strong>.</p>
          <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0;" />
          <p style="font-size: 12px; color: #888; text-align: center;">
            PharmacyERP - Gestion de pharmacie professionnelle
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw error;
    }
  }

  async sendTestEmail(to: string): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn(`Test email not sent to ${to}: Email service not configured`);
      return;
    }

    const mailOptions = {
      from: `PharmacyERP <${this.config.get('EMAIL_USER')}>`,
      to,
      subject: 'Test Email from PharmacyERP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h1 style="color: #0D6B6B; text-align: center;">PharmacyERP</h1>
          <p>Ceci est un email de test.</p>
          <p>Votre configuration email fonctionne correctement.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Test email sent to ${to}`);
    } catch (error: any) {
      this.logger.error(`Failed to send test email to ${to}: ${error.message}`);
      throw error;
    }
  }
}