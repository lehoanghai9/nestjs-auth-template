import { Controller, Inject } from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {
   constructor(
      @Inject('PRODUCT_SERVICE')
      private readonly productService: ProductService,
   ) {}
}
