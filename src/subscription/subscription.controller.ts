import { Controller, Inject } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { Get } from '@nestjs/common';

@Controller('subscription')
export class SubscriptionController {
   constructor(
      @Inject('SUBSCRIPTION_SERVICE')
      private readonly subscriptionService: SubscriptionService,
   ) {}

   //remove
  @Get()
  async Get() {
    return this.subscriptionService.manageSubscriptionStatusChange("123", 'cus_RbyULrBzizkUEz', true);
  }
}
