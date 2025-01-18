import { Test, TestingModule } from '@nestjs/testing';
import { PriceService } from './price.service';
import { JwtService } from '@nestjs/jwt';

describe('PriceService', () => {
   let service: PriceService;

   beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
         providers: [
            {
               provide: 'PRICE_SERVICE',
               useValue: {
                  checkoutPrice: jest.fn(),
               },
            },
            {
               provide: JwtService,
               useValue: {
                  sign: jest.fn(),
               },
            },
         ],
      }).compile();

      service = module.get<PriceService>('PRICE_SERVICE');
   });

   it('should be defined', () => {
      expect(service).toBeDefined();
   });
});
