import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ProductService } from 'src/product/product.service';
import Stripe from 'stripe';
import { stripeRelevantEvents } from './config';
import { ProductDto } from 'src/product/dtos/product.dto';
import { PriceDto } from 'src/price/dtos/price.dto';
import { PricingPlanInterval, PricingType } from 'src/database/price.entity';
import { PriceService } from 'src/price/price.service';

@Injectable()
export class WebhookService {
   private readonly logger = new Logger('<>WebhookService<>');
   constructor(
      private readonly productService: ProductService,
      private readonly priceService: PriceService,
   ) {}

   async handleStripeEvent(event: Stripe.Event) {
      this.logger.log(`Received Stripe event: ${event.type}`);

      if (!stripeRelevantEvents.has(event.type)) {
         this.logger.warn(`Unsupported event type: ${event.type}`);
         throw new BadRequestException(`Unsupported event type: ${event.type}`);
      }

      try {
         await this.processEvent(event);
         this.logger.log(`Successfully processed event: ${event.type}`);
      } catch (error) {
         this.logger.error(`Error processing event: ${event.type}`, error.stack);
         throw new BadRequestException(
            'Webhook handler failed. View your function logs.',
         );
      }

      return { message: `Webhook received and handled: ${event.type}` };
   }

   private async processEvent(event: Stripe.Event) {
      this.logger.log(`Processing event: ${event.type}`);

      switch (event.type) {
         case 'product.created':
         case 'product.updated':
            this.logger.log(`Handling product event: ${event.type}`);
            await this.handleProductEvent(event.data.object as Stripe.Product);
            break;
         case 'price.created':
         case 'price.updated':
            this.logger.log(`Handling price event: ${event.type}`);
            await this.handlePriceEvent(event.data.object as Stripe.Price);
            break;
         default:
            this.logger.warn(`Unhandled event type: ${event.type}`);
      }
   }

   private async handleProductEvent(stripeProduct: Stripe.Product) {
      this.logger.log(`Handling product: ${stripeProduct.id}`);

      const productData: ProductDto = {
         id: stripeProduct.id,
         active: stripeProduct.active,
         name: stripeProduct.name,
         description: stripeProduct.description ?? null,
         images: stripeProduct.images,
         metadata: stripeProduct.metadata,
      };

      this.logger.debug(`Upserting product: ${JSON.stringify(productData)}`);
      await this.productService.upsertProduct(productData);
      this.logger.log(`Product upserted: ${stripeProduct.id}`);
   }

   private async handlePriceEvent(stripePrice: Stripe.Price) {
      this.logger.log(`Handling price: ${stripePrice.id}`);

      const pricing =
         stripePrice.type === 'recurring'
            ? PricingType.RECURRING
            : PricingType.ONE_TIME;
      const intervalMap: { [key: string]: PricingPlanInterval } = {
         day: PricingPlanInterval.DAY,
         week: PricingPlanInterval.WEEK,
         month: PricingPlanInterval.MONTH,
         year: PricingPlanInterval.YEAR,
      };
      const interval = stripePrice.recurring?.interval
         ? intervalMap[stripePrice.recurring.interval]
         : null;

      const priceData: PriceDto = {
         id: stripePrice.id,
         product_id:
            typeof stripePrice.product === 'string' ? stripePrice.product : '',
         active: stripePrice.active,
         currency: stripePrice.currency,
         type: pricing,
         unit_amount: stripePrice.unit_amount ?? null,
         interval: interval,
         interval_count: stripePrice.recurring?.interval_count ?? null,
         trial_period_days: stripePrice.recurring?.trial_period_days ?? null,
      };

      this.logger.debug(`Upserting price: ${JSON.stringify(priceData)}`);
      await this.priceService.upsertPrice(priceData);
      this.logger.log(`Price upserted: ${stripePrice.id}`);
   }
}
