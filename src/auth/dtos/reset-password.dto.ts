import { IsString } from 'class-validator';
import { IsPassword } from 'src/common/decorators/ispassword.decorator';

export class ResetPasswordDto {
   @IsPassword()
   password: string;

   @IsString()
   resetToken: string;
}
