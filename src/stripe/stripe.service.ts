import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

type CustomerDetails = {
   userId: string;
   email: string;
   name?: string;
   stripeCustomerId?: string;
};

@Injectable()
export class StripeService {
   private readonly stripe: Stripe;
   private readonly logger = new Logger('StripeService');
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
         this.logger.error('Webhook signature validation failed');
         this.logger.error('Error: ', error);
         throw new Error('Webhook signature validation failed');
      }
   }

   async createOrRetrieveCustomerId(customerDetails: CustomerDetails) {
      // Retrieve the Stripe customer ID using the Supabase customer ID, with email fallback
      let stripeCustomerId = await this.retrieveCustomerId(
         customerDetails.stripeCustomerId,
         customerDetails.email,
      );

      // If no Stripe customer ID is found, create a new customer
      if (!stripeCustomerId) {
         stripeCustomerId = await this.createCustomerId(customerDetails);
      }

      return stripeCustomerId;
   }

   async retrieveCustomerId(stripeCustomerId?: string, email?: string) {
      let retrievedStripeCustomerId: string | undefined;
      if (stripeCustomerId) {
         const existingStripeCustomer =
            await this.stripe.customers.retrieve(stripeCustomerId);
         retrievedStripeCustomerId = existingStripeCustomer.id;
      } else if (email) {
         const stripeCustomers = await this.stripe.customers.list({
            email,
         });
         retrievedStripeCustomerId =
            stripeCustomers.data.length > 0
               ? stripeCustomers.data[0].id
               : undefined;
      }

      return retrievedStripeCustomerId;
   }

   async checkout(price) {}

   private async createCustomerId(customerDetails: CustomerDetails) {
      const customerData: Stripe.CustomerCreateParams = {
         email: customerDetails.email,
         name: customerDetails.name,
         metadata: {
            userId: customerDetails.userId,
         },
      };

      const newCustomer = await this.stripe.customers.create(customerData);

      if (!newCustomer) {
         this.logger.error('Stripe customer creation failed');
         this.logger.error('Customer data: ', customerData);
         throw new Error('Stripe customer creation failed');
      }

      return newCustomer.id;
   }
}
