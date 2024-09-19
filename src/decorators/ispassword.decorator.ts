import { applyDecorators } from "@nestjs/common";
import { IsString, Matches, MinLength } from "class-validator";

export function IsPassword() {
   return applyDecorators(
      IsString(),
      MinLength(6),
      Matches(/^(?=.*[0-9])/, {
         message: 'Password must contain at least one number.',
      }),
   );
}