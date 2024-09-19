import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import entities from './database';
import { JwtModule } from '@nestjs/jwt';
import { authConfig } from './config/auth.configs';

@Module({
   imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      TypeOrmModule.forRoot({
         type: 'mysql',
         host: process.env.DB_HOST,
         port: parseInt(process.env.DB_PORT),
         username: process.env.DB_USERNAME,
         password: process.env.DB_PASSWORD,
         database: 'nest_learn',
         entities: entities,
         synchronize: true,
      }),
      JwtModule.register({
         global: true,
         secret: process.env.JWT_SECRET,
         signOptions: { expiresIn: authConfig.jwtExpiration },
      }),
      AuthModule,
      UserModule,
   ],
   controllers: [AppController],
   providers: [AppService],
})
export class AppModule {}
