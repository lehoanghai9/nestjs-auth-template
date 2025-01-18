import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { authConfig } from './config/auth.configs';
import { RolesModule } from './roles/roles.module';
import { StripeModule } from './stripe/stripe.module';
import { PriceModule } from './price/price.module';
import { ProductModule } from './product/product.module';
import { WebhookModule } from './webhook/webhook.module';
import { CustomerModule } from './customer/customer.module';
import { getConfig } from './config/db.config';

@Module({
   imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      TypeOrmModule.forRootAsync({
         useFactory: () => getConfig(),
      }),
      JwtModule.register({
         global: true,
         secret: process.env.JWT_SECRET,
         signOptions: { expiresIn: authConfig.jwtExpiration },
      }),
      AuthModule,
      UserModule,
      RolesModule,
      StripeModule,
      PriceModule,
      ProductModule,
      WebhookModule,
      CustomerModule,
   ],
   controllers: [AppController],
   providers: [AppService],
})
export class AppModule {}
