import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { type IMailService } from './interfaces/mailservice.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService implements IMailService {
   private transporter: nodemailer.Transporter;

   constructor(private readonly configService: ConfigService) {
      this.transporter = nodemailer.createTransport({
         host: this.configService.get<string>('EMAIL_HOST'),
         port: this.configService.get<number>('EMAIL_PORT'),
         auth: {
            user: this.configService.get<string>('EMAIL_USER'),
            pass: this.configService.get<string>('EMAIL_PASSWORD'),
         },
      });
   }

   async sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
      const resetLink = `http://localhost:3000/reset-password?token=${token}`;

      const mailOptions = {
         from: 'Nestjs Auth Backend',
         to,
         subject: 'Password Reset',
         text: `Click this link to reset your password: <a href="${resetLink}">Reset password</a>`,
      };

      await this.transporter.sendMail(mailOptions);

      return true;
   }
}
