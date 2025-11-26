import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDoctorsTable1763822526313 implements MigrationInterface {
  name = 'CreateDoctorsTable1763822526313';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "Doctors" ("id" SERIAL NOT NULL, "globalId" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "speciality" character varying(512) NOT NULL, "phone" character varying(15) NOT NULL, "email" character varying(256) NOT NULL, "isApproved" boolean NOT NULL, CONSTRAINT "UQ_5584b04fd110e66fac05a079fe6" UNIQUE ("globalId"), CONSTRAINT "UQ_e79145a8ed1c6680d54be9b9113" UNIQUE ("email"), CONSTRAINT "PK_c7db451695b80fdaffa17ce8804" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "Doctors"`);
  }
}
