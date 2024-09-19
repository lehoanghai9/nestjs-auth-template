import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/database';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [{ useClass: UserService, provide: 'USER_SERVICE' }],
  exports: [{ useClass: UserService, provide: 'USER_SERVICE' }],
})
export class UserModule {}
