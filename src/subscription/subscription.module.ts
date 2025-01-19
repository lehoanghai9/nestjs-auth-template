import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionEntity } from '../database/subscription.entity';
import { CustomerModule } from 'src/customer/customer.module';
import { StripeModule } from 'src/stripe/stripe.module';
import { PriceModule } from 'src/price/price.module';
import { UserModule } from 'src/user/user.module';

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
