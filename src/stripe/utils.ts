import Stripe from "stripe";

/**
 * Calculates the Unix timestamp for the end of a trial period.
 *
 * @param trialPeriodDays - The number of days for the trial period. If the value is null, undefined, or less than 2, the function returns undefined.
 * @returns The Unix timestamp (in seconds) for the end of the trial period, or undefined if the trial period is invalid.
 */
export const calculateTrialEndUnixTimestamp = (
   trialPeriodDays: number | null | undefined,
) => {
   // Check if trialPeriodDays is null, undefined, or less than 2 days
   if (
      trialPeriodDays === null ||
      trialPeriodDays === undefined ||
      trialPeriodDays < 2
   ) {
      return undefined;
   }

   const currentDate = new Date(); // Current date and time
   const trialEnd = new Date(
      currentDate.getTime() + (trialPeriodDays + 1) * 24 * 60 * 60 * 1000,
   ); // Add trial days
   return Math.floor(trialEnd.getTime() / 1000); // Convert to Unix timestamp in seconds
};

/**
 * Calculates the end date of a trial period.
 *
 * @param trialPeriodDays - The number of days for the trial period.
 * @returns The end date of the trial period.
 */
export const calculateTrialEndDate = (trialPeriodDays: number): Date => {
   return new Date(Date.now() + trialPeriodDays * 24 * 60 * 60 * 1000);
};

/**
 * Generates a Stripe webhook signature for a given payload and secret.
 *
 * @param payload - The payload for which the signature is to be generated.
 * @param secret - The secret key used to generate the signature.
 * @returns The generated signature as a string.
 */
export const generateStripeSignature = (
   stripe: Stripe,
   payload: any,
   secret: string,
): string => {
   const payloadString = JSON.stringify(payload);
   const signature = stripe.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret: secret,
   });
   return signature;
};
