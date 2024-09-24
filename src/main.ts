import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { raw } from 'body-parser';

async function bootstrap() {
   const app = await NestFactory.create(AppModule);
   app.setGlobalPrefix('api');
   app.useGlobalPipes(
      new ValidationPipe({
         whitelist: true,
         forbidNonWhitelisted: true,
      }),
   );


   // Add the raw body parser to the Stripe webhook route
   app.use('/api/webhook/stripe', raw({type: 'application/json'}));

   await app.listen(8000);
}

bootstrap();
