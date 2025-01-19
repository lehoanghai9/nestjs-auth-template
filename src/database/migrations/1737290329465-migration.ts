import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1737290329465 implements MigrationInterface {
    name = 'Migration1737290329465'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "billing_address" jsonb`);
        await queryRunner.query(`ALTER TABLE "users" ADD "shipping_address" jsonb`);
        await queryRunner.query(`ALTER TABLE "users" ADD "payment_method" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "payment_method"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "shipping_address"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "billing_address"`);
    }

}
