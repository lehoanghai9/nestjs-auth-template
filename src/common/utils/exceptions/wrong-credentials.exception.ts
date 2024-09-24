import { HttpException, HttpStatus } from "@nestjs/common";

export class WrongCredentialsException extends HttpException {
    constructor(errorMessage?: string) {
      super(errorMessage || 'Wrong credentials given.', HttpStatus.UNAUTHORIZED);
    }
  }