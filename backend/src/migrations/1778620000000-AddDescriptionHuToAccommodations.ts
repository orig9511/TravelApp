import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDescriptionHuToAccommodations1778620000000 implements MigrationInterface {
  name = "AddDescriptionHuToAccommodations1778620000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accommodations" ADD "description_hu" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accommodations" DROP COLUMN "description_hu"`,
    );
  }
}
