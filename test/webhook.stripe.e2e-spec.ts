import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TestDBInitiator } from './config.e2e';
import { createTestDataSource } from './utils';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';
import { generateStripeSignature } from '../src/stripe/utils';
import { raw } from 'body-parser';
import { ProductService } from '../src/product/product.service';
import Stripe from 'stripe';

describe('webhookStripeController', () => {
   let app: INestApplication;
   let dataSource: DataSource;
   let databaseConfig: TestDBInitiator;
   let productService: ProductService;
   let stripeWebhookSecret: string;
   let stripe: Stripe;

   beforeAll(async () => {
      databaseConfig = new TestDBInitiator();
      dataSource = await createTestDataSource(databaseConfig.dbOptions);

      const moduleFixture: TestingModule = await Test.createTestingModule({
         imports: [
            TypeOrmModule.forRoot({
               ...databaseConfig.dbOptions,
               autoLoadEntities: true,
            }),
            AppModule,
         ],
      }).compile();

      const configService = moduleFixture.get(ConfigService);
      stripeWebhookSecret = configService.get<string>('STRIPE_WEBHOOK_SECRET');

      productService = moduleFixture.get<ProductService>('PRODUCT_SERVICE');
      stripe = new Stripe(stripeWebhookSecret, {
         apiVersion: '2024-06-20',
      });

      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(
         new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
         }),
      );
      app.use('/webhook/stripe', raw({ type: 'application/json' }));
      await app.init();
   });

   afterAll(async () => {
      await dataSource.destroy();
      await app.close();
   });

   const mockStripeProduct = {
      id: 'prod_QuSDM9ajyAPGkE',
      object: 'product',
      active: true,
      attributes: [],
      created: 1727201849,
      default_price: null,
      description: 'This will make you broke real quick',
      images: [],
      livemode: false,
      marketing_features: [],
      metadata: {},
      name: 'Enterprise',
      package_dimensions: null,
      shippable: null,
      statement_descriptor: null,
      tax_code: null,
      type: 'service',
      unit_label: null,
      updated: 1727201849,
      url: null,
   };

   const mockStripePrice = {
      id: 'price_1Q2dIjJyIf0rwrkKURQ6JmNQ',
      object: 'price',
      active: true,
      billing_scheme: 'per_unit',
      created: 1727201849,
      currency: 'huf',
      custom_unit_amount: null,
      livemode: false,
      lookup_key: null,
      metadata: {},
      nickname: null,
      product: 'prod_QuSDM9ajyAPGkE',
      recurring: {
         aggregate_usage: null,
         interval: 'month',
         interval_count: 1,
         meter: null,
         trial_period_days: null,
         usage_type: 'licensed',
      },
      tax_behavior: 'unspecified',
      tiers_mode: null,
      transform_quantity: null,
      type: 'recurring',
      unit_amount: 1249000,
      unit_amount_decimal: '1249000',
   };

   const mockStripePrice2 = {
      id: 'price_1Q2dKJJyIf0rwrkKsFymnxyV',
      object: 'price',
      active: true,
      billing_scheme: 'per_unit',
      created: 1727201947,
      currency: 'huf',
      custom_unit_amount: null,
      livemode: false,
      lookup_key: null,
      metadata: {},
      nickname: null,
      product: 'prod_QuSDM9ajyAPGkE',
      recurring: {
         aggregate_usage: null,
         interval: 'year',
         interval_count: 1,
         meter: null,
         trial_period_days: null,
         usage_type: 'licensed',
      },
      tax_behavior: 'unspecified',
      tiers_mode: null,
      transform_quantity: null,
      type: 'recurring',
      unit_amount: 11900000,
      unit_amount_decimal: '11900000',
   };

   describe('Stripe webhook POST /webhook/stripe (authorization check)', () => {
      it('should return 401 if signature does not exist', async () => {
         return await request(app.getHttpServer())
            .post('/webhook/stripe')
            .expect(401);
      });

      it('should return 403 if signature is invalid (not a valid signature format)', async () => {
         return await request(app.getHttpServer())
            .post('/webhook/stripe')
            .set({ 'stripe-signature': 'invalid-signature' })
            .send({ payload: 'test', signature: 'test' })
            .expect(403);
      });

      it('should return 403 if signature is invalid (signature format is good)', async () => {
         const event = { test: 'test' };
         const signature = generateStripeSignature(
            stripe,
            event,
            'whsec_invalid',
         );

         return await request(app.getHttpServer())
            .post('/webhook/stripe')
            .set({ 'stripe-signature': signature })
            .send(event)
            .expect(403);
      });

      it('should return 400 if event is not a valid Stripe event, but the signature is good', async () => {
         const event = { test: 'test' };
         const signature = generateStripeSignature(
            stripe,
            event,
            stripeWebhookSecret,
         );

         return await request(app.getHttpServer())
            .post('/webhook/stripe')
            .set({ 'stripe-signature': signature })
            .send(event)
            .expect(400);
      });
   });

   describe('Stripe webhook POST product (CREATE / UPDATE) /webhook/stripe', () => {
      it('should return 201 if event product.created is sent with product object', async () => {
         const event = {
            id: 'evt_1',
            type: 'product.created',
            data: { object: mockStripeProduct },
         };
         const signature = generateStripeSignature(
            stripe,
            event,
            stripeWebhookSecret,
         );

         return await request(app.getHttpServer())
            .post('/webhook/stripe')
            .set({ 'stripe-signature': signature })
            .send(event)
            .expect(201);
      });

      it("should exist in the database with the product's id", async () => {
         const product = await productService.findProduct(mockStripeProduct.id);
         expect(product).toBeDefined();
         expect(product.name).toBe(mockStripeProduct.name);
         expect(product.description).toBe(mockStripeProduct.description);
      });

      it('should return 201 if event product.updated is sent with product object', async () => {
         const updatedProduct = {
            ...mockStripeProduct,
            name: 'Enterprise 2.0',
            description: 'This will make you broke real quick 2.0',
         };

         const event = {
            id: 'evt_2',
            type: 'product.updated',
            data: { object: updatedProduct },
         };

         const signature = generateStripeSignature(
            stripe,
            event,
            stripeWebhookSecret,
         );

         return await request(app.getHttpServer())
            .post('/webhook/stripe')
            .set({ 'stripe-signature': signature })
            .send(event)
            .expect(201);
      });

      it("should exist in the database with the product's updated fields", async () => {
         const product = await productService.findProduct(mockStripeProduct.id);
         expect(product).toBeDefined();
         expect(product.name).toBe('Enterprise 2.0');
         expect(product.description).toBe(
            'This will make you broke real quick 2.0',
         );
      });
   });

   describe('Stripe webhook POST price (CREATE / UPDATE) for the previous product /webhook/stripe', () => {
      it('should return 201 if event price.created is sent with price object to the created product', async () => {
         const event = {
            id: 'evt_3',
            type: 'price.created',
            data: { object: mockStripePrice },
         };
         const signature = generateStripeSignature(
            stripe,
            event,
            stripeWebhookSecret,
         );

         return await request(app.getHttpServer())
            .post('/webhook/stripe')
            .set({ 'stripe-signature': signature })
            .send(event)
            .expect(201);
      });

      it("should return 201 if event price.created is sent with price object to the created product's id (second price to the same product)", async () => {
         const event = {
            id: 'evt_4',
            type: 'price.created',
            data: { object: mockStripePrice2 },
         };
         const signature = generateStripeSignature(
            stripe,
            event,
            stripeWebhookSecret,
         );

         return await request(app.getHttpServer())
            .post('/webhook/stripe')
            .set({ 'stripe-signature': signature })
            .send(event)
            .expect(201);
      });

      it("should exist in the database with the prices' ids (both price on the same product)", async () => {
         const product = await productService.findProduct(
            mockStripePrice2.product,
         );

         expect(product).toBeDefined();
         expect(product.prices).toBeDefined();
         expect(product.prices.length).toBe(2);

         const price1 = product.prices.find(
            (price) => price.id === mockStripePrice.id,
         );
         const price2 = product.prices.find(
            (price) => price.id === mockStripePrice2.id,
         );

         expect(price1).toBeDefined();
         expect(price2).toBeDefined();

         expect(price1.unit_amount).toBe(mockStripePrice.unit_amount);
         expect(price2.unit_amount).toBe(mockStripePrice2.unit_amount);

         expect(price1.active).toBe(mockStripePrice.active);
         expect(price2.active).toBe(mockStripePrice2.active);
      });

      it('should return 201 if event price.updated is sent with price object', async () => {
         const updatedPrice = {
            ...mockStripePrice,
            active: false,
            unit_amount: 1299000,
         } as Stripe.Price;

         const event = {
            id: 'evt_5',
            type: 'price.updated',
            data: { object: updatedPrice },
         };

         const signature = generateStripeSignature(
            stripe,
            event,
            stripeWebhookSecret,
         );

         return await request(app.getHttpServer())
            .post('/webhook/stripe')
            .set({ 'stripe-signature': signature })
            .send(event)
            .expect(201);
      });

      it("should exist in the database with the price's updated fields", async () => {
         const product = await productService.findProduct(
            mockStripePrice.product,
         );
         expect(product).toBeDefined();

         const price = product.prices.find(
            (price) => price.id === mockStripePrice.id,
         );
         expect(price).toBeDefined();
         expect(price.unit_amount).toBe(1299000);
         expect(price.active).toBe(false);
      });
   });

   describe('Stripe webhook POST price (DELETE) /webhook/stripe', () => {
      it('should return 201 in if the event price.deleted is sent with the price object', async () => {
         const event = {
            id: 'evt_6',
            type: 'price.deleted',
            data: { object: mockStripePrice },
         };

         const signature = generateStripeSignature(
            stripe,
            event,
            stripeWebhookSecret,
         );

         return await request(app.getHttpServer())
            .post('/webhook/stripe')
            .set({ 'stripe-signature': signature })
            .send(event)
            .expect(201);
      });

      it("should not exist in the database with the price's id", async () => {
         const product = await productService.findProduct(
            mockStripePrice.product,
         );
         expect(product).toBeDefined();

         const price = product.prices.find(
            (price) => price.id === mockStripePrice.id,
         );
         expect(price).toBeUndefined();
      });
   });

   describe('Stripe webhook POST product (DELETE) /webhook/stripe', () => {
      it("should return 201 if event product.deleted is sent with product object's id", async () => {
         const event = {
            id: 'evt_7',
            type: 'product.deleted',
            data: { object: mockStripeProduct },
         };

         const signature = generateStripeSignature(
            stripe,
            event,
            stripeWebhookSecret,
         );

         return await request(app.getHttpServer())
            .post('/webhook/stripe')
            .set({ 'stripe-signature': signature })
            .send(event)
            .expect(201);
      });

      it("should not exist in the database with the product's id", async () => {
         try {
            const product = await productService.findProduct(
               mockStripeProduct.id,
            );

            expect(product).toBeUndefined();
         } catch (error) {
            expect(error).toBeDefined();
         }
      });
   });
});
