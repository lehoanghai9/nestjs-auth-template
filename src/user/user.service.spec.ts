import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../database/user.entity';
import { Repository } from 'typeorm';
import * as bcryptUtil from '../common/utils/bcrypt';

describe('UserService', () => {
   let service: UserService;
   let userRepository: Repository<UserEntity>;

   const USER_REPOSITORY_TOKEN = getRepositoryToken(UserEntity);

   beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
         providers: [
            { provide: 'USER_SERVICE', useClass: UserService },
            {
               provide: USER_REPOSITORY_TOKEN,
               useValue: {
                  create: jest.fn(),
                  save: jest.fn(),
                  findOne: jest.fn(),
               },
            },
         ],
      }).compile();

      service = module.get<UserService>('USER_SERVICE');
      userRepository = module.get<Repository<UserEntity>>(
         USER_REPOSITORY_TOKEN,
      );
   });

   it('should be defined', () => {
      expect(service).toBeDefined();
   });

   it('userRepository should be defined', () => {
      expect(userRepository).toBeDefined();
   });

   describe('createUser', () => {
      it('should encode the password', async () => {
         jest
            .spyOn(bcryptUtil, 'encodePassword')
            .mockReturnValue(Promise.resolve('hashed123'));

         await service.createUser({
            email: 'hai@gmail.com',
            name: 'Hai',
            password: '123',
         });

         expect(bcryptUtil.encodePassword).toHaveBeenCalledWith('123');
      });

      it('should call the userRepository.create with correct params', async () => {
         await service.createUser({
            email: 'hai@gmail.com',
            name: 'Hai',
            password: '123',
         });

         expect(userRepository.create).toHaveBeenCalledWith({
            email: 'hai@gmail.com',
            name: 'Hai',
            password: 'hashed123',
         });
      });
   });
});
