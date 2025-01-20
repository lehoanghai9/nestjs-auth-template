import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from './common/guards/auth.guard';
import { SubscriptionGuard } from './common/guards/subscription.guard';
import { UserDetailRequest } from './common/types/userdetail-request.type';

@Controller()
export class AppController {
   constructor(private readonly appService: AppService) {}

   @Get()
   @UseGuards(AuthGuard, SubscriptionGuard)
   SomeProtectedRoute(@Req() req: UserDetailRequest) {
      return { message: 'Hella secret stuff', req: req.userId };
   }
}
