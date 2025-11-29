import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePatientsTable1763823005535 implements MigrationInterface {
  name = 'CreatePatientsTable1763823005535';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "Patients" ("id" SERIAL NOT NULL, "globalId" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "address" character varying(512), "job" character varying(128), CONSTRAINT "UQ_993c75014a173701e1c5a03b9d5" UNIQUE ("globalId"), CONSTRAINT "PK_9cb4d71eb7ec74c115f3b619841" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "Patients"`);
  }
}
