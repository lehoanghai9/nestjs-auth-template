import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1737289487866 implements MigrationInterface {
    name = 'Migration1737289487866'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscriptions" RENAME COLUMN "created" TO "created_at"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscriptions" RENAME COLUMN "created_at" TO "created"`);
    }

}
