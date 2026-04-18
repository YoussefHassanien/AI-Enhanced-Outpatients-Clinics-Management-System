import { MigrationInterface, QueryRunner } from 'typeorm';

export class SuperAdminsChanges1776510221536 implements MigrationInterface {
  name = 'SuperAdminsChanges1776510221536';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Super-Admins" ADD "clinicId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Doctors" ALTER COLUMN "speciality" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f5b982f972dd3b13c7d0ee07ac" ON "Super-Admins" ("clinicId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f5b982f972dd3b13c7d0ee07ac"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Doctors" ALTER COLUMN "speciality" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Super-Admins" DROP COLUMN "clinicId"`,
    );
  }
}
