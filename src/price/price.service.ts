import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PriceEntity } from 'src/database/price.entity';
import { Repository } from 'typeorm';
import { PriceDto } from './dtos/price.dto';
import { ProductEntity } from 'src/database/product.entity';
import { subscribtionConfigs } from 'src/config/subscribtion.configs';

@Injectable()
export class PriceService {
   constructor(
      @InjectRepository(PriceEntity)
      private readonly productRepository: Repository<PriceEntity>,
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

      return await this.productRepository.upsert(priceData, {conflictPaths: ['id']});
   }
}
