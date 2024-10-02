import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TestDBInitiator } from './config.e2e';
import { createTestDataSource } from './utils';
import { v4 as uuid } from 'uuid';

describe('AuthController E2E Test', () => {
   //INITIALIZATION
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

   // END INITIALIZATION

   const NEW_TEST_USER = {
      name: 'John Doe',
      email: 'johndoe@gmail.com',
      password: 'password1',
   };

   let accessToken: string;
   let refreshToken: string;

   describe('Creating New User POST /auth/signup', () => {
      it('should create a new user', () => {
         return request(app.getHttpServer())
            .post('/auth/signup')
            .send(NEW_TEST_USER)
            .expect(201);
      });

      it('should return 400 if the email is already taken, and the message notifies about the used email', async () => {
         // Try to create the same user again
         const response = await request(app.getHttpServer())
            .post('/auth/signup')
            .send(NEW_TEST_USER)
            .expect(400);

         expect(response.body.message).toBe('Email already in use');
      });

      it('should return 400 if the email is invalid', async () => {
         const response = await request(app.getHttpServer())
            .post('/auth/signup')
            .send({
               name: 'John Doe',
               email: 'invalidemail.com',
               password: 'password1',
            })
            .expect(400);
      });

      it('should return 400 if the password is too short', async () => {
         const response = await request(app.getHttpServer())
            .post('/auth/signup')
            .send({
               name: 'John Doe',
               email: 'asd@gmail.com',
               password: '123',
            })
            .expect(400);
      });

      it('should return 400 if the password does not contain a number', async () => {
         const response = await request(app.getHttpServer())
            .post('/auth/signup')
            .send({
               name: 'John Doe',
               email: 'asd@gmail.com',
               password: 'password',
            })
            .expect(400);
      });
   });

   describe('Logging In POST /auth/login', () => {
      it('should return 401 for wrong password', async () => {
         const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: NEW_TEST_USER.email, password: 'wrongpassword' })
            .expect(401);

         expect(response.body.message).toBe('Wrong credentials given.');
      });

      it('should return 401 for wrong email', async () => {
         const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
               email: 'wrongemail@gmail.com',
               password: NEW_TEST_USER.password,
            })
            .expect(401);

         expect(response.body.message).toBe('Wrong credentials given.');
      });

      it('should return 201 and tokens for correct credentials', async () => {
         const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
               email: NEW_TEST_USER.email,
               password: NEW_TEST_USER.password,
            })
            .expect(201);

         expect(response.body.accessToken).toBeDefined();
         expect(response.body.refreshToken).toBeDefined();

         accessToken = response?.body?.accessToken;
         refreshToken = response?.body?.refreshToken;
      });
   });

   describe('Refreshing Tokens POST /auth/refresh', () => {
      it('should return 400 for invalid refresh token format', async () => {
         const response = await request(app.getHttpServer())
            .post('/auth/refresh')
            .send({ token: 'invalid_token' })
            .expect(400);
      });

      it('should return 401 for good format but non-existing refresh token', async () => {
         const response = await request(app.getHttpServer())
            .post('/auth/refresh')
            .send({ token: uuid() })
            .expect(401);
      });

      it('should return 201 and new tokens for valid refresh token', async () => {
         const response = await request(app.getHttpServer())
            .post('/auth/refresh')
            .send({ token: refreshToken })
            .expect(201);

         expect(response.body.accessToken).toBeDefined();
         expect(response.body.refreshToken).toBeDefined();
      });
   });

   describe('Changing Password PUT /auth/change-password', () => {
      it('should return 401 for wrong old password', async () => {
         const response = await request(app.getHttpServer())
            .put('/auth/change-password')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
               oldPassword: 'wrongpassword',
               newPassword: 'newpassword123',
            })
            .expect(401);
      });

      it('should return 400 for too short new password', async () => {
         const response = await request(app.getHttpServer())
            .put('/auth/change-password')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
               oldPassword: NEW_TEST_USER.password,
               newPassword: 'new',
            })
            .expect(400);
      });

      it('should return 400 for new password without a number', async () => {
         const response = await request(app.getHttpServer())
            .put('/auth/change-password')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
               oldPassword: NEW_TEST_USER.password,
               newPassword: 'newpassword',
            })
            .expect(400);
      });

      it('should return 200 for successful password change', async () => {
         const response = await request(app.getHttpServer())
            .put('/auth/change-password')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
               oldPassword: NEW_TEST_USER.password,
               newPassword: 'newpassword123',
            })
            .expect(200);
      });
   });

   describe('Forgot Password POST /auth/forgot-password', () => {
      it('should return 401 for wrong email format', async () => {
         const response = await request(app.getHttpServer())
            .post('/auth/forgot-password')
            .send({ email: 'wrongemail.com' })
            .expect(400);
      });

      it("should return 201 for a non-existing email, but don't gvive away information", async () => {
         const response = await request(app.getHttpServer())
            .post('/auth/forgot-password')
            .send({ email: 'nonexistingemail@gmail.com' })
            .expect(201);
      });

      it('should return 201 for existing email', async () => {
         const response = await request(app.getHttpServer())
            .post('/auth/forgot-password')
            .send({ email: NEW_TEST_USER.email })
            .expect(201);
      });
   });
});
