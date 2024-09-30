import { Entity, Column, PrimaryGeneratedColumn, OneToMany, OneToOne } from 'typeorm';
import { RefreshTokenEntity } from './refresh-token.entity';
import { BaseEntity } from './base.entity';
import { ResetTokenEntity } from './reset-token.entity';
import { CustomerEntity } from './customer.entity';
import { SubscriptionEntity } from './subscription.entity';

@Entity({ name: 'users' })
export class UserEntity extends BaseEntity {
   @PrimaryGeneratedColumn('uuid', {
      name: 'id',
   })
   id: string;

   @Column()
   name: string;

   @Column({ unique: true })
   email: string;

   @Column()
   password: string;

   @OneToMany(() => RefreshTokenEntity, (refreshToken) => refreshToken.user, {
      onDelete: 'CASCADE',
   })
   refreshTokens?: RefreshTokenEntity[];

   @OneToMany(() => ResetTokenEntity, (resetToken) => resetToken.user, {
      onDelete: 'CASCADE',
   })
   resetTokens?: ResetTokenEntity[];

   @OneToMany(() => SubscriptionEntity, (subscription) => subscription.user)
   subscriptions?: SubscriptionEntity[];

   @OneToOne(() => CustomerEntity, (customer) => customer.user)
   customer?: CustomerEntity;
}
