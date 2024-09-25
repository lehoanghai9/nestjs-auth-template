import { Controller, Inject } from '@nestjs/common';
import { CustomerService } from './customer.service';

@Controller('customer')
export class CustomerController {
  constructor(@Inject("CUSTOMER_SERVICE") private readonly customerService: CustomerService) {}
}
