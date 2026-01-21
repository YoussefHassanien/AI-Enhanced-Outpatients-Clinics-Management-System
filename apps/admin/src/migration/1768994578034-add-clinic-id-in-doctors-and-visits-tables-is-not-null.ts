import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClinicIdInDoctorsAndVisitsTablesIsNotNull1768994578034
  implements MigrationInterface
{
  name = 'AddClinicIdInDoctorsAndVisitsTablesIsNotNull1768994578034';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Visits" ALTER COLUMN "clinicId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Doctors" ALTER COLUMN "clinicId" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Doctors" ALTER COLUMN "clinicId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Visits" ALTER COLUMN "clinicId" DROP NOT NULL`,
    );
  }
}
