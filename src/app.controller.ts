import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from './guards/auth.guard';

@UseGuards(AuthGuard)
@Controller()
export class AppController {
   constructor(private readonly appService: AppService) {}

   @Get()
   SomeProtectedRoute(@Req() req) {
      return { message: 'Hella secret stuff', req: req.userId };
   }
}
