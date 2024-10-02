import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { UserModule } from '../user/user.module';
import { StripeModule } from '../stripe/stripe.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerEntity } from '../database/customer.entity';

@Module({
   imports: [
      TypeOrmModule.forFeature([CustomerEntity]),
      UserModule,
      StripeModule,
   ],
   controllers: [CustomerController],
   providers: [{ provide: 'CUSTOMER_SERVICE', useClass: CustomerService }],
   exports: ['CUSTOMER_SERVICE'],
})
export class CustomerModule {}
