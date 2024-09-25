import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import Stripe from 'stripe';

type StripeErrorResponseType = {
   error?: any;
   stripeError?: string;
   stripeMessage?: any;
   message?: string;
};

export class StripeException extends HttpException {
   private readonly logger = new Logger('<>StripeException<>');
   constructor(error: any, errorMessage?: string) {
      let statusCode: HttpStatus;
      let response: StripeErrorResponseType = {};
      if (error instanceof Stripe.errors.StripeError) {
         switch (error.type) {
            case 'StripeCardError':
               response.stripeError = 'Declined card error.';
               response.stripeMessage = error.message; // => e.g. "Your card's expiration year is invalid."
               statusCode = HttpStatus.BAD_REQUEST;
               break;
            case 'StripeInvalidRequestError':
               // Invalid parameters were supplied to Stripe's API
               response.stripeError = 'Invalid request error.';
               response.stripeMessage = error.message; // => e.g. "Amount must be an integer"
               statusCode = HttpStatus.BAD_REQUEST;
               break;
            case 'StripeAPIError':
               // An error occurred internally with Stripe's API
               response.stripeError = 'Stripe API error.';
               response.stripeMessage = error.message; // => e.g. "An error occurred with Stripe's API"
               statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
               break;
            case 'StripeConnectionError':
               // Some kind of error occurred during the HTTPS communication
               response.stripeError = 'Connection error.';
               response.stripeMessage = error.message; // => e.g. "An error occurred with Stripe's API"
               statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
               break;
            case 'StripeAuthenticationError':
               // You probably used an incorrect API key
               response.stripeError = 'Authentication error.';
               response.stripeMessage = error.message; // => e.g. "Unauthorized"
               statusCode = HttpStatus.UNAUTHORIZED;
               break;
            case 'StripeRateLimitError':
               // Too many requests hit the API too quickly
               response.stripeError = 'Rate limit error.';
               response.stripeMessage = error.message; // => e.g. "Too many requests hit the API too quickly"
               statusCode = HttpStatus.TOO_MANY_REQUESTS;
               break;
            case 'StripePermissionError':
               // Access to a resource is not allowed
               response.stripeError = 'Permission error.';
               response.stripeMessage = error.message; // => e.g. "No permission to access the resource"
               statusCode = HttpStatus.FORBIDDEN;
               break;
            case 'StripeIdempotencyError':
               // An idempotency key was used improperly
               response.stripeError = 'Idempotency error.';
               response.stripeMessage = error.message; // => e.g. "Idempotency key was used improperly"
               statusCode = HttpStatus.BAD_REQUEST;
               break;
            case 'StripeInvalidGrantError':
               // InvalidGrantError is raised when a specified code doesn't exist, is
               // expired, has been used, or doesn't belong to you; a refresh token doesn't
               // exist, or doesn't belong to you; or if an API key's mode (live or test)
               // doesn't match the mode of a code or refresh token.
               response.stripeError = 'Invalid grant error.';
               response.stripeMessage = error.message; // => e.g. "Invalid grant"
               statusCode = HttpStatus.BAD_REQUEST;
               break;
         }
      } else {
         statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
         response = {
            error: 'Internal Server Error',
            message: errorMessage || 'An unexpected error occurred.',
         };
      }

      super({ message: errorMessage ?? '', ...response }, statusCode);

      this.logger.error(
         `Stripe error occurred: ${error.type} - ${error.message}`,
      );
   }
}
