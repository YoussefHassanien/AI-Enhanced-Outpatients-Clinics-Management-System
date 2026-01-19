import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangedEntitiesCodeToMatchTypeormAndMicroserviceBestPractice1766146381723
  implements MigrationInterface
{
  name =
    'ChangedEntitiesCodeToMatchTypeormAndMicroserviceBestPractice1766146381723';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Visits" DROP CONSTRAINT "FK_0306fa00a9bde5ba20c78f2bd15"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Visits" DROP CONSTRAINT "FK_f2746a4fc62c4174fa1e281ef33"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Labs" DROP CONSTRAINT "FK_45d65d20b56e81fd71fdf972e9a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Labs" DROP CONSTRAINT "FK_08d89bfb6319715df43fc58519e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" DROP CONSTRAINT "FK_b056f488dcaff4fe268694b3506"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" DROP CONSTRAINT "FK_05afde4d94fa42d78d0ebe67291"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Scans" DROP CONSTRAINT "FK_dee45dd6dca3d7108284800e522"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Scans" DROP CONSTRAINT "FK_da7872c59f804d94f2a6b1d9643"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Visits" ALTER COLUMN "patientId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Visits" ALTER COLUMN "doctorId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Labs" ALTER COLUMN "patientId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Labs" ALTER COLUMN "doctorId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" ALTER COLUMN "patientId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" ALTER COLUMN "doctorId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Scans" ALTER COLUMN "patientId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Scans" ALTER COLUMN "doctorId" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Scans" ALTER COLUMN "doctorId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Scans" ALTER COLUMN "patientId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" ALTER COLUMN "doctorId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" ALTER COLUMN "patientId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Labs" ALTER COLUMN "doctorId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Labs" ALTER COLUMN "patientId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Visits" ALTER COLUMN "doctorId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Visits" ALTER COLUMN "patientId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Scans" ADD CONSTRAINT "FK_da7872c59f804d94f2a6b1d9643" FOREIGN KEY ("doctorId") REFERENCES "Doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Scans" ADD CONSTRAINT "FK_dee45dd6dca3d7108284800e522" FOREIGN KEY ("patientId") REFERENCES "Patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" ADD CONSTRAINT "FK_05afde4d94fa42d78d0ebe67291" FOREIGN KEY ("doctorId") REFERENCES "Doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" ADD CONSTRAINT "FK_b056f488dcaff4fe268694b3506" FOREIGN KEY ("patientId") REFERENCES "Patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Labs" ADD CONSTRAINT "FK_08d89bfb6319715df43fc58519e" FOREIGN KEY ("doctorId") REFERENCES "Doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Labs" ADD CONSTRAINT "FK_45d65d20b56e81fd71fdf972e9a" FOREIGN KEY ("patientId") REFERENCES "Patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Visits" ADD CONSTRAINT "FK_f2746a4fc62c4174fa1e281ef33" FOREIGN KEY ("doctorId") REFERENCES "Doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Visits" ADD CONSTRAINT "FK_0306fa00a9bde5ba20c78f2bd15" FOREIGN KEY ("patientId") REFERENCES "Patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
