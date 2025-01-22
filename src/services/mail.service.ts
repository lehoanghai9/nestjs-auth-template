import { Inject, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { type IMailService } from './interfaces/mailservice.interface';
import { TypedConfigService } from '../config/config.service';

@Injectable()
export class MailService implements IMailService {
   private transporter: nodemailer.Transporter;

   constructor(
      @Inject(TypedConfigService) readonly configService: TypedConfigService,
   ) {
      this.transporter = nodemailer.createTransport({
         host: this.configService.get('mail.host'),
         port: this.configService.get('mail.port'),
         auth: {
            user: this.configService.get('mail.user'),
            pass: this.configService.get('mail.pass'),
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
