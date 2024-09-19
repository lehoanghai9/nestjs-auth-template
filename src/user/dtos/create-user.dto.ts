import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { IsPassword } from 'src/decorators/ispassword.decorator';

export class CreateUserDto {
    @IsString()
    name: string;
  
    @IsEmail()
    email: string;
  
    @IsPassword()
    password: string;
}