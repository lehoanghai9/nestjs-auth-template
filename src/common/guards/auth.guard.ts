import {
   CanActivate,
   ExecutionContext,
   Injectable,
   UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { type UserDetailRequest } from '../types/userdetail-request.type';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
   constructor(private jwtService: JwtService) {}

   canActivate(
      context: ExecutionContext,
   ): boolean | Promise<boolean> | Observable<boolean> {
      const request: UserDetailRequest = context.switchToHttp().getRequest();

      //Extract the token from the request header (Authorization Bearer Token)
      const token = this.extractTokenFromRequest(request);

      if (!token) {
         throw new UnauthorizedException('Invalid Token.');
      }

      try {
         const payload = this.jwtService.verify(token);
         request.userId = payload.userId;
      } catch (error) {
         throw new UnauthorizedException('Invalid Token.');
      }

      return true;
   }

   private extractTokenFromRequest(request: Request): string | undefined {
      return request.headers.authorization?.split(' ')[1];
   }
}
