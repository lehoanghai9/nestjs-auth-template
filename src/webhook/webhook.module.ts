import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { ProductModule } from '../product/product.module';
import { StripeModule } from '../stripe/stripe.module';
import { PriceModule } from '../price/price.module';
import { SubscriptionModule } from 'src/subscription/subscription.module';

@Module({
  imports: [ProductModule, StripeModule, PriceModule, SubscriptionModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
