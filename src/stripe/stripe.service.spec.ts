import { Test, TestingModule } from '@nestjs/testing';
import { CustomerDetails, StripeService } from './stripe.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
   calculateTrialEndUnixTimestamp,
   generateStripeSignature,
} from './utils';
import Stripe from 'stripe';
import { StripeConfig } from './config';
import { StripeException } from './stripe.exception';
import { TypedConfigModule } from '../config/config.module';
import { TypedConfigService } from '../config/config.service';

describe('StripeService', () => {
   let service: StripeService;
   let configService: TypedConfigService;
   let stripeWebhookSecret: string;

   beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
         imports: [TypedConfigModule],
         providers: [StripeService],
      }).compile();

      service = module.get<StripeService>(StripeService);
      configService = module.get<TypedConfigService>(TypedConfigService);
      stripeWebhookSecret = configService.get('stripe.webhook-secret');
   });

   const mockExistingStripeCustomer = {
      id: 'cus_NffrFeUfNV2Hib',
      object: 'customer',
      address: null,
      balance: 0,
      created: 1680893993,
      currency: null,
      default_source: null,
      delinquent: false,
      description: null,
      discount: null,
      email: 'jennyrosen@example.com',
      invoice_prefix: '0759376C',
      invoice_settings: {
         custom_fields: null,
         default_payment_method: null,
         footer: null,
         rendering_options: null,
      },
      livemode: false,
      metadata: {},
      name: 'Jenny Rosen',
      next_invoice_sequence: 1,
      phone: null,
      preferred_locales: [],
      shipping: null,
      tax_exempt: 'none',
      test_clock: null,
   };

   const mockNewStripeCustomer = {
      id: 'cus_XXXXXXX',
      object: 'customer',
      address: null,
      balance: 0,
      created: 1680893993,
      currency: null,
      default_source: null,
      delinquent: false,
      description: null,
      discount: null,
      email: 'newcustomer@gmail.com',
      invoice_prefix: '0759376C',
      invoice_settings: {
         custom_fields: null,
         default_payment_method: null,
         footer: null,
         rendering_options: null,
      },
      livemode: false,
      metadata: {},
      name: 'Jenny Rosen',
      next_invoice_sequence: 1,
      phone: null,
      preferred_locales: [],
      shipping: null,
      tax_exempt: 'none',
      test_clock: null,
   };

   const mockExistingStripePrice = {
      id: 'price_1MoBy5LkdIwHu7ixZhnattbh',
      object: 'price',
      active: true,
      billing_scheme: 'per_unit',
      created: 1679431181,
      currency: 'usd',
      custom_unit_amount: null,
      livemode: false,
      lookup_key: null,
      metadata: {},
      nickname: null,
      product: 'prod_NZKdYqrwEYx6iK',
      recurring: {
         aggregate_usage: null,
         interval: 'month',
         interval_count: 1,
         trial_period_days: null,
         usage_type: 'licensed',
      },
      tax_behavior: 'unspecified',
      tiers_mode: null,
      transform_quantity: null,
      type: 'recurring',
      unit_amount: 1000,
      unit_amount_decimal: '1000',
   };

   const mockStripeCheckoutSession = {
      id: 'cs_test_a11YYufWQzNY63zpQ6QSNRQhkUpVph4WRmzW0zWJO2znZKdVujZ0N0S22u',
      object: 'checkout.session',
      after_expiration: null,
      allow_promotion_codes: null,
      amount_subtotal: 2198,
      amount_total: 2198,
      automatic_tax: {
         enabled: false,
         liability: null,
         status: null,
      },
      billing_address_collection: null,
      cancel_url: null,
      client_reference_id: null,
      consent: null,
      consent_collection: null,
      created: 1679600215,
      currency: 'usd',
      custom_fields: [],
      custom_text: {
         shipping_address: null,
         submit: null,
      },
      customer: null,
      customer_creation: 'if_required',
      customer_details: null,
      customer_email: null,
      expires_at: 1679686615,
      invoice: null,
      invoice_creation: {
         enabled: false,
         invoice_data: {
            account_tax_ids: null,
            custom_fields: null,
            description: null,
            footer: null,
            issuer: null,
            metadata: {},
            rendering_options: null,
         },
      },
      livemode: false,
      locale: null,
      metadata: {},
      mode: 'payment',
      payment_intent: null,
      payment_link: null,
      payment_method_collection: 'always',
      payment_method_options: {},
      payment_method_types: ['card'],
      payment_status: 'unpaid',
      phone_number_collection: {
         enabled: false,
      },
      recovered_from: null,
      setup_intent: null,
      shipping_address_collection: null,
      shipping_cost: null,
      shipping_details: null,
      shipping_options: [],
      status: 'open',
      submit_type: null,
      subscription: null,
      success_url: 'https://example.com/success',
      total_details: {
         amount_discount: 0,
         amount_shipping: 0,
         amount_tax: 0,
      },
      url: 'https://checkout.stripe.com/c/pay/cs_test_a11YYufWQzNY63zpQ6QSNRQhkUpVph4WRmzW0zWJO2znZKdVujZ0N0S22u#fidkdWxOYHwnPyd1blpxYHZxWjA0SDdPUW5JbmFMck1wMmx9N2BLZjFEfGRUNWhqTmJ%2FM2F8bUA2SDRySkFdUV81T1BSV0YxcWJcTUJcYW5rSzN3dzBLPUE0TzRKTTxzNFBjPWZEX1NKSkxpNTVjRjN8VHE0YicpJ2N3amhWYHdzYHcnP3F3cGApJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl',
   };

   const mockRetriveStripeCustomerId = jest.fn(
      async (stripeCustomerId?: string, email?: string) => {
         if (mockExistingStripeCustomer.id === stripeCustomerId) {
            return stripeCustomerId;
         }

         if (mockExistingStripeCustomer.email === email) {
            return mockExistingStripeCustomer.id;
         }

         return null;
      },
   );

   const mockCreateStripeCustomerId = jest.fn(
      async (customerDetails: CustomerDetails) => {
         return mockNewStripeCustomer.id;
      },
   );

   it('should be defined', () => {
      expect(service).toBeDefined();
   });

   describe('validateWebhookSignature', () => {
      it('should throw an error if signature is invalid (format is bad)', () => {
         const payload = Buffer.from('payload');
         const signature = 'signature';
         expect(() =>
            service.validateWebhookSignature(payload, signature),
         ).toThrow(Error);
      });

      it('should throw an error if signature is invalid (format is good, but the stripe key is invalid)', () => {
         const payload = { foo: 'bar' };
         const payloadBuffer = Buffer.from(JSON.stringify(payload));

         const stripeSecret = 'fake-stripe-key';
         const stripe = new Stripe(stripeWebhookSecret, {
            apiVersion: '2024-06-20',
         });
         const fakeSignature = generateStripeSignature(
            stripe,
            payload,
            stripeSecret,
         );
         expect(() =>
            service.validateWebhookSignature(payloadBuffer, fakeSignature),
         ).toThrow(Error);
      });

      it('should return the event if the signature is valid and the payload is valid, and returns the event', () => {
         const payload = { foo: 'bar' };
         const payloadBuffer = Buffer.from(JSON.stringify(payload));

         const stripe = new Stripe(stripeWebhookSecret, {
            apiVersion: '2024-06-20',
         });
         const signature = generateStripeSignature(
            stripe,
            payload,
            stripeWebhookSecret,
         );
         const event = service.validateWebhookSignature(
            payloadBuffer,
            signature,
         );
         expect(event).toBeDefined();
         expect(event).toEqual(payload);
      });
   });

   describe('createOrRetrieveCustomerId', () => {
      it('should return the Stripe customer ID if it exists by passing the existing customerId', async () => {
         jest
            .spyOn(service, 'retrieveCustomerId')
            .mockImplementation(mockRetriveStripeCustomerId);
         jest
            .spyOn(service, 'createCustomerId')
            .mockImplementation(mockCreateStripeCustomerId);
         const customerDetails = {
            userId: '1',
            email: mockExistingStripeCustomer.email,
            stripeCustomerId: mockExistingStripeCustomer.id,
         };

         const stripeCustomerId =
            await service.createOrRetrieveCustomerId(customerDetails);

         expect(stripeCustomerId).toEqual(mockExistingStripeCustomer.id);
         expect(service.createCustomerId).not.toHaveBeenCalled();
         expect(service.retrieveCustomerId).toHaveBeenCalledTimes(1);
      });

      it('should return the Stripe customer ID if it exists by passing the email', async () => {
         jest
            .spyOn(service, 'retrieveCustomerId')
            .mockImplementation(mockRetriveStripeCustomerId);
         jest
            .spyOn(service, 'createCustomerId')
            .mockImplementation(mockCreateStripeCustomerId);
         const customerDetails = {
            userId: '1',
            email: mockExistingStripeCustomer.email,
            stripeCustomerId: mockExistingStripeCustomer.id,
         };

         const stripeCustomerId =
            await service.createOrRetrieveCustomerId(customerDetails);

         expect(stripeCustomerId).toEqual(mockExistingStripeCustomer.id);
         expect(service.createCustomerId).not.toHaveBeenCalled();
         expect(service.retrieveCustomerId).toHaveBeenCalledTimes(1);
         expect(service.retrieveCustomerId).toHaveBeenCalledWith(
            mockExistingStripeCustomer.id,
            mockExistingStripeCustomer.email,
         );
      });

      it("should create and return return a new Stripe customer ID if it doesn't exist", async () => {
         jest
            .spyOn(service, 'retrieveCustomerId')
            .mockImplementation(mockRetriveStripeCustomerId);
         jest
            .spyOn(service, 'createCustomerId')
            .mockImplementation(mockCreateStripeCustomerId);
         const customerDetails = {
            userId: '1',
            email: 'newEmail@gmail.com',
            stripeCustomerId: '',
         } as CustomerDetails;

         const stripeCustomerId =
            await service.createOrRetrieveCustomerId(customerDetails);

         expect(stripeCustomerId).toEqual(mockNewStripeCustomer.id);
         expect(service.retrieveCustomerId).toHaveBeenCalledTimes(1);
         expect(service.createCustomerId).toHaveBeenCalledTimes(1);
         expect(service.createCustomerId).toHaveBeenCalledWith(customerDetails);
      });
   });

   describe('retrieveCustomerId', () => {
      it('should retrieve the customer ID using the provided Stripe customer ID', async () => {
         const mockRetrieve = jest
            .fn()
            .mockResolvedValue(mockExistingStripeCustomer);
         service['stripe'].customers.retrieve = mockRetrieve;

         const stripeCustomerId = await service.retrieveCustomerId(
            mockExistingStripeCustomer.id,
         );

         expect(stripeCustomerId).toEqual(mockExistingStripeCustomer.id);
         expect(mockRetrieve).toHaveBeenCalledWith(
            mockExistingStripeCustomer.id,
         );
      });

      it('should retrieve the customer ID using the provided email', async () => {
         const mockList = jest
            .fn()
            .mockResolvedValue({ data: [mockExistingStripeCustomer] });
         service['stripe'].customers.list = mockList;

         const stripeCustomerId = await service.retrieveCustomerId(
            undefined,
            mockExistingStripeCustomer.email,
         );

         expect(stripeCustomerId).toEqual(mockExistingStripeCustomer.id);
         expect(mockList).toHaveBeenCalledWith({
            email: mockExistingStripeCustomer.email,
         });
      });

      it('should return undefined if no customer is found with the provided email', async () => {
         const mockList = jest.fn().mockResolvedValue({ data: [] });
         service['stripe'].customers.list = mockList;

         const stripeCustomerId = await service.retrieveCustomerId(
            undefined,
            'nonexistent@example.com',
         );

         expect(stripeCustomerId).toBeUndefined();
         expect(mockList).toHaveBeenCalledWith({
            email: 'nonexistent@example.com',
         });
      });

      it('should throw an error if retrieving customer by ID fails', async () => {
         const mockRetrieve = jest
            .fn()
            .mockRejectedValue(new Error('Retrieve error'));
         service['stripe'].customers.retrieve = mockRetrieve;

         await expect(
            service.retrieveCustomerId(mockExistingStripeCustomer.id),
         ).rejects.toThrow('Error retrieving Stripe customer ID');
         expect(mockRetrieve).toHaveBeenCalledWith(
            mockExistingStripeCustomer.id,
         );
      });

      it('should throw an error if retrieving customer by email fails', async () => {
         const mockList = jest.fn().mockRejectedValue(new Error('List error'));
         service['stripe'].customers.list = mockList;

         await expect(
            service.retrieveCustomerId(
               undefined,
               mockExistingStripeCustomer.email,
            ),
         ).rejects.toThrow('Error retrieving Stripe customer ID');
         expect(mockList).toHaveBeenCalledWith({
            email: mockExistingStripeCustomer.email,
         });
      });
   });

   describe('createCustomerId', () => {
      it('should create a new Stripe customer and return the customer ID', async () => {
         const mockCreate = jest.fn().mockResolvedValue(mockNewStripeCustomer);
         service['stripe'].customers.create = mockCreate;

         const customerDetails: CustomerDetails = {
            userId: '2',
            email: 'newcustomer@gmail.com',
            name: 'New Customer',
         };

         const stripeCustomerId =
            await service.createCustomerId(customerDetails);

         expect(stripeCustomerId).toEqual(mockNewStripeCustomer.id);
         expect(mockCreate).toHaveBeenCalledWith({
            email: customerDetails.email,
            name: customerDetails.name,
            preferred_locales: StripeConfig.preferredDefaultLocales,
            metadata: {
               userId: customerDetails.userId,
            },
         });
      });

      it('should throw an error if Stripe customer creation fails', async () => {
         const mockCreate = jest
            .fn()
            .mockRejectedValue(new Error('Create error'));
         service['stripe'].customers.create = mockCreate;

         const customerDetails: CustomerDetails = {
            userId: '2',
            email: 'newcustomer@gmail.com',
            name: 'New Customer',
         };

         await expect(
            service.createCustomerId(customerDetails),
         ).rejects.toThrow('Error creating Stripe customer');
         expect(mockCreate).toHaveBeenCalledWith({
            email: customerDetails.email,
            name: customerDetails.name,
            preferred_locales: StripeConfig.preferredDefaultLocales,
            metadata: {
               userId: customerDetails.userId,
            },
         });
      });
   });

   describe('retrievePrice', () => {
      it('should retrieve the price with the provided ID', async () => {
         const mockRetrieve = jest
            .fn()
            .mockResolvedValue(mockExistingStripePrice);
         service['stripe'].prices.retrieve = mockRetrieve;

         const price = await service.retrievePrice(mockExistingStripePrice.id);

         expect(price).toEqual(mockExistingStripePrice);
         expect(mockRetrieve).toHaveBeenCalledWith(mockExistingStripePrice.id);
      });

      it('should throw an error if retrieving the price fails', async () => {
         const mockRetrieve = jest
            .fn()
            .mockRejectedValue(new Error('Retrieve error'));
         service['stripe'].prices.retrieve = mockRetrieve;

         await expect(
            service.retrievePrice(mockExistingStripePrice.id),
         ).rejects.toThrow('Error retrieving price');
         expect(mockRetrieve).toHaveBeenCalledWith(mockExistingStripePrice.id);
      });
   });

   describe('createCheckoutSession', () => {
      const mockStripePriceId = 'price_1MoBy5LkdIwHu7ixZhnattbh';
      const mockStripeCustomerId = 'cus_NffrFeUfNV2Hib';
      const mockQuantity = 1;
      const mockTrialPeriodDays = 7;

      const mockPrice = {
         id: mockStripePriceId,
         object: 'price',
         type: 'recurring',
      } as Stripe.Response<Stripe.Price>;

      beforeEach(() => {
         jest.clearAllMocks();
      });

      it('should create a checkout session for a recurring price', async () => {
         jest.spyOn(service, 'retrievePrice').mockResolvedValue(mockPrice);
         const mockCreateSession = jest
            .fn()
            .mockResolvedValue(mockStripeCheckoutSession);
         service['stripe'].checkout.sessions.create = mockCreateSession;

         const session = await service.createCheckoutSession(
            mockStripePriceId,
            mockQuantity,
            mockStripeCustomerId,
            mockTrialPeriodDays,
         );

         expect(session).toEqual(mockStripeCheckoutSession);
         expect(service.retrievePrice).toHaveBeenCalledWith(mockStripePriceId);
         expect(mockCreateSession).toHaveBeenCalledWith(
            expect.objectContaining({
               mode: 'subscription',
               customer: mockStripeCustomerId,
               line_items: [
                  {
                     price: mockStripePriceId,
                     quantity: mockQuantity,
                  },
               ],
               subscription_data: {
                  trial_end: expect.any(Number),
               },
            }),
         );
      });

      it('should create a checkout session for a one-time price', async () => {
         const oneTimePrice = {
            ...mockPrice,
            type: 'one_time',
         } as Stripe.Response<Stripe.Price>;
         jest.spyOn(service, 'retrievePrice').mockResolvedValue(oneTimePrice);
         const mockCreateSession = jest
            .fn()
            .mockResolvedValue(mockStripeCheckoutSession);
         service['stripe'].checkout.sessions.create = mockCreateSession;

         const session = await service.createCheckoutSession(
            mockStripePriceId,
            mockQuantity,
            mockStripeCustomerId,
         );

         expect(session).toEqual(mockStripeCheckoutSession);
         expect(service.retrievePrice).toHaveBeenCalledWith(mockStripePriceId);
         expect(mockCreateSession).toHaveBeenCalledWith(
            expect.objectContaining({
               mode: 'payment',
               customer: mockStripeCustomerId,
               line_items: [
                  {
                     price: mockStripePriceId,
                     quantity: mockQuantity,
                  },
               ],
            }),
         );
      });

      it('should throw an error if creating the checkout session fails', async () => {
         jest.spyOn(service, 'retrievePrice').mockResolvedValue(mockPrice);
         const mockCreateSession = jest
            .fn()
            .mockRejectedValue(new Error('Create session error'));
         service['stripe'].checkout.sessions.create = mockCreateSession;

         await expect(
            service.createCheckoutSession(
               mockStripePriceId,
               mockQuantity,
               mockStripeCustomerId,
               mockTrialPeriodDays,
            ),
         ).rejects.toThrow('Error creating checkout session');

         expect(service.retrievePrice).toHaveBeenCalledWith(mockStripePriceId);
         expect(mockCreateSession).toHaveBeenCalledWith(
            expect.objectContaining({
               mode: 'subscription',
               customer: mockStripeCustomerId,
               line_items: [
                  {
                     price: mockStripePriceId,
                     quantity: mockQuantity,
                  },
               ],
               subscription_data: {
                  trial_end: expect.any(Number),
               },
            }),
         );
      });
   });

   describe('stripe utilities', () => {
      describe('calculateTrialEndUnixTimestamp', () => {
         it('should return undefined if the trial period is null, undefined, or less than 2 days', () => {
            expect(calculateTrialEndUnixTimestamp(null)).toBeUndefined();
            expect(calculateTrialEndUnixTimestamp(undefined)).toBeUndefined();
            expect(calculateTrialEndUnixTimestamp(1)).toBeUndefined();
         });
      });
   });

   describe('retrieveSubscription', () => {
      it('should retrieve a subscription successfully', async () => {
        const subscriptionId = 'sub_123';
        const mockSubscription = { id: subscriptionId, default_payment_method: {} } as Stripe.Response<Stripe.Subscription>;
        jest.spyOn(service, 'retrieveSubscription').mockResolvedValue(mockSubscription);
  
        const result = await service.retrieveSubscription(subscriptionId);
        expect(result).toEqual(mockSubscription);
      });
  
      it('should throw a StripeException when an error occurs', async () => {
        const subscriptionId = 'sub_123';
        const mockError = new StripeException('Stripe error');
        jest.spyOn(service, 'retrieveSubscription').mockRejectedValue(mockError);
  
        await expect(service.retrieveSubscription(subscriptionId)).rejects.toThrow(StripeException);
      });
    });
  
    describe('updateCustomerBillingDetails', () => {
      it('should update customer billing details successfully', async () => {
        const paymentMethod = {
          customer: 'cus_123',
          billing_details: {
            name: 'John Doe',
            phone: '1234567890',
            address: {
              line1: '123 Main St',
              city: 'Anytown',
              state: 'CA',
              postal_code: '12345',
              country: 'US',
            },
          },
        } as Stripe.Response<Stripe.PaymentMethod>;

  
        const mockCustomer = { id: 'cus_123' } as Stripe.Response<Stripe.Customer>;
        jest.spyOn(service, 'updateCustomerBillingDetails').mockResolvedValue(mockCustomer);
  
        const result = await service.updateCustomerBillingDetails(paymentMethod);
        expect(result).toEqual(mockCustomer);
      });
  
      it('should log a message and return if billing details are missing', async () => {
        const paymentMethod = {
          customer: 'cus_123',
          billing_details: {
            name: null,
            phone: null,
            address: null,
          },
        } as Stripe.PaymentMethod;
  
        const result = await service.updateCustomerBillingDetails(paymentMethod);
        expect(result).toBeUndefined();
      });
  
      it('should throw a StripeException when an error occurs', async () => {
        const paymentMethod = {
          customer: 'cus_123',
          billing_details: {
            name: 'John Doe',
            phone: '1234567890',
            address: {
              line1: '123 Main St',
              city: 'Anytown',
              state: 'CA',
              postal_code: '12345',
              country: 'US',
            },
          },
        } as Stripe.PaymentMethod;
  
        const mockError = new StripeException('Stripe error');
        jest.spyOn(service, 'updateCustomerBillingDetails').mockRejectedValue(mockError);
  
        await expect(service.updateCustomerBillingDetails(paymentMethod)).rejects.toThrow(StripeException);
      });
    });

    describe('createPortalSession', () => {
      it('should create a portal session successfully', async () => {
        const stripeCustomerId = 'cus_123';
        const mockSession = "https://example.com"
        jest.spyOn(service, 'createPortalSession').mockResolvedValue(mockSession);
  
        const result = await service.createPortalSession(stripeCustomerId);
        expect(result).toEqual(mockSession);
      });
  
      it('should throw a StripeException when an error occurs', async () => {
        const stripeCustomerId = 'cus_123';
        const mockError = new StripeException("Stripe error");
        jest.spyOn(service, 'createPortalSession').mockRejectedValue(mockError);
  
        await expect(service.createPortalSession(stripeCustomerId)).rejects.toThrow(StripeException);
      });
    });
});
