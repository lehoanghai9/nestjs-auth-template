import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { StripeWebhookGuard } from 'src/stripe/stripe-webhook.guard';
import { bufferToJson } from './utils';
import Stripe from 'stripe';

@Controller('webhook')
export class WebhookController {
   constructor(private readonly webhookService: WebhookService) {}

   @Post('stripe')
   @UseGuards(StripeWebhookGuard)
   async stripeWebhook(@Body() payload: any): Promise<any> {
      const body = bufferToJson(payload) as Stripe.Event;
      return await this.webhookService.handleStripeEvent(body);
   }
}
