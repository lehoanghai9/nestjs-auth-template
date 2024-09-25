import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeConfig } from './config';
import { StripeException } from './stripe.exception';
import { calculateTrialEndDate, calculateTrialEndUnixTimestamp } from './utils';

type CustomerDetails = {
   userId: string;
   email: string;
   name?: string;
   stripeCustomerId?: string;
};

@Injectable()
export class StripeService {
   private readonly stripe: Stripe;
   private readonly logger = new Logger('<>StripeService<>');
   private readonly stripeWebhookSecret: string;

   constructor(private readonly configService: ConfigService) {
      const stripeSecretKey =
         this.configService.get<string>('STRIPE_SECRET_KEY');

      this.stripeWebhookSecret = this.configService.get<string>(
         'STRIPE_WEBHOOK_SECRET',
      );
      if (!stripeSecretKey || !this.stripeWebhookSecret) {
         throw new Error('Stripe secret key or webhook secret not found');
      }
      this.stripe = new Stripe(stripeSecretKey, {
         apiVersion: '2024-06-20',
      });
   }

   validateWebhookSignature(payload: Buffer, signature: string | string[]) {
      try {
         const event = this.stripe.webhooks.constructEvent(
            payload,
            signature,
            this.stripeWebhookSecret,
         );
         return event;
      } catch (error) {
         this.logger.warn('Webhook signature validation failed');
         throw new StripeException(
            error,
            'Webhook signature validation failed',
         );
      }
   }

   async createOrRetrieveCustomerId(customerDetails: CustomerDetails) {
      this.logger.log(
         `Attempting to create or retrieve customer ID for user: ${customerDetails.userId}`,
      );

      // Retrieve the Stripe customer ID, with email fallback
      let stripeCustomerId = await this.retrieveCustomerId(
         customerDetails.stripeCustomerId,
         customerDetails.email,
      );

      // If no Stripe customer ID is found, create a new customer
      if (!stripeCustomerId) {
         this.logger.log(
            `No existing Stripe customer ID found for user: ${customerDetails.userId}. Creating a new customer.`,
         );
         stripeCustomerId = await this.createCustomerId(customerDetails);
      } else {
         this.logger.log(
            `Found existing Stripe customer ID for user: ${customerDetails.userId}`,
         );
      }

      return stripeCustomerId;
   }

   async retrieveCustomerId(stripeCustomerId?: string, email?: string) {
      this.logger.log(
         `Retrieving customer ID. Provided Stripe customer ID: ${stripeCustomerId}, email: ${email}`,
      );

      let retrievedStripeCustomerId: string | undefined;
      if (stripeCustomerId) {
         try {
            const existingStripeCustomer =
               await this.stripe.customers.retrieve(stripeCustomerId);
            retrievedStripeCustomerId = existingStripeCustomer.id;
            this.logger.log(
               `Retrieved Stripe customer ID: ${retrievedStripeCustomerId} for provided Stripe customer ID: ${stripeCustomerId}`,
            );
         } catch (error) {
            this.logger.warn('Error retrieving Stripe customer ID');
            this.logger.warn('Provided Stripe customer ID: ', stripeCustomerId);
            throw new StripeException(
               error,
               'Error retrieving Stripe customer ID',
            );
         }
      } else if (email) {
         try {
            const stripeCustomers = await this.stripe.customers.list({
               email,
            });
            retrievedStripeCustomerId =
               stripeCustomers.data.length > 0
                  ? stripeCustomers.data[0].id
                  : undefined;
            this.logger.log(
               `Retrieved Stripe customer ID: ${retrievedStripeCustomerId} for provided email: ${email}`,
            );
         } catch (error) {
            this.logger.warn('Error retrieving Stripe customer ID');
            this.logger.warn('Provided email: ', email);
            throw new StripeException(
               error,
               'Error retrieving Stripe customer ID',
            );
         }
      }

      return retrievedStripeCustomerId;
   }

   async createCheckoutSession(
      stripePriceId: string,
      quantity: number,
      stripeCustomerId?: string,
      trialPeriodDays: number = 0,
   ) {
      this.logger.log(
         `Initiating checkout session creation with price: ${stripePriceId}, customer: ${stripeCustomerId}`,
      );

      const price = await this.retrievePrice(stripePriceId);

      let params: Stripe.Checkout.SessionCreateParams = {
         allow_promotion_codes: true,
         billing_address_collection: 'required',
         locale: 'hu',
         customer: stripeCustomerId,
         customer_update: {
            address: 'auto',
         },
         line_items: [
            {
               price: price.id,
               quantity: 1, //TODO: This can be changed to allow for multiple quantities
            },
         ],
         cancel_url: StripeConfig.defaultCancelUrl,
         success_url: StripeConfig.defaultSuccessUrl,
      };

      console.log(trialPeriodDays);

      if (trialPeriodDays > 0) {
         this.logger.log(
            `Trial end date: ${calculateTrialEndDate(trialPeriodDays).toISOString()}`,
         );
      }

      if (price.type === 'recurring') {
         params = {
            ...params,
            mode: 'subscription',
            subscription_data: {
               trial_end: calculateTrialEndUnixTimestamp(trialPeriodDays),
            },
         };
      } else if (price.type === 'one_time') {
         params = {
            ...params,
            mode: 'payment',
         };
      }

      try {
         this.logger.debug(
            'Creating checkout session with parameters: ' +
               JSON.stringify(params),
         );
         const session = await this.stripe.checkout.sessions.create(params);
         this.logger.log(`Checkout session created with ID: ${session.id}`);
         return session;
      } catch (error) {
         this.logger.warn('Error creating checkout session');
         throw new StripeException(error, 'Error creating checkout session');
      }
   }

   async retrievePrice(stripePriceId: string) {
      this.logger.log(`Retrieving price with ID: ${stripePriceId}`);
      try {
         const price = await this.stripe.prices.retrieve(stripePriceId);
         this.logger.log(`Retrieved price: ${price.id}`);
         return price;
      } catch (error) {
         this.logger.warn('Error retrieving price');
         throw new StripeException(error, 'Error retrieving price');
      }
   }

   private async createCustomerId(customerDetails: CustomerDetails) {
      this.logger.log(
         `Creating new Stripe customer for user: ${customerDetails.userId}`,
      );

      const customerData: Stripe.CustomerCreateParams = {
         email: customerDetails.email,
         name: customerDetails.name,
         preferred_locales: StripeConfig.preferredDefaultLocales,
         metadata: {
            userId: customerDetails.userId,
         },
      };

      try {
         const newCustomer = await this.stripe.customers.create(customerData);
         if (!newCustomer) {
            throw new Error('Stripe customer creation failed');
         }

         this.logger.log(
            `Successfully created new Stripe customer with ID: ${newCustomer.id} for user: ${customerDetails.userId}`,
         );
         return newCustomer.id;
      } catch (error) {
         this.logger.error('Error creating Stripe customer', error);
         throw new StripeException(error, 'Error creating Stripe customer');
      }
   }
}
