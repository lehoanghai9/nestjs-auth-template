import {
   BadRequestException,
   Inject,
   Injectable,
   Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomerEntity } from '../database/customer.entity';
import { StripeService } from '../stripe/stripe.service';
import { UserService } from '../user/user.service';
import { Repository } from 'typeorm';

@Injectable()
export class CustomerService {
   private readonly logger = new Logger('<>CustomerService<>');
   constructor(
      @InjectRepository(CustomerEntity)
      private readonly customerRepository: Repository<CustomerEntity>,
      @Inject('STRIPE_SERVICE') private readonly stripeService: StripeService,
      @Inject('USER_SERVICE') private readonly userService: UserService,
   ) {}

   async createOrUpdateUserStripeCustomerId(userId: string) {
      this.logger.log(
         `Starting createOrUpdateUserStripeCustomerId for userId: ${userId}`,
      );

      const DBUser = await this.userService.findOneById(userId);
      this.logger.log(
         `Fetched user from database: ${DBUser ? 'User found' : 'User not found'}`,
      );

      if (!DBUser) {
         this.logger.warn(`User with userId: ${userId} not found`);
         throw new BadRequestException('User not found');
      }

      const stripeCustomerId =
         await this.stripeService.createOrRetrieveCustomerId({
            email: DBUser.email,
            userId: DBUser.id,
            name: DBUser.name,
            stripeCustomerId: DBUser.customer?.stripeCustomerId,
         });
      this.logger.log(
         `Stripe customer ID: ${stripeCustomerId ? stripeCustomerId : 'Not retrieved'}`,
      );

      if (!stripeCustomerId) {
         this.logger.error('Create or retrieve customer ID failed');
         throw new BadRequestException('Create or retrieve customer ID failed');
      }

      await this.createOrUpdateCustomerForUser(DBUser.id, stripeCustomerId);

      return stripeCustomerId;
   }

   private async createOrUpdateCustomerForUser(
      userId: string,
      stripeCustomerId?: string,
   ) {
      return await this.customerRepository.upsert(
         { stripeCustomerId, user: { id: userId } },
         { conflictPaths: ['user.id'], skipUpdateIfNoValuesChanged: true },
      );
   }
}
