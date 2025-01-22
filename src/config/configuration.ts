export interface IConfigVariables {
   port: number;
   database: {
      host: string;
      port: number;
      username: string;
      password: string;
   };
   auth: {
      'jwt-secret': string;
      'jwt-expiration': string;
      'refresh-token-expiration-days': number;
      'reset-token-expiry-hours': number;
   };
   subscription: {
      'trial-period-days': number;
   };
   stripe: {
      'secret-key': string;
      'webhook-secret': string;
   };
   mail: {
      host: string;
      port: number;
      user: string;
      pass: string;
   };
}

export default (): IConfigVariables => ({
   port: parseInt(process.env.PORT, 10) || 3000,
   database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      password: process.env.DB_PASSWORD || 'password',
      username: process.env.DB_USERNAME || 'username',
   },
   auth: {
      'jwt-secret': process.env.JWT_SECRET || '',
      'jwt-expiration': process.env.JWT_EXPIRATION || '1h',
      'refresh-token-expiration-days':
         parseInt(process.env.REFRESH_TOKEN_EXPIRATION_DAYS, 10) || 3,
      'reset-token-expiry-hours':
         parseInt(process.env.RESET_TOKEN_EXPIRY_HOURS, 10) || 1,
   },
   subscription: {
      'trial-period-days': parseInt(process.env.TRIAL_PERIOD_DAYS, 10) || 7,
   },
   stripe: {
      'secret-key': process.env.STRIPE_SECRET_KEY || '',
      'webhook-secret': process.env.STRIPE_WEBHOOK_SECRET || '',
   },
   mail: {
      host: process.env.MAIL_HOST || '',
      port: parseInt(process.env.MAIL_PORT, 10) || 587,
      user: process.env.MAIL_USER || '',
      pass: process.env.MAIL_PASS || '',
   },
});
