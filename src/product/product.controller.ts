import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
   constructor(
      @Inject('PRODUCT_SERVICE')
      private readonly productService: ProductService,
   ) {}

   @Get('')
   async GetProducts() {
      return await this.productService.findProducts();
   }

   @Get(':id')
   async GetProduct(@Param('id') productId: string) {
      return await this.productService.findProduct(productId);
   }
}
