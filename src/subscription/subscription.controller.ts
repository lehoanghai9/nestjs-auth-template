import { Controller, Inject, Req, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { Get } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { UserDetailRequest } from '../common/types/userdetail-request.type';

@Controller('subscription')
export class SubscriptionController {
   constructor(
      @Inject('SUBSCRIPTION_SERVICE')
      private readonly subscriptionService: SubscriptionService,
   ) {}

   @UseGuards(AuthGuard)
   @Get('/portal')
   async getPortalLink(@Req() req: UserDetailRequest) {
      return this.subscriptionService.sendSubscriptionPortalLink(req.userId);
   }

   @UseGuards(AuthGuard)
   @Get('/status')
   async getSubscriptionStatus(@Req() req: UserDetailRequest) {
      return this.subscriptionService.isUserSubscribedToProduct(req.userId, "prod_QuS8xpAeBv58EN");
   }
}
