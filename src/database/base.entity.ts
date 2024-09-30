import { BaseEntity as TypeOrmBaseEntity, CreateDateColumn, UpdateDateColumn } from "typeorm";

export abstract class BaseEntity extends TypeOrmBaseEntity {
   @CreateDateColumn({type: "timestamptz"})
   created: Date;

   @UpdateDateColumn({type: "timestamptz"})
   updated: Date;
}
