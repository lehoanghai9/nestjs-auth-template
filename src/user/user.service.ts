import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/database';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dtos/create-user.dto';

@Injectable()
export class UserService {
   constructor(
      @InjectRepository(UserEntity)
      private readonly userRepository: Repository<UserEntity>,
   ) {}

   async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
      const user = this.userRepository.create(createUserDto);
      return this.userRepository.save(user);
   }

   async findOneById(id: string): Promise<UserEntity> {
      return this.userRepository.findOne({ where: { id } });
   }

   async findOneByEmail(email: string): Promise<UserEntity> {
      return this.userRepository.findOne({ where: { email } });
   }

   async updatePassword(userId: string, newPassword: string) {
      return await this.userRepository.update(userId, {
         password: newPassword,
      });
   }
}
