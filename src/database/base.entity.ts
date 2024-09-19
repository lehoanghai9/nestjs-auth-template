import { BaseEntity as TypeOrmBaseEntity, CreateDateColumn, UpdateDateColumn } from "typeorm";

export abstract class BaseEntity extends TypeOrmBaseEntity {
   @CreateDateColumn()
   created: Date;

   @UpdateDateColumn()
   updated: Date;
}
