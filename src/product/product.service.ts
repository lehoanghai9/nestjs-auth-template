import {
   BadRequestException,
   Inject,
   Injectable,
   Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from '../database/product.entity';
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
         skipUpdateIfNoValuesChanged: true,
      });

      this.logger.log(`Product ${product.id} upserted`);
   }

   async deleteProduct(productId: string) {
      this.logger.log(`Deleting product ${productId}`);
      return await this.productRepository.delete(productId);
   }

   async findProducts() {
      this.logger.log('Finding all products');
      return await this.productRepository.find({ relations: ['prices'] });
   }

   async findProduct(productId: string) {
      this.logger.log(`Finding product ${productId}`);
      const DBProduct = await this.productRepository.findOne({
         where: { id: productId },
         relations: ['prices'],
      });

      if (!DBProduct) {
         this.logger.warn(`Product ${productId} not found`);
         throw new BadRequestException('Product not found');
      }

      return DBProduct;
   }
}
