import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccommodationFavorites1715530000000 implements MigrationInterface {
  name = "AddAccommodationFavorites1715530000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "favorites" ALTER COLUMN "offer_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" ADD COLUMN IF NOT EXISTS "accommodation_id" UUID REFERENCES accommodations(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "idx_favorites_user_offer" ON "favorites"(user_id, offer_id) WHERE offer_id IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "idx_favorites_user_accommodation" ON "favorites"(user_id, accommodation_id) WHERE accommodation_id IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_favorites_user_accommodation"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_favorites_user_offer"`);
    await queryRunner.query(
      `ALTER TABLE "favorites" DROP COLUMN "accommodation_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" ALTER COLUMN "offer_id" SET NOT NULL`,
    );
  }
}
