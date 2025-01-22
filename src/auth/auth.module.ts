import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokenEntity } from '../database/refresh-token.entity';
import { ResetTokenEntity } from '../database/reset-token.entity';
import { MailService } from '../services/mail.service';
import { TypedConfigModule } from '../config/config.module';

@Module({
   imports: [
      UserModule,
      TypeOrmModule.forFeature([RefreshTokenEntity, ResetTokenEntity]),
      TypedConfigModule,
   ],
   controllers: [AuthController],
   providers: [AuthService, MailService],
})
export class AuthModule {}
