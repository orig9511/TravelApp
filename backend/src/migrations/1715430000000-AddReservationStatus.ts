import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReservationStatus1715430000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservation_status') THEN
          CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled');
        END IF;
      END$$;
    `);
    await queryRunner.query(`
      ALTER TABLE reservations
        ADD COLUMN IF NOT EXISTS status reservation_status NOT NULL DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE reservations DROP COLUMN IF EXISTS status`,
    );
    await queryRunner.query(
      `ALTER TABLE reservations DROP COLUMN IF EXISTS updated_at`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS reservation_status`);
  }
}
