import {
   Column,
   Entity,
   Index,
   JoinColumn,
   OneToOne,
   PrimaryColumn,
   PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({ name: 'customers' })
export class CustomerEntity {
   @PrimaryGeneratedColumn()
   id: number;

   @Column('text', { name: 'stripe_customer_id', nullable: true })
   @Index({ unique: true, where: "stripe_customer_id IS NOT NULL" })
   stripeCustomerId?: string;

   @OneToOne(() => UserEntity)
   @JoinColumn({ name: 'user_id' })
   user: UserEntity;
}
