import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClinicsTableAndClinicIdToDoctorsTable1768920128133
  implements MigrationInterface
{
  name = 'AddClinicsTableAndClinicIdToDoctorsTable1768920128133';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "Clinics" ("id" SERIAL NOT NULL, "globalId" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "speciality" character varying(256) NOT NULL, "name" character varying(256) NOT NULL, CONSTRAINT "UQ_6f4c1fd897da1a62ebb98d64b70" UNIQUE ("globalId"), CONSTRAINT "PK_8c7557071b0c1bd95d6f3585575" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "Doctors" ADD "clinicId" integer`);
    await queryRunner.query(
      `CREATE INDEX "IDX_99eebc83ff334ed7fec450396c" ON "Doctors" ("clinicId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_99eebc83ff334ed7fec450396c"`,
    );
    await queryRunner.query(`ALTER TABLE "Doctors" DROP COLUMN "clinicId"`);
    await queryRunner.query(`DROP TABLE "Clinics"`);
  }
}
