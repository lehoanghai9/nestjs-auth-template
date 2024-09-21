import {
   CanActivate,
   ExecutionContext,
   Injectable,
   Logger,
   UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from './stripe.service';

@Injectable()
export class StripeWebhookGuard implements CanActivate {
   private readonly stripeSignatureHeader = 'stripe-signature';
   private readonly logger = new Logger('StripeWebhookGuard');

   constructor(private readonly stripeService: StripeService) {}

   canActivate(context: ExecutionContext): boolean {
      const request: Request = context.switchToHttp().getRequest();
      const signature = request.headers[this.stripeSignatureHeader];

      if (!signature) {
         throw new UnauthorizedException('Missing Stripe signature');
      }

      const payload = request.body;

      try {
         this.stripeService.validateWebhookSignature(payload, signature);
         return true;
      } catch (error) {}
   }
}
