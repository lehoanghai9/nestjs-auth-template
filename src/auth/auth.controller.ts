import { Controller, Post, Body, Put, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dtos/signup.dto';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { UserDetailRequest } from 'src/types/userdetail-request.type';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';

@Controller('auth')
export class AuthController {
   constructor(private readonly authService: AuthService) {}

   @Post('signup')
   async SignUp(@Body() signupData: SignupDto) {
      return await this.authService.signUp(signupData);
   }

   @Post('login')
   async Login(@Body() loginData: LoginDto) {
      return await this.authService.login(loginData);
   }

   @Post('refresh')
   async RefreshToken(@Body() refreshToken: RefreshTokenDto) {
      return await this.authService.refreshTokens(refreshToken.token);
   }

   @UseGuards(AuthGuard)
   @Put('change-password')
   async Logout(
      @Body() changePasswordDto: ChangePasswordDto,
      @Req() req: UserDetailRequest,
   ) {
      return await this.authService.changePassword(
         req.userId,
         changePasswordDto.oldPassword,
         changePasswordDto.newPassword,
      );
   }

   @Post('forgot-password')
   async ForgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
      return await this.authService.forgotPassword(forgotPasswordDto.email);
   }

   @Post('reset-password')
   async ResetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
      return await this.authService.resetPassword(
         resetPasswordDto.resetToken,
         resetPasswordDto.password,
      );
   }
}
