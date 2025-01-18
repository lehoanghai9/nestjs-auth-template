import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../services/mail.service';
import { RefreshTokenEntity } from '../database/refresh-token.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResetTokenEntity } from '../database/reset-token.entity';
import { UserService } from '../user/user.service';

describe('AuthController', () => {
   let controller: AuthController;
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
         controllers: [AuthController],
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

      controller = module.get<AuthController>(AuthController);
   });

   it('should be defined', () => {
      expect(controller).toBeDefined();
   });
});
