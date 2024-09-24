import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { StripeService } from 'src/stripe/stripe.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from 'src/database/product.entity';

@Module({
   imports: [TypeOrmModule.forFeature([ProductEntity])],
   controllers: [ProductController],
   providers: [
      ProductService,
   ],
   exports: [ProductService],
})
export class ProductModule {}
