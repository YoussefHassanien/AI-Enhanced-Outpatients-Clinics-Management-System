import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddedLabsTable1766136243871 implements MigrationInterface {
  name = 'AddedLabsTable1766136243871';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "Labs" ("id" SERIAL NOT NULL, "globalId" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying(256) NOT NULL, "photoUrl" text NOT NULL, "comments" character varying(512), "patientId" integer, "doctorId" integer, CONSTRAINT "UQ_530a12b070787f26b051b6b6304" UNIQUE ("globalId"), CONSTRAINT "PK_4cd87690fc964c6e6189e17f24a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_45d65d20b56e81fd71fdf972e9" ON "Labs" ("patientId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_08d89bfb6319715df43fc58519" ON "Labs" ("doctorId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "Labs" ADD CONSTRAINT "FK_45d65d20b56e81fd71fdf972e9a" FOREIGN KEY ("patientId") REFERENCES "Patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Labs" ADD CONSTRAINT "FK_08d89bfb6319715df43fc58519e" FOREIGN KEY ("doctorId") REFERENCES "Doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Labs" DROP CONSTRAINT "FK_08d89bfb6319715df43fc58519e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Labs" DROP CONSTRAINT "FK_45d65d20b56e81fd71fdf972e9a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_08d89bfb6319715df43fc58519"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_45d65d20b56e81fd71fdf972e9"`,
    );
    await queryRunner.query(`DROP TABLE "Labs"`);
  }
}
