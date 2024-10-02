import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TestDBInitiator } from './config.e2e';
import { createTestDataSource } from './utils';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('webhookController', () => {
   let app: INestApplication;
   let dataSource: DataSource;
   let databaseConfig: TestDBInitiator;

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

      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(
         new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
         }),
      );
      await app.init();
   });

   afterAll(async () => {
      await dataSource.destroy();
      await app.close();
   });

   describe('Stripe webhook post /webhook/stripe', () => {
      it('should return 401 if signature does not exist', async () => {
         return await request(app.getHttpServer())
            .post('/webhook/stripe')
            .expect(401);
      });

      it("should return 403 if signature is invalid (not a valid signature format)", async () => {
         return await request(app.getHttpServer())
            .post('/webhook/stripe')
            .set({ 'stripe-signature': 'invalid-signature' })
            .send({ payload: "test", signature: "test" })
            .expect(403);
      });

      it("should return 403 if signature is invalid (signature format is good)", async () => {
         // todo
      });
   });
});
