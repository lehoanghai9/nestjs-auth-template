import { Body, Controller, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { PriceService } from './price.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { CheckoutDto } from './dtos/checkout.dto';
import { UserDetailRequest } from 'src/common/types/userdetail-request.type';

@Controller('price')
export class PriceController {
   constructor(@Inject("PRICE_SERVICE") private readonly priceService: PriceService) {}

   @UseGuards(AuthGuard)
   @Post('checkout')
   async Checkout(@Body() checkoutData: CheckoutDto, @Req() req: UserDetailRequest) {
      return await this.priceService.checkoutPrice(checkoutData.priceId, checkoutData.quantity, req.userId);
   }
}
