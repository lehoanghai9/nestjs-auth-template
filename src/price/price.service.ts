import {
   BadRequestException,
   Inject,
   Injectable,
   Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PriceEntity } from '../database/price.entity';
import { Repository } from 'typeorm';
import { PriceDto } from './dtos/price.dto';
import { ProductEntity } from '../database/product.entity';
import { subscribtionConfigs } from '../config/subscribtion.configs';
import { StripeService } from '../stripe/stripe.service';
import { CustomerService } from '../customer/customer.service';

@Injectable()
export class PriceService {
   private readonly logger = new Logger('<>PriceService<>');
   constructor(
      @InjectRepository(PriceEntity)
      private readonly priceRepository: Repository<PriceEntity>,
      @Inject('STRIPE_SERVICE') private readonly stripeService: StripeService,
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

      return await this.priceRepository.upsert(priceData, {
         conflictPaths: ['id'],
         skipUpdateIfNoValuesChanged: true,
      });
   }

   async checkoutPrice(priceId: string, quantity: number, userId: string) {
      const stripeCustomerId =
         await this.customerService.createOrUpdateUserStripeCustomerId(userId);

      this.logger.log('Finding DB price: ' + priceId);
      const DBprice = await this.findPrice(priceId);

      if (!DBprice) {
         this.logger.error('Price not found');
         throw new BadRequestException('Price not found');
      }

      const checkoutSession = await this.stripeService.createCheckoutSession(
         priceId,
         quantity,
         stripeCustomerId,
         DBprice.trial_period_days ?? 0,
      );

      return {
         message: 'Checkout session created successfully',
         url: checkoutSession.url,
      };
   }

   async findPrice(priceId: string) {
      this.logger.log(`Getting price ${priceId}`);
      const price = await this.priceRepository.findOne({
         where: { id: priceId },
      });
      this.logger.log(`Price ${price ? 'found' : 'not found'}`);
      return price;
   }

   async deletePrice(priceId: string) {
      this.logger.log(`Deleting price ${priceId}`);
      return await this.priceRepository.delete(priceId);
   }
}
