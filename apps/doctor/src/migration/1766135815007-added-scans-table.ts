import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddedScansTable1766135815007 implements MigrationInterface {
  name = 'AddedScansTable1766135815007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."Scans_type_enum" AS ENUM('0', '1', '2', '3', '4', '5')`,
    );
    await queryRunner.query(
      `CREATE TABLE "Scans" ("id" SERIAL NOT NULL, "globalId" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying(256) NOT NULL, "type" "public"."Scans_type_enum" NOT NULL, "photoUrl" text NOT NULL, "comments" character varying(512), "patientId" integer, "doctorId" integer, CONSTRAINT "UQ_98b789fa55c54f315fd8240d540" UNIQUE ("globalId"), CONSTRAINT "PK_f465c6a3fe815f338df39b38b46" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dee45dd6dca3d7108284800e52" ON "Scans" ("patientId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_da7872c59f804d94f2a6b1d964" ON "Scans" ("doctorId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" ADD "comments" character varying(512)`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" DROP CONSTRAINT "FK_b056f488dcaff4fe268694b3506"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" DROP CONSTRAINT "FK_05afde4d94fa42d78d0ebe67291"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" ALTER COLUMN "patientId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" ALTER COLUMN "doctorId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Patients" DROP CONSTRAINT "FK_7a6a5ab44fe595679b9bdd6e9e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Patients" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Visits" DROP CONSTRAINT "FK_0306fa00a9bde5ba20c78f2bd15"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Visits" DROP CONSTRAINT "FK_f2746a4fc62c4174fa1e281ef33"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Visits" ALTER COLUMN "patientId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Visits" ALTER COLUMN "doctorId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b056f488dcaff4fe268694b350" ON "Medications" ("patientId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_05afde4d94fa42d78d0ebe6729" ON "Medications" ("doctorId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0306fa00a9bde5ba20c78f2bd1" ON "Visits" ("patientId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f2746a4fc62c4174fa1e281ef3" ON "Visits" ("doctorId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" ADD CONSTRAINT "FK_b056f488dcaff4fe268694b3506" FOREIGN KEY ("patientId") REFERENCES "Patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" ADD CONSTRAINT "FK_05afde4d94fa42d78d0ebe67291" FOREIGN KEY ("doctorId") REFERENCES "Doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Scans" ADD CONSTRAINT "FK_dee45dd6dca3d7108284800e522" FOREIGN KEY ("patientId") REFERENCES "Patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Scans" ADD CONSTRAINT "FK_da7872c59f804d94f2a6b1d9643" FOREIGN KEY ("doctorId") REFERENCES "Doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Patients" ADD CONSTRAINT "FK_7a6a5ab44fe595679b9bdd6e9e8" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Visits" ADD CONSTRAINT "FK_0306fa00a9bde5ba20c78f2bd15" FOREIGN KEY ("patientId") REFERENCES "Patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Visits" ADD CONSTRAINT "FK_f2746a4fc62c4174fa1e281ef33" FOREIGN KEY ("doctorId") REFERENCES "Doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Visits" DROP CONSTRAINT "FK_f2746a4fc62c4174fa1e281ef33"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Visits" DROP CONSTRAINT "FK_0306fa00a9bde5ba20c78f2bd15"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Patients" DROP CONSTRAINT "FK_7a6a5ab44fe595679b9bdd6e9e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Scans" DROP CONSTRAINT "FK_da7872c59f804d94f2a6b1d9643"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Scans" DROP CONSTRAINT "FK_dee45dd6dca3d7108284800e522"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" DROP CONSTRAINT "FK_05afde4d94fa42d78d0ebe67291"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" DROP CONSTRAINT "FK_b056f488dcaff4fe268694b3506"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f2746a4fc62c4174fa1e281ef3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0306fa00a9bde5ba20c78f2bd1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_05afde4d94fa42d78d0ebe6729"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b056f488dcaff4fe268694b350"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Visits" ALTER COLUMN "doctorId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Visits" ALTER COLUMN "patientId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Visits" ADD CONSTRAINT "FK_f2746a4fc62c4174fa1e281ef33" FOREIGN KEY ("doctorId") REFERENCES "Doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Visits" ADD CONSTRAINT "FK_0306fa00a9bde5ba20c78f2bd15" FOREIGN KEY ("patientId") REFERENCES "Patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Patients" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Patients" ADD CONSTRAINT "FK_7a6a5ab44fe595679b9bdd6e9e8" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" ALTER COLUMN "doctorId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" ALTER COLUMN "patientId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" ADD CONSTRAINT "FK_05afde4d94fa42d78d0ebe67291" FOREIGN KEY ("doctorId") REFERENCES "Doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" ADD CONSTRAINT "FK_b056f488dcaff4fe268694b3506" FOREIGN KEY ("patientId") REFERENCES "Patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "Medications" DROP COLUMN "comments"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_da7872c59f804d94f2a6b1d964"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dee45dd6dca3d7108284800e52"`,
    );
    await queryRunner.query(`DROP TABLE "Scans"`);
    await queryRunner.query(`DROP TYPE "public"."Scans_type_enum"`);
  }
}
