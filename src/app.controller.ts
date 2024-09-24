import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from './common/guards/auth.guard';

@Controller()
export class AppController {
   constructor(private readonly appService: AppService) {}

   @Get("test")
   SomeProtectedRoute(@Req() req) {
      return { message: 'Hella secret stuff', req: req.userId };
   }
}
