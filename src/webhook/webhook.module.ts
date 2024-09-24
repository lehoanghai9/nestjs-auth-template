import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { ProductModule } from 'src/product/product.module';
import { StripeModule } from 'src/stripe/stripe.module';
import { PriceModule } from 'src/price/price.module';

@Module({
  imports: [ProductModule, StripeModule, PriceModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
