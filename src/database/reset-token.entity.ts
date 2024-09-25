import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { BaseEntity } from './base.entity';

@Entity({ name: 'reset_tokens' })
export class ResetTokenEntity extends BaseEntity {
   @PrimaryGeneratedColumn('uuid')
   id: string;

   @Column()
   token: string;

   @Column()
   expiryDate: Date;

   @ManyToOne(() => UserEntity, (user) => user.resetTokens)
   @JoinColumn({ name: 'user_id' })
   user: UserEntity;
}
