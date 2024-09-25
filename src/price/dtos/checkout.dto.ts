import { IsInt, IsPositive, IsString } from 'class-validator';

export class CheckoutDto {
   @IsString()
   priceId: string;

   @IsPositive()
   @IsInt()
   quantity: number;
}
