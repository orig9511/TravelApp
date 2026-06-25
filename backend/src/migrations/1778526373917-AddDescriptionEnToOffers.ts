import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDescriptionEnToOffers1778526373917 implements MigrationInterface {
    name = 'AddDescriptionEnToOffers1778526373917'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "favorites" DROP CONSTRAINT "favorites_accommodation_id_fkey"`);
        await queryRunner.query(`DROP INDEX "public"."idx_favorites_user_offer"`);
        await queryRunner.query(`DROP INDEX "public"."idx_favorites_user_accommodation"`);
        await queryRunner.query(`ALTER TABLE "favorites" DROP COLUMN "accommodation_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "users_google_id_key"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "google_id"`);
        await queryRunner.query(`ALTER TABLE "reservations" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."reservation_status"`);
        await queryRunner.query(`ALTER TABLE "reservations" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "offers" ADD "description_en" text`);
        await queryRunner.query(`ALTER TABLE "favorites" DROP CONSTRAINT "FK_b2c6872cf67e85819f02df453f7"`);
        await queryRunner.query(`ALTER TABLE "favorites" DROP CONSTRAINT "UQ_3665f1bc342d692db67b7d21c73"`);
        await queryRunner.query(`ALTER TABLE "favorites" ALTER COLUMN "offer_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "favorites" ADD CONSTRAINT "UQ_3665f1bc342d692db67b7d21c73" UNIQUE ("user_id", "offer_id")`);
        await queryRunner.query(`ALTER TABLE "favorites" ADD CONSTRAINT "FK_b2c6872cf67e85819f02df453f7" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "favorites" DROP CONSTRAINT "FK_b2c6872cf67e85819f02df453f7"`);
        await queryRunner.query(`ALTER TABLE "favorites" DROP CONSTRAINT "UQ_3665f1bc342d692db67b7d21c73"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "favorites" ALTER COLUMN "offer_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "favorites" ADD CONSTRAINT "UQ_3665f1bc342d692db67b7d21c73" UNIQUE ("user_id", "offer_id")`);
        await queryRunner.query(`ALTER TABLE "favorites" ADD CONSTRAINT "FK_b2c6872cf67e85819f02df453f7" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "offers" DROP COLUMN "description_en"`);
        await queryRunner.query(`ALTER TABLE "reservations" ADD "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`CREATE TYPE "public"."reservation_status" AS ENUM('pending', 'confirmed', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "reservations" ADD "status" "public"."reservation_status" NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "google_id" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "users_google_id_key" UNIQUE ("google_id")`);
        await queryRunner.query(`ALTER TABLE "favorites" ADD "accommodation_id" uuid`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_favorites_user_accommodation" ON "favorites" ("accommodation_id", "user_id") WHERE (accommodation_id IS NOT NULL)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_favorites_user_offer" ON "favorites" ("offer_id", "user_id") WHERE (offer_id IS NOT NULL)`);
        await queryRunner.query(`ALTER TABLE "favorites" ADD CONSTRAINT "favorites_accommodation_id_fkey" FOREIGN KEY ("accommodation_id") REFERENCES "accommodations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
