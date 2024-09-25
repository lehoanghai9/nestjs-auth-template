import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from 'src/database/product.entity';

@Module({
   imports: [TypeOrmModule.forFeature([ProductEntity])],
   controllers: [ProductController],
   providers: [
      {
         useClass: ProductService,
         provide: 'PRODUCT_SERVICE',
      },
   ],
   exports: ['PRODUCT_SERVICE'],
})
export class ProductModule {}
