import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { toDateTime } from '../common/utils/dates';
import { CustomerService } from '../customer/customer.service';
import {
   SubscriptionEntity,
   SubscriptionStatus,
} from '../database/subscription.entity';
import { StripeService } from '../stripe/stripe.service';
import { Repository } from 'typeorm';
import { PriceService } from 'src/price/price.service';
import Stripe from 'stripe';
import { UserService } from 'src/user/user.service';

@Injectable()
export class SubscriptionService {
   private readonly logger = new Logger('<>SubscriptionService<>');

   constructor(
      @InjectRepository(SubscriptionEntity)
      private readonly subscriptionRepository: Repository<SubscriptionEntity>,
      @Inject('CUSTOMER_SERVICE')
      private readonly customerService: CustomerService,
      @Inject('STRIPE_SERVICE')
      private readonly stripeService: StripeService,
      @Inject('PRICE_SERVICE')
      private readonly priceService: PriceService,
      @Inject('USER_SERVICE')
      private readonly userService: UserService,
   ) {}

   async manageSubscriptionStatusChange(
      subscriptionId: string,
      stripeCustomerId: string,
      createAction = false,
   ) {
      this.logger.log(
         `Starting manageSubscriptionStatusChange for subscriptionId: ${subscriptionId}`,
      );
      const customer =
         await this.customerService.findByStripeCustomerId(stripeCustomerId);

      if (!customer) {
         this.logger.error(
            `Customer with stripeCustomerId ${stripeCustomerId} not found`,
         );
         throw new NotFoundException(`Customer not found`);
      }

      const stripeSubscription =
         await this.stripeService.retrieveSubscription(subscriptionId);

      const price = await this.priceService.findPrice(
         stripeSubscription.items.data[0].price.id,
      );

      if (!price) {
         this.logger.error(
            `Price not found ${stripeSubscription.items.data[0].price.id}`,
         );
         throw new NotFoundException(`Price not found`);
      }

      const status = stripeSubscription.status as SubscriptionStatus;

      const DBSubscription: SubscriptionEntity = {
         id: stripeSubscription.id,
         user: customer.user,
         metadata: stripeSubscription.metadata,
         status: status,
         price: price,
         quantity: stripeSubscription.items.data[0].quantity,
         cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
         cancelAt: stripeSubscription.cancel_at
            ? toDateTime(stripeSubscription.cancel_at)
            : null,
         canceledAt: stripeSubscription.canceled_at
            ? toDateTime(stripeSubscription.canceled_at)
            : null,
         currentPeriodStart: toDateTime(
            stripeSubscription.current_period_start,
         ),
         currentPeriodEnd: toDateTime(stripeSubscription.current_period_end),
         created: toDateTime(stripeSubscription.created),
         endedAt: stripeSubscription.ended_at
            ? toDateTime(stripeSubscription.ended_at)
            : null,
         trialStart: stripeSubscription.trial_start
            ? toDateTime(stripeSubscription.trial_start)
            : null,
         trialEnd: stripeSubscription.trial_end
            ? toDateTime(stripeSubscription.trial_end)
            : null,
      };

      this.logger.log('Upserting subscription');
      this.logger.log(DBSubscription);

      await this.subscriptionRepository.upsert(DBSubscription, {
         conflictPaths: ['id'],
         skipUpdateIfNoValuesChanged: true,
      });

      this.logger.log('Updating user billing details');

      const paymentMethod =
         stripeSubscription.default_payment_method as Stripe.PaymentMethod;

      if (createAction && paymentMethod && customer.user.id) {
         await this.stripeService.updateCustomerBillingDetails(
            stripeSubscription.default_payment_method as Stripe.PaymentMethod,
         );

         await this.userService.updateBillingDetails(
            customer.user.id,
            {
               ...paymentMethod.billing_details.address,
            },
            { ...paymentMethod[paymentMethod.type] },
         );
      }
   }
}
