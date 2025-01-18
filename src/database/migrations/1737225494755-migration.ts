import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1737225494755 implements MigrationInterface {
    name = 'Migration1737225494755'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" uuid NOT NULL, "expiryDate" TIMESTAMP NOT NULL, "user_id" uuid, CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reset_tokens" ("created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying NOT NULL, "expiryDate" TIMESTAMP NOT NULL, "user_id" uuid, CONSTRAINT "PK_acd6ec48b54150b1736d0b454b9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" text NOT NULL, "active" boolean, "name" text, "description" text, "image" text, "metadata" jsonb, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."prices_type_enum" AS ENUM('one_time', 'recurring')`);
        await queryRunner.query(`CREATE TYPE "public"."prices_interval_enum" AS ENUM('day', 'week', 'month', 'year')`);
        await queryRunner.query(`CREATE TABLE "prices" ("id" text NOT NULL, "active" boolean, "description" text, "unit_amount" bigint, "currency" character varying(3), "type" "public"."prices_type_enum", "interval" "public"."prices_interval_enum", "interval_count" integer, "trial_period_days" integer, "metadata" jsonb, "product_id" text, CONSTRAINT "PK_2e40b9e4e631a53cd514d82ccd2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused')`);
        await queryRunner.query(`CREATE TABLE "subscriptions" ("id" text NOT NULL, "status" "public"."subscriptions_status_enum", "metadata" jsonb, "quantity" integer, "cancel_at_period_end" boolean NOT NULL DEFAULT false, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "current_period_start" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "current_period_end" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "ended_at" TIMESTAMP WITH TIME ZONE, "cancel_at" TIMESTAMP WITH TIME ZONE, "canceled_at" TIMESTAMP WITH TIME ZONE, "trial_start" TIMESTAMP WITH TIME ZONE, "trial_end" TIMESTAMP WITH TIME ZONE, "priceId" text, "userId" uuid NOT NULL, CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "customers" ("id" SERIAL NOT NULL, "stripe_customer_id" text, "user_id" uuid, CONSTRAINT "REL_11d81cd7be87b6f8865b0cf766" UNIQUE ("user_id"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_30f11d12306f7cf16c0ba70cbb" ON "customers" ("stripe_customer_id") WHERE stripe_customer_id IS NOT NULL`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reset_tokens" ADD CONSTRAINT "FK_61c9431c5fe994696fe1760a4df" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "prices" ADD CONSTRAINT "FK_144765f6b6bef86e113b507ed12" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_adc20a425b6268a729c11f87a18" FOREIGN KEY ("priceId") REFERENCES "prices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_fbdba4e2ac694cf8c9cecf4dc84" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_11d81cd7be87b6f8865b0cf7661" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_11d81cd7be87b6f8865b0cf7661"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_fbdba4e2ac694cf8c9cecf4dc84"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_adc20a425b6268a729c11f87a18"`);
        await queryRunner.query(`ALTER TABLE "prices" DROP CONSTRAINT "FK_144765f6b6bef86e113b507ed12"`);
        await queryRunner.query(`ALTER TABLE "reset_tokens" DROP CONSTRAINT "FK_61c9431c5fe994696fe1760a4df"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_30f11d12306f7cf16c0ba70cbb"`);
        await queryRunner.query(`DROP TABLE "customers"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
        await queryRunner.query(`DROP TABLE "prices"`);
        await queryRunner.query(`DROP TYPE "public"."prices_interval_enum"`);
        await queryRunner.query(`DROP TYPE "public"."prices_type_enum"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "reset_tokens"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    }

}
