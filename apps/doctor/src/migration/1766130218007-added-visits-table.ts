import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddedVisitsTable1766130218007 implements MigrationInterface {
  name = 'AddedVisitsTable1766130218007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "Visits" ("id" SERIAL NOT NULL, "globalId" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "patientId" integer NOT NULL, "doctorId" integer NOT NULL, "diagnoses" text NOT NULL, CONSTRAINT "UQ_0b77bbafb2ec06e2665a4de6ba8" UNIQUE ("globalId"), CONSTRAINT "PK_c64792342596fae6da1c9e55c72" PRIMARY KEY ("id"))`,
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
    await queryRunner.query(`DROP TABLE "Visits"`);
  }
}
