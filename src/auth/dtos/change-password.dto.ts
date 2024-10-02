import { IsString } from 'class-validator';
import { IsPassword } from '../../common/decorators/ispassword.decorator'; 

export class ChangePasswordDto {
   @IsString()
   oldPassword: string;

   @IsPassword()
   newPassword: string;
}
