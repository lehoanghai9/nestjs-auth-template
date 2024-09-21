import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeWebhookGuard } from './stripe-webhook.guard';
import { bufferToJson } from './utils';

@Controller('stripe')
export class StripeController {
   constructor(private readonly stripeService: StripeService) {}

   @Post('webhook')
   @UseGuards(StripeWebhookGuard)
   async handleWebhook(@Body() payload: any) {
      console.log(bufferToJson(payload));
   }
}
