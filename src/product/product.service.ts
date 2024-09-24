import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from 'src/database/product.entity';
import Stripe from 'stripe';
import { Repository } from 'typeorm';
import { ProductDto } from './dtos/product.dto';

@Injectable()
export class ProductService {
   private readonly logger = new Logger('<>ProductService<>');

   constructor(
      @InjectRepository(ProductEntity)
      private readonly productRepository: Repository<ProductEntity>,
   ) {}

   async upsertProduct(product: ProductDto) {
      this.logger.log(`Upserting product ${product.id}`);
      const productData: ProductEntity = {
         id: product.id,
         active: product.active,
         name: product.name,
         description: product.description,
         image: product.images[0],
         metadata: product.metadata,
      };

      await this.productRepository.upsert(productData, {
         conflictPaths: ['id'],
      });

      this.logger.log(`Product ${product.id} upserted`);
   }
}
