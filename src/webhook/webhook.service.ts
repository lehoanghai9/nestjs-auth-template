import {
   BadRequestException,
   Inject,
   Injectable,
   Logger,
} from '@nestjs/common';
import { ProductService } from '../product/product.service';
import Stripe from 'stripe';
import { stripeRelevantEvents } from './config';
import { ProductDto } from '../product/dtos/product.dto';
import { PriceDto } from '../price/dtos/price.dto';
import { PricingPlanInterval, PricingType } from '../database/price.entity';
import { PriceService } from '../price/price.service';
import { SubscriptionService } from 'src/subscription/subscription.service';

@Injectable()
export class WebhookService {
   private readonly logger = new Logger('<>WebhookService<>');
   constructor(
      @Inject('PRODUCT_SERVICE')
      private readonly productService: ProductService,
      @Inject('PRICE_SERVICE')
      private readonly priceService: PriceService,
      @Inject('SUBSCRIPTION_SERVICE')
      private readonly subscriptionService: SubscriptionService,
   ) {}

   async handleStripeEvent(event: Stripe.Event) {
      this.logger.log(`Received Stripe event: ${event.type}`);

      if (!stripeRelevantEvents.has(event.type)) {
         this.logger.warn(`Unsupported event type: ${event.type}`);
         throw new BadRequestException(`Unsupported event type: ${event.type}`);
      }

      try {
         await this.processStripeEvent(event);
         this.logger.log(`Successfully processed event: ${event.type}`);
      } catch (error) {
         this.logger.error(
            `Error processing event: ${event.type}`,
            error.stack,
         );
         throw new BadRequestException(
            'Webhook handler failed. View your function logs.',
         );
      }

      return { message: `Webhook received and handled: ${event.type}` };
   }

   private async processStripeEvent(event: Stripe.Event) {
      this.logger.log(`Processing event: ${event.type}`);

      switch (event.type) {
         case 'product.created':
         case 'product.updated':
            this.logger.log(`Handling product event: ${event.type}`);
            await this.handleStripeProductEvent(
               event.data.object as Stripe.Product,
            );
            break;
         case 'price.created':
         case 'price.updated':
            this.logger.log(`Handling price event: ${event.type}`);
            await this.handleStripePriceEvent(
               event.data.object as Stripe.Price,
            );
            break;
         case 'price.deleted':
            this.logger.log(`Handling price event deletion: ${event.type}`);
            await this.deleteStripePriceEvent(
               event.data.object as Stripe.Price,
            );
            break;
         case 'product.deleted':
            this.logger.log(`Handling product event deletion: ${event.type}`);
            await this.deleteStripeProductEvent(
               event.data.object as Stripe.Product,
            );
            break;
         case 'customer.subscription.created':
         case 'customer.subscription.updated':
         case 'customer.subscription.deleted':
            const subscription = event.data.object as Stripe.Subscription;
            await this.handleStripeSubscriptionEvent(
               subscription.id,
               subscription.customer as string,
               event.type === 'customer.subscription.created',
            );
            break;
         case 'checkout.session.completed':
            const checkoutSession = event.data
               .object as Stripe.Checkout.Session;
            if (checkoutSession.mode === 'subscription') {
               const subscriptionId = checkoutSession.subscription;
               await this.handleStripeSubscriptionEvent(
                  subscriptionId as string,
                  checkoutSession.customer as string,
                  true,
               );
            }
            break;
         default:
            this.logger.warn(`Unhandled event type: ${event.type}`);
      }
   }

   private async handleStripeProductEvent(stripeProduct: Stripe.Product) {
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

   private async handleStripePriceEvent(stripePrice: Stripe.Price) {
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

   private async deleteStripePriceEvent(stripePrice: Stripe.Price) {
      this.logger.log(`Deleting price: ${stripePrice.id}`);
      await this.priceService.deletePrice(stripePrice.id);
      this.logger.log(`Price deleted: ${stripePrice.id}`);
   }

   private async deleteStripeProductEvent(stripeProduct: Stripe.Product) {
      this.logger.log(`Deleting product: ${stripeProduct.id}`);
      await this.productService.deleteProduct(stripeProduct.id);
      this.logger.log(`Product deleted: ${stripeProduct.id}`);
   }

   private async handleStripeSubscriptionEvent(
      subscribtionId: string,
      stripeCustomerId: string,
      isCreate: boolean,
   ) {
      this.logger.log(`Handling subscription event`);
      await this.subscriptionService.manageSubscriptionStatusChange(
         subscribtionId,
         stripeCustomerId,
         isCreate,
      );
      this.logger.log(`Subscription event handled`);
   }
}
