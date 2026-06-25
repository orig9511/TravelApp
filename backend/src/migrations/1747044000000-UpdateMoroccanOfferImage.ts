import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMoroccanOfferImage1747044000000 implements MigrationInterface {
  name = "UpdateMoroccanOfferImage1747044000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE offers
      SET images = ARRAY[
        'https://images.unsplash.com/photo-1760681554203-67f246d3ec7a?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=800',
        'https://images.unsplash.com/photo-1509721434272-b79147e0e708?w=800'
      ]::text[]
      WHERE title = 'Marokkói karavánutazás: Marrakesh és a Szahara'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE offers
      SET images = ARRAY[
        'https://images.unsplash.com/photo-1532295454114-d7bc89024613?w=800',
        'https://images.unsplash.com/photo-1509721434272-b79147e0e708?w=800'
      ]::text[]
      WHERE title = 'Marokkói karavánutazás: Marrakesh és a Szahara'
    `);
  }
}
