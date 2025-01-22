import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../services/mail.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshTokenEntity } from '../database/refresh-token.entity';
import { ResetTokenEntity } from '../database/reset-token.entity';
import { Repository } from 'typeorm';
import {
   BadRequestException,
   NotFoundException,
   UnauthorizedException,
} from '@nestjs/common';
import { SignupDto } from './dtos/signup.dto';
import { LoginDto } from './dtos/login.dto';
import { comparePasswords } from '../common/utils/bcrypt';
import { WrongCredentialsException } from '../common/exceptions/wrong-credentials.exception';
import { nanoid } from 'nanoid';
import { UserEntity } from '../database';
import { TypedConfigModule } from '../config/config.module';

jest.mock('../common/utils/bcrypt', () => ({
   comparePasswords: jest.fn(),
}));

jest.mock('nanoid', () => ({
   nanoid: jest.fn(),
}));

jest.mock('uuid', () => ({
   v4: jest.fn(),
}));

describe('AuthService', () => {
   let service: AuthService;
   let userService: UserService;
   let jwtService: JwtService;
   let mailService: MailService;
   let refreshTokenRepository: Repository<RefreshTokenEntity>;
   let resetTokenRepository: Repository<ResetTokenEntity>;

   beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
         providers: [
            AuthService,
            {
               provide: 'USER_SERVICE',
               useValue: {
                  findOneByEmail: jest.fn(),
                  createUser: jest.fn(),
                  findOneById: jest.fn(),
                  updatePassword: jest.fn(),
               },
            },
            {
               provide: JwtService,
               useValue: {
                  sign: jest.fn(),
               },
            },
            {
               provide: MailService,
               useValue: {
                  sendPasswordResetEmail: jest.fn(),
               },
            },
            {
               provide: getRepositoryToken(RefreshTokenEntity),
               useClass: Repository,
            },
            {
               provide: getRepositoryToken(ResetTokenEntity),
               useClass: Repository,
            },
         ],
         imports: [TypedConfigModule],
      }).compile();

      service = module.get<AuthService>(AuthService);
      userService = module.get<UserService>('USER_SERVICE');
      jwtService = module.get<JwtService>(JwtService);
      mailService = module.get<MailService>(MailService);
      refreshTokenRepository = module.get<Repository<RefreshTokenEntity>>(
         getRepositoryToken(RefreshTokenEntity),
      );
      resetTokenRepository = module.get<Repository<ResetTokenEntity>>(
         getRepositoryToken(ResetTokenEntity),
      );
   });

   it('should be defined', () => {
      expect(service).toBeDefined();
   });

   describe('signUp', () => {
      it('should throw BadRequestException if email is already in use', async () => {
         jest.spyOn(userService, 'findOneByEmail').mockResolvedValueOnce({
            email: 'test@test.com',
            name: 'Im a test User',
         } as UserEntity);

         await expect(
            service.signUp({
               email: 'test@test.com',
               password: 'password',
            } as SignupDto),
         ).rejects.toThrow(BadRequestException);

         expect(userService.findOneByEmail).toHaveBeenCalledWith(
            'test@test.com',
         );
      });

      it('should create a new user and return success message', async () => {
         jest.spyOn(userService, 'findOneByEmail').mockResolvedValueOnce(null);
         jest.spyOn(userService, 'createUser').mockResolvedValueOnce({
            id: '1',
            email: 'test@test.com',
         } as UserEntity);

         const result = await service.signUp({
            email: 'test@test.com',
            password: 'password',
         } as SignupDto);

         expect(userService.createUser).toHaveBeenCalledWith({
            email: 'test@test.com',
            password: 'password',
         });
         expect(result).toEqual({ message: 'User created successfully' });
      });
   });

   describe('login', () => {
      it('should throw WrongCredentialsException if email is not found', async () => {
         jest.spyOn(userService, 'findOneByEmail').mockResolvedValueOnce(null);

         await expect(
            service.login({
               email: 'test@test.com',
               password: 'password',
            } as LoginDto),
         ).rejects.toThrow(WrongCredentialsException);

         expect(userService.findOneByEmail).toHaveBeenCalledWith(
            'test@test.com',
         );
      });

      it('should throw WrongCredentialsException if password does not match', async () => {
         jest.spyOn(userService, 'findOneByEmail').mockResolvedValueOnce({
            id: '1',
            password: 'hashedPassword',
         } as UserEntity);
         (comparePasswords as jest.Mock).mockResolvedValueOnce(false);

         await expect(
            service.login({
               email: 'test@test.com',
               password: 'password',
            } as LoginDto),
         ).rejects.toThrow(WrongCredentialsException);

         expect(comparePasswords).toHaveBeenCalledWith(
            'password',
            'hashedPassword',
         );
         expect(comparePasswords).toHaveBeenCalledTimes(1);
      });

      it('should return access and refresh tokens if credentials are valid', async () => {
         jest.spyOn(userService, 'findOneByEmail').mockResolvedValueOnce({
            id: '1',
            password: 'hashedPassword',
         } as UserEntity);
         (comparePasswords as jest.Mock).mockResolvedValueOnce(true);
         jest
            .spyOn<any, any>(service, 'generateUserTokens')
            .mockResolvedValueOnce({
               accessToken: 'accessToken',
               refreshToken: 'refreshToken',
            });

         const result = await service.login({
            email: 'test@test.com',
            password: 'password',
         } as LoginDto);

         expect(result).toEqual({
            accessToken: 'accessToken',
            refreshToken: 'refreshToken',
         });

         expect(service['generateUserTokens']).toHaveBeenCalledTimes(1);
         expect(service['generateUserTokens']).toHaveBeenCalledWith('1');
      });
   });

   describe('refreshTokens', () => {
      it('should throw UnauthorizedException if refresh token is invalid', async () => {
         jest
            .spyOn(refreshTokenRepository, 'findOne')
            .mockResolvedValueOnce(null);

         await expect(service.refreshTokens('invalidToken')).rejects.toThrow(
            UnauthorizedException,
         );

         expect(refreshTokenRepository.findOne).toHaveBeenCalledTimes(1);
      });

      it('should return new access and refresh tokens if refresh token is valid', async () => {
         jest.spyOn(refreshTokenRepository, 'findOne').mockResolvedValueOnce({
            token: 'validToken',
            user: { id: '1' },
         } as RefreshTokenEntity);
         jest
            .spyOn<any, any>(service, 'generateUserTokens')
            .mockResolvedValueOnce({
               accessToken: 'newAccessToken',
               refreshToken: 'newRefreshToken',
            });

         const result = await service.refreshTokens('validToken');

         expect(service['generateUserTokens']).toHaveBeenCalledTimes(1);
         expect(service['generateUserTokens']).toHaveBeenCalledWith('1');

         expect(result).toEqual({
            accessToken: 'newAccessToken',
            refreshToken: 'newRefreshToken',
         });
      });
   });

   describe('changePassword', () => {
      it('should throw NotFoundException if user is not found', async () => {
         jest.spyOn(userService, 'findOneById').mockResolvedValueOnce(null);

         await expect(
            service.changePassword('1', 'oldPassword', 'newPassword'),
         ).rejects.toThrow(NotFoundException);

         expect(userService.findOneById).toHaveBeenCalledWith('1');
         expect(userService.findOneById).toHaveBeenCalledTimes(1);
      });

      it('should throw WrongCredentialsException if old password does not match', async () => {
         jest.spyOn(userService, 'findOneById').mockResolvedValueOnce({
            id: '1',
            password: 'hashedPassword',
         } as UserEntity);
         (comparePasswords as jest.Mock).mockResolvedValueOnce(false);

         await expect(
            service.changePassword('1', 'oldPassword', 'newPassword'),
         ).rejects.toThrow(WrongCredentialsException);

         expect(comparePasswords).toHaveBeenCalledWith(
            'oldPassword',
            'hashedPassword',
         );
      });

      it('should update password and return success message if old password matches', async () => {
         jest.spyOn(userService, 'findOneById').mockResolvedValueOnce({
            id: '1',
            password: 'hashedPassword',
         } as UserEntity);
         (comparePasswords as jest.Mock).mockResolvedValueOnce(true);
         jest.spyOn(userService, 'updatePassword').mockResolvedValueOnce(null);

         const result = await service.changePassword(
            '1',
            'oldPassword',
            'newPassword',
         );

         expect(result).toEqual({ message: 'Password updated successfully' });
      });
   });

   describe('forgotPassword', () => {
      it('should send password reset email if user is found', async () => {
         jest.spyOn(userService, 'findOneByEmail').mockResolvedValueOnce({
            id: '1',
            email: 'test@test.com',
         } as UserEntity);
         (nanoid as jest.Mock).mockReturnValueOnce('resetToken');
         jest.spyOn(resetTokenRepository, 'insert').mockResolvedValueOnce(null);
         jest
            .spyOn(mailService, 'sendPasswordResetEmail')
            .mockResolvedValueOnce(null);

         const result = await service.forgotPassword('test@test.com');

         expect(result).toEqual({
            message: 'If the user exists, a password reset email will be sent',
         });
         expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
            'test@test.com',
            'resetToken',
         );
      });

      it('should return success message even if user is not found', async () => {
         jest.spyOn(userService, 'findOneByEmail').mockResolvedValueOnce(null);

         const result = await service.forgotPassword('test@test.com');

         expect(result).toEqual({
            message: 'If the user exists, a password reset email will be sent',
         });
      });
   });

   describe('resetPassword', () => {
      it('should throw UnauthorizedException if reset token is invalid', async () => {
         jest
            .spyOn(resetTokenRepository, 'findOne')
            .mockResolvedValueOnce(null);

         await expect(
            service.resetPassword('invalidToken', 'newPassword'),
         ).rejects.toThrow(UnauthorizedException);
      });

      it('should update password and delete reset token if reset token is valid', async () => {
         jest.spyOn(resetTokenRepository, 'findOne').mockResolvedValueOnce({
            token: 'valid',
            user: { id: '1' },
         } as ResetTokenEntity);
         jest.spyOn(userService, 'updatePassword').mockResolvedValueOnce(null);
         jest.spyOn(resetTokenRepository, 'delete').mockResolvedValueOnce(null);

         const result = await service.resetPassword(
            'validToken',
            'newPassword',
         );

         expect(result).toEqual({ message: 'Password reset successfully' });
         expect(userService.updatePassword).toHaveBeenCalledWith(
            '1',
            'newPassword',
         );
         expect(resetTokenRepository.delete).toHaveBeenCalledWith({
            token: 'validToken',
         });
      });
   });
});
