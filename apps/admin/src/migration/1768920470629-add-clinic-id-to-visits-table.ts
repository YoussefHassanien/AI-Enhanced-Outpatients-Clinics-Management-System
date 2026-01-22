import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClinicIdToVisitsTable1768920470629
  implements MigrationInterface
{
  name = 'AddClinicIdToVisitsTable1768920470629';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Visits" ADD "clinicId" integer`);
    await queryRunner.query(
      `CREATE INDEX "IDX_f47bf9e40586326ae9d177657d" ON "Visits" ("clinicId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f47bf9e40586326ae9d177657d"`,
    );
    await queryRunner.query(`ALTER TABLE "Visits" DROP COLUMN "clinicId"`);
  }
}
