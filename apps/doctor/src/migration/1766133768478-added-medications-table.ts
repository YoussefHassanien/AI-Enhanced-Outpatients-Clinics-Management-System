import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddedMedicationsTable1766133768478 implements MigrationInterface {
  name = 'AddedMedicationsTable1766133768478';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."Medications_dosage_enum" AS ENUM('1', '2', '3', '4', '5', '6')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."Medications_period_enum" AS ENUM('0', '1', '2', '3', '4', '5', '6', '8', '9', '10', '11', '12', '13', '15', '16', '17', '18', '19', '20', '22', '23', '24', '25', '26', '27', '29', '7', '14', '21', '28', '35', '42', '49', '56', '63', '70', '77', '84', '30', '60', '90', '120', '150', '180', '210', '240', '270')`,
    );
    await queryRunner.query(
      `CREATE TABLE "Medications" ("id" SERIAL NOT NULL, "globalId" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "patientId" integer NOT NULL, "doctorId" integer NOT NULL, "name" character varying(256) NOT NULL, "dosage" "public"."Medications_dosage_enum" NOT NULL, "period" "public"."Medications_period_enum" NOT NULL, CONSTRAINT "UQ_4995b46ddac88be6c444de0d28f" UNIQUE ("globalId"), CONSTRAINT "PK_97fd9c126414ba14136a1c7a661" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" ADD CONSTRAINT "FK_b056f488dcaff4fe268694b3506" FOREIGN KEY ("patientId") REFERENCES "Patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" ADD CONSTRAINT "FK_05afde4d94fa42d78d0ebe67291" FOREIGN KEY ("doctorId") REFERENCES "Doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Medications" DROP CONSTRAINT "FK_05afde4d94fa42d78d0ebe67291"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Medications" DROP CONSTRAINT "FK_b056f488dcaff4fe268694b3506"`,
    );
    await queryRunner.query(`DROP TABLE "Medications"`);
    await queryRunner.query(`DROP TYPE "public"."Medications_period_enum"`);
    await queryRunner.query(`DROP TYPE "public"."Medications_dosage_enum"`);
  }
}
