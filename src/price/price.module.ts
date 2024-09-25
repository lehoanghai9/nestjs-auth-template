import { Module } from '@nestjs/common';
import { PriceService } from './price.service';
import { PriceController } from './price.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceEntity } from 'src/database/price.entity';
import { StripeModule } from 'src/stripe/stripe.module';
import { UserModule } from 'src/user/user.module';
import { CustomerModule } from 'src/customer/customer.module';

@Module({
   imports: [
      TypeOrmModule.forFeature([PriceEntity]),
      StripeModule,
      UserModule,
      CustomerModule,
   ],
   controllers: [PriceController],
   providers: [{ useClass: PriceService, provide: 'PRICE_SERVICE' }],
   exports: ['PRICE_SERVICE'],
})
export class PriceModule {}
