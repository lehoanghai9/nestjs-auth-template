import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';

@Module({
   controllers: [StripeController],
   providers: [{ useClass: StripeService, provide: 'STRIPE_SERVICE' }],
   exports: ['STRIPE_SERVICE'],
})
export class StripeModule {}
