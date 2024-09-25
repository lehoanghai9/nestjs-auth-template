import {
   BadRequestException,
   Inject,
   Injectable,
   Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PriceEntity } from 'src/database/price.entity';
import { Repository } from 'typeorm';
import { PriceDto } from './dtos/price.dto';
import { ProductEntity } from 'src/database/product.entity';
import { subscribtionConfigs } from 'src/config/subscribtion.configs';
import { StripeService } from 'src/stripe/stripe.service';
import { UserService } from 'src/user/user.service';
import { CustomerService } from 'src/customer/customer.service';

@Injectable()
export class PriceService {
   private readonly logger = new Logger('<>PriceService<>');
   constructor(
      @InjectRepository(PriceEntity)
      private readonly productRepository: Repository<PriceEntity>,
      @Inject('STRIPE_SERVICE') private readonly stripeService: StripeService,
      @Inject('USER_SERVICE') private readonly userService: UserService,
      @Inject('CUSTOMER_SERVICE')
      private readonly customerService: CustomerService,
   ) {}

   async upsertPrice(price: PriceDto) {
      const product: ProductEntity = {
         id: price.product_id,
      };

      const priceData: PriceEntity = {
         id: price.id,
         active: price.active,
         currency: price.currency,
         type: price.type,
         unit_amount: price.unit_amount ?? null,
         interval: price.interval ?? null,
         interval_count: price.interval_count ?? null,
         trial_period_days:
            price.trial_period_days ?? subscribtionConfigs.trialPeriodDays,
         product,
      };

      return await this.productRepository.upsert(priceData, {
         conflictPaths: ['id'],
         skipUpdateIfNoValuesChanged: true,
      });
   }

   async checkoutPrice(priceId: string, quantity: number, userId: string) {
      const stripeCustomerId =
         await this.customerService.createOrUpdateUserStripeCustomerId(userId);

      const checkoutSession = await this.stripeService.createCheckoutSession(
         priceId,
         quantity,
         stripeCustomerId,
      );

      return {
         message: 'Checkout session created successfully',
         url: checkoutSession.url,
      };
   }

   async findPrice(priceId: string) {
      this.logger.log(`Getting price ${priceId}`);
      return await this.productRepository.findOne({ where: { id: priceId } });
   }

   async deletePrice(priceId: string) {
      this.logger.log(`Deleting price ${priceId}`);
      return await this.productRepository.delete(priceId);
   }
}
