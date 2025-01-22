import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionEntity } from '../database/subscription.entity';
import { CustomerModule } from '../customer/customer.module';
import { StripeModule } from '../stripe/stripe.module';
import { PriceModule } from '../price/price.module';
import { UserModule } from '../user/user.module';

@Module({
   imports: [
      TypeOrmModule.forFeature([SubscriptionEntity]),
      CustomerModule,
      StripeModule,
      PriceModule,
      UserModule,
   ],
   controllers: [SubscriptionController],
   providers: [
      { useClass: SubscriptionService, provide: 'SUBSCRIPTION_SERVICE' },
   ],
   exports: ['SUBSCRIPTION_SERVICE'],
})
export class SubscriptionModule {}
