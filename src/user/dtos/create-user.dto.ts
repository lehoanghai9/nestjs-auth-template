import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { IsPassword } from '../../common/decorators/ispassword.decorator';

export class CreateUserDto {
    @IsString()
    name: string;
  
    @IsEmail()
    email: string;
  
    @IsPassword()
    password: string;
}