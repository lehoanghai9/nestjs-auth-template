import {
   CanActivate,
   ExecutionContext,
   Inject,
   Injectable,
   Logger,
   UnauthorizedException,
} from '@nestjs/common';
import { type UserDetailRequest } from '../types/userdetail-request.type';
import { Observable } from 'rxjs';
import { SubscriptionService } from 'src/subscription/subscription.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
   private readonly logger = new Logger('<>Subscription Guard<>');
   constructor(
      @Inject('SUBSCRIPTION_SERVICE')
      private readonly subscriptionService: SubscriptionService,
   ) {}

   canActivate(
      context: ExecutionContext,
   ): boolean | Promise<boolean> | Observable<boolean> {
      const request: UserDetailRequest = context.switchToHttp().getRequest();

      const userId = request.userId;

      if (!userId) {
        this.logger.error('Invalid Token.');
         throw new UnauthorizedException('Invalid Token.');
      }

      const isSubscribed = this.subscriptionService.isUserSubscribedToProduct(
         userId,
         'prod_QuS8xpAeBv58EN',
      );

      if (!isSubscribed) {
        this.logger.error('User is not subscribed to the product.');
         throw new UnauthorizedException(
            'User is not subscribed to the product.',
         );
      }

      return true;
   }
}
