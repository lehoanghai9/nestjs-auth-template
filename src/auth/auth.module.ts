import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from 'src/user/user.service';
import { UserModule } from 'src/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokenEntity } from 'src/database/refresh-token.entity';
import { ResetTokenEntity } from 'src/database/reset-token.entity';
import { MailService } from 'src/services/mail.service';

@Module({
   imports: [
      UserModule,
      TypeOrmModule.forFeature([RefreshTokenEntity, ResetTokenEntity]),
   ],
   controllers: [AuthController],
   providers: [AuthService, MailService],
})
export class AuthModule {}
