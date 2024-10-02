import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../database';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [{ useClass: UserService, provide: 'USER_SERVICE' }],
  exports: ['USER_SERVICE'],
})
export class UserModule {}
