import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangedDoctorIdToUserId1770646663416
  implements MigrationInterface
{
  name = 'ChangedDoctorIdToUserId1770646663416';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f2746a4fc62c4174fa1e281ef3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_08d89bfb6319715df43fc58519"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_05afde4d94fa42d78d0ebe6729"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_da7872c59f804d94f2a6b1d964"`,
    );
    await queryRunner.query(`DROP INDEX "public"."index_1"`);
    await queryRunner.query(
      `ALTER TABLE "Visits" RENAME COLUMN "doctorId" TO "userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Labs" RENAME COLUMN "doctorId" TO "userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" RENAME COLUMN "doctorId" TO "userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Scans" RENAME COLUMN "doctorId" TO "userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Admins" RENAME COLUMN "specialty" TO "speciality"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_588294bcdc30004cf9e4a8c789" ON "Visits" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4279cb41b12013bf415582438a" ON "Labs" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_80dbf82fdd1596e75405de7291" ON "Medications" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9a5448b3f851e151bde9e34bfd" ON "Scans" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_70c4c3a966f1e2719351c1a5a7" ON "Admins" ("clinicId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_70c4c3a966f1e2719351c1a5a7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9a5448b3f851e151bde9e34bfd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_80dbf82fdd1596e75405de7291"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4279cb41b12013bf415582438a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_588294bcdc30004cf9e4a8c789"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Admins" RENAME COLUMN "speciality" TO "specialty"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Scans" RENAME COLUMN "userId" TO "doctorId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" RENAME COLUMN "userId" TO "doctorId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Labs" RENAME COLUMN "userId" TO "doctorId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Visits" RENAME COLUMN "userId" TO "doctorId"`,
    );
    await queryRunner.query(`CREATE INDEX "index_1" ON "Admins" ("clinicId") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_da7872c59f804d94f2a6b1d964" ON "Scans" ("doctorId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_05afde4d94fa42d78d0ebe6729" ON "Medications" ("doctorId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_08d89bfb6319715df43fc58519" ON "Labs" ("doctorId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f2746a4fc62c4174fa1e281ef3" ON "Visits" ("doctorId") `,
    );
  }
}
