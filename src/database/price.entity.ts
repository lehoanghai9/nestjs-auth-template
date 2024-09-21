import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { ProductEntity } from './product.entity';

/**
 * PRICES
 * Note: prices are created and managed in Stripe and synced to our DB via Stripe webhooks.
 */
export enum PricingType {
   ONE_TIME = 'one_time',
   RECURRING = 'recurring',
}

export enum PricingPlanInterval {
   DAY = 'day',
   WEEK = 'week',
   MONTH = 'month',
   YEAR = 'year',
}

@Entity('prices')
export class PriceEntity {
   // Price ID from Stripe, e.g. price_1234.
   @PrimaryColumn('text')
   id: string;

   // Whether the price can be used for new purchases.
   @Column('boolean')
   active: boolean;

   // A brief description of the price.
   @Column('text')
   description: string;

   // The unit amount as a positive integer in the smallest currency unit (e.g., 100 cents for US$1.00 or 100 for ¥100, a zero-decimal currency).
   @Column('bigint')
   unit_amount: number;

   // Three-letter ISO currency code, in lowercase.
   @Column({ type: 'varchar', length: 3 })
   currency: string;

   // One of `one_time` or `recurring` depending on whether the price is for a one-time purchase or a recurring (subscription) purchase.
   @Column({
      type: 'enum',
      enum: PricingType,
   })
   type: PricingType;

   // The frequency at which a subscription is billed. One of `day`, `week`, `month` or `year`.
   @Column({
      type: 'enum',
      enum: PricingPlanInterval,
   })
   interval: PricingPlanInterval;

   // The number of intervals (specified in the `interval` attribute) between subscription billings. For example, `interval=month` and `interval_count=3` bills every 3 months.
   @Column('integer')
   interval_count: number;

   // Default number of trial days when subscribing a customer to this price using [`trial_from_plan=true`](https://stripe.com/docs/api#create_subscription-trial_from_plan).
   @Column('integer')
   trial_period_days: number;

   // Set of key-value pairs, used to store additional information about the object in a structured format.
   @Column('jsonb')
   metadata: Record<string, any>;

   @ManyToOne(() => ProductEntity, (product) => product.prices)
   product: ProductEntity;
}
