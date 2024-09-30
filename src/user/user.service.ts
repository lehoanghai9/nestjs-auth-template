import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../database/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dtos/create-user.dto';
import { encodePassword } from '../common/utils/bcrypt';

@Injectable()
export class UserService {
   constructor(
      @InjectRepository(UserEntity)
      private readonly userRepository: Repository<UserEntity>,
   ) {}

   async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
      // Encode the password (hash)
      const hashedPassword = await encodePassword(createUserDto.password);
      const user = this.userRepository.create({...createUserDto, password: hashedPassword});
      return this.userRepository.save(user);
   }

   async findOneById(id: string): Promise<UserEntity> {
      return this.userRepository.findOne({ where: { id }, relations: ['customer'] });
   }

   async findOneByEmail(email: string): Promise<UserEntity> {
      return this.userRepository.findOne({ where: { email } });
   }

   async updatePassword(userId: string, newPassword: string) {
      // Encode the new password(hash)
      const hashedPassword = await encodePassword(newPassword);
      return await this.userRepository.update(userId, {
         password: hashedPassword,
      });
   }
}
