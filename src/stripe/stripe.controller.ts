import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { StripeWebhookGuard } from './stripe-webhook.guard';

@Controller('stripe')
export class StripeController {
   constructor(
   ) {}

   @Post('webhook')
   @UseGuards(StripeWebhookGuard)
   async handleWebhook(@Body() payload: any) {
   }
}
