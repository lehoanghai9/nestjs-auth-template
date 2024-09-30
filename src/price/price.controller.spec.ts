import { Test, TestingModule } from '@nestjs/testing';
import { PriceController } from './price.controller';
import { PriceService } from './price.service';
import { CheckoutDto } from './dtos/checkout.dto';
import { UserDetailRequest } from 'src/common/types/userdetail-request.type';


describe('PriceController', () => {
  let controller: PriceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PriceController],
      providers: [PriceService],
    }).compile();

    controller = module.get<PriceController>(PriceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('PriceController', () => {
    let controller: PriceController;
    let priceService: PriceService;
  
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [PriceController],
        providers: [
          {
            provide: 'PRICE_SERVICE',
            useValue: {
              checkoutPrice: jest.fn(),
            },
          },
        ],
      }).compile();
  
      controller = module.get<PriceController>(PriceController);
      priceService = module.get<PriceService>('PRICE_SERVICE');
    });
  
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  
    describe('Checkout', () => {
      it('should call priceService.checkoutPrice with correct parameters', async () => {
        const checkoutData: CheckoutDto = { priceId: '123', quantity: 2 };
        const req = { userId: 'user123' } as unknown as UserDetailRequest;
        const result = { message: "", url: "" };
  
        jest.spyOn(priceService, 'checkoutPrice').mockResolvedValue(result);
  
        expect(await controller.Checkout(checkoutData, req)).toBe(result);
        expect(priceService.checkoutPrice).toHaveBeenCalledWith('123', 2, 'user123');
      });
    });
  });






































});
