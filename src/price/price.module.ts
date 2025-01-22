import { Module } from '@nestjs/common';
import { PriceService } from './price.service';
import { PriceController } from './price.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceEntity } from '../database/price.entity';
import { StripeModule } from '../stripe/stripe.module';
import { UserModule } from '../user/user.module';
import { CustomerModule } from '../customer/customer.module';
import { TypedConfigModule } from '../config/config.module';

@Module({
   imports: [
      TypeOrmModule.forFeature([PriceEntity]),
      StripeModule,
      UserModule,
      CustomerModule,
      TypedConfigModule
   ],
   controllers: [PriceController],
   providers: [{ useClass: PriceService, provide: 'PRICE_SERVICE' }],
   exports: ['PRICE_SERVICE'],
})
export class PriceModule {}
