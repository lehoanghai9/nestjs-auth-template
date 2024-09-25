import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "./user.entity";
import { BaseEntity } from "./base.entity";


@Entity({ name: 'refresh_tokens' })
export class RefreshTokenEntity extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;
    
    @Column("uuid")
    token: string;

    @Column()
    expiryDate: Date;

    @ManyToOne(() => UserEntity, (user) => user.refreshTokens)
    @JoinColumn({name: 'user_id'})
    user: UserEntity; 
}