import {
   BadRequestException,
   Inject,
   Injectable,
   NotFoundException,
   UnauthorizedException,
} from '@nestjs/common';
import { SignupDto } from './dtos/signup.dto';
import { comparePasswords, encodePassword } from 'src/utils/bcrypt';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dtos/login.dto';
import { WrongCredentialsException } from 'src/utils/exceptions/wrong-credentials.exception';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshTokenEntity } from 'src/database/refresh-token.entity';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { JWTPayload } from 'src/types/userdetail-request.type';
import { nanoid } from 'nanoid';
import { ResetTokenEntity } from 'src/database/reset-token.entity';
import { authConfig } from 'src/config/auth.configs';
import { MailService } from 'src/services/mail.service';
import { IMailService } from 'src/services/interfaces/mailservice.interface';

@Injectable()
export class AuthService {
   constructor(
      @Inject('USER_SERVICE') private readonly userService: UserService,
      @Inject(JwtService) private readonly jwtService: JwtService,
      @Inject(MailService) private readonly mailService: IMailService,
      @InjectRepository(RefreshTokenEntity)
      private refreshTokenRepository: Repository<RefreshTokenEntity>,
      @InjectRepository(ResetTokenEntity)
      private resetTokenRepository: Repository<ResetTokenEntity>,
   ) {}

   async signUp(signupData: SignupDto) {
      const { email, password } = signupData;

      const isEmailInUse = await this.userService.findOneByEmail(email);

      if (isEmailInUse) {
         //TODO: REMOVE TEXT
         throw new BadRequestException('Email already in use');
      }

      //Hash the password
      const hashedPassword = await encodePassword(password);

      //Create the user
      const user = await this.userService.createUser({
         ...signupData,
         password: hashedPassword,
      });

      return {
         message: 'User created successfully',
      };
   }

   async login(loginData: LoginDto) {
      const { email: loginEmail, password: loginPassword } = loginData;

      //Find if email exists
      const user = await this.userService.findOneByEmail(loginEmail);

      if (!user) {
         throw new WrongCredentialsException();
      }

      //Check if password matches
      const passwordMatches = await comparePasswords(
         loginPassword,
         user.password,
      );

      if (!passwordMatches) {
         throw new WrongCredentialsException();
      }

      //Generate JWT token
      const { accessToken, refreshToken } = await this.generateUserTokens(
         user.id,
      );

      return { accessToken, refreshToken };
   }

   async refreshTokens(refreshToken: string) {
      //Verify if the refresh token is valid
      const token = await this.refreshTokenRepository.findOne({
         where: {
            token: refreshToken,
            expiryDate: MoreThanOrEqual(new Date()),
         },
         relations: ['user'],
      });

      //If the token is not found or expired, throw an error
      if (!token) {
         throw new UnauthorizedException('Invalid refresh token.');
      }

      //Generate new access token
      return this.generateUserTokens(token.user.id);
   }

   async changePassword(
      userId: string,
      oldPassword: string,
      newPassword: string,
   ) {
      const user = await this.userService.findOneById(userId);

      if (!user) {
         throw new NotFoundException('User not found');
      }

      //Check if the old password matches
      const passwordMatches = await comparePasswords(
         oldPassword,
         user.password,
      );
      if (!passwordMatches) {
         throw new WrongCredentialsException();
      }

      //Hash the new password
      const hashedPassword = await encodePassword(newPassword);

      //Update the user password
      await this.userService.updatePassword(user.id, hashedPassword);

      return {
         message: 'Password updated successfully',
      };
   }

   async forgotPassword(email: string) {
      //Find the user by email
      const user = await this.userService.findOneByEmail(email);

      if (user) {
         //If user is found, generate a password reset token
         const expiryDate = new Date();
         expiryDate.setHours(
            expiryDate.getHours() + authConfig.resetTokenExpiryHours,
         );

         const resetToken = nanoid(64);
         await this.resetTokenRepository.insert({
            token: resetToken,
            user: { id: user.id },
            expiryDate,
         });

         this.mailService.sendPasswordResetEmail(email, resetToken);
      }

      return {
         message: 'If the user exists, a password reset email will be sent',
      };
   }

   async resetPassword(token: string, newPassword: string) {
      //Find the reset token in the database
      const resetToken = await this.resetTokenRepository.findOne({
         where: {
            token,
            expiryDate: MoreThanOrEqual(new Date()),
         },
         relations: ['user'],
      });

      //If the reset token is not found or expired, throw an error
      if (!resetToken) {
         throw new UnauthorizedException('Invalid reset token');
      }

      //Hash the new password
      const hashedPassword = await encodePassword(newPassword);

      //Update the user password
      await this.userService.updatePassword(resetToken.user.id, hashedPassword);

      //Delete the reset token
      await this.resetTokenRepository.delete({ token });

      return {
         message: 'Password reset successfully',
      };
   }

   private async generateUserTokens(userId: string) {
      const jwtPayload: JWTPayload = { userId };
      const accessToken = this.jwtService.sign(jwtPayload);

      //Generate refresh token to store in the database
      const refreshToken = uuid();

      //Store the refresh token in the database
      await this.storeRefreshToken(refreshToken, userId);

      return {
         accessToken,
         refreshToken,
      };
   }

   private async storeRefreshToken(refreshToken: string, userId: string) {
      //Calculates expiry date from x days from now on
      const expiresInDays = authConfig.refreshTokenExpirationDays;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiresInDays);

      // Check if the user already has a refresh token in the database
      const refreshTokenDb = await this.refreshTokenRepository.findOne({
         where: { user: { id: userId } },
      });

      //If the user has a refresh token, update it
      if (refreshTokenDb) {
         return this.refreshTokenRepository.update(
            { user: { id: userId } },
            {
               token: refreshToken,
               expiryDate,
            },
         );
      }

      //If the user does not have a refresh token, insert a new one
      return this.refreshTokenRepository.insert({
         token: refreshToken,
         user: { id: userId },
         expiryDate,
      });
   }
}
