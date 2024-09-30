import {
   Entity,
   PrimaryColumn,
   Column,
   ManyToOne,
   CreateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { PriceEntity } from './price.entity';

export enum SubscriptionStatus {
   TRIALING = 'trialing',
   ACTIVE = 'active',
   CANCELED = 'canceled',
   INCOMPLETE = 'incomplete',
   INCOMPLETE_EXPIRED = 'incomplete_expired',
   PAST_DUE = 'past_due',
   UNPAID = 'unpaid',
   PAUSED = 'paused',
}

@Entity('subscriptions')
export class SubscriptionEntity {
   //  Subscription ID from Stripe, e.g. sub_1234...
   @PrimaryColumn('text')
   id: string;

   // The status of the subscription object, one of subscription_status type above.
   @Column({
      type: 'enum',
      enum: SubscriptionStatus,
      nullable: true,
   })
   status?: SubscriptionStatus;

   // Set of key-value pairs, used to store additional information about the object in a structured format.
   @Column('jsonb', { nullable: true })
   metadata?: Record<string, any>;

   // ID of the price that created this subscription.
   @ManyToOne(() => PriceEntity, { nullable: true })
   price?: PriceEntity;

   // Quantity multiplied by the unit amount of the price creates the amount of the subscription. Can be used to charge multiple seats.
   @Column('int', { nullable: true })
   quantity?: number;

   // If true the subscription has been canceled by the user and will be deleted at the end of the billing period.
   @Column('boolean', { default: false, name: 'cancel_at_period_end' })
   cancelAtPeriodEnd?: boolean;

   // Time at which the subscription was created.
   @CreateDateColumn({
      type: 'timestamptz',
      default: () => 'CURRENT_TIMESTAMP',
   })
   created: Date;

   // Start of the current period that the subscription has been invoiced for.
   @Column('timestamptz', {
      default: () => 'CURRENT_TIMESTAMP',
      name: 'current_period_start',
   })
   currentPeriodStart: Date;

   // End of the current period that the subscription has been invoiced for. At the end of this period, a new invoice will be created.
   @Column('timestamptz', {
      default: () => 'CURRENT_TIMESTAMP',
      name: 'current_period_end',
   })
   currentPeriodEnd: Date;

   // If the subscription has ended, the timestamp of the date the subscription ended.
   @Column('timestamptz', { nullable: true, name: 'ended_at' })
   endedAt?: Date;

   // A date in the future at which the subscription will automatically get canceled.
   @Column('timestamptz', { nullable: true, name: 'cancel_at' })
   cancelAt?: Date;

   // If the subscription has been canceled, the date of that cancellation. If the subscription was canceled with `cancel_at_period_end`, `canceled_at` will still reflect the date of the initial cancellation request, not the end of the subscription period when the subscription is automatically moved to a canceled state.
   @Column('timestamptz', { nullable: true, name: 'canceled_at' })
   canceledAt?: Date;

   // If the subscription has a trial, the beginning of that trial.
   @Column('timestamptz', { nullable: true, name: 'trial_start' })
   trialStart?: Date;

   // If the subscription has a trial, the end of that trial.
   @Column('timestamptz', { nullable: true, name: 'trial_end' })
   trialEnd?: Date;

   @ManyToOne(() => UserEntity, (user) => user.subscriptions, {
      nullable: false,
   })
   user: UserEntity;
}
