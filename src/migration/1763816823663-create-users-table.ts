import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1763816823663 implements MigrationInterface {
  name = 'CreateUsersTable1763816823663';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."Users_role_enum" AS ENUM('0', '1', '2')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."Users_gender_enum" AS ENUM('0', '1')`,
    );
    await queryRunner.query(
      `CREATE TABLE "Users" ("id" SERIAL NOT NULL, "globalId" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "firstName" character varying(128) NOT NULL, "lastName" character varying(128) NOT NULL, "password" character varying(256) NOT NULL, "role" "public"."Users_role_enum" NOT NULL, "gender" "public"."Users_gender_enum" NOT NULL, "dateOfBirth" date NOT NULL, "socialSecurityNumber" bigint NOT NULL, CONSTRAINT "UQ_4985e23c97e3c7f942d4f725c99" UNIQUE ("globalId"), CONSTRAINT "UQ_54d6ae4c82b343b3b16e6ccae85" UNIQUE ("socialSecurityNumber"), CONSTRAINT "PK_16d4f7d636df336db11d87413e3" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "Users"`);
    await queryRunner.query(`DROP TYPE "public"."Users_gender_enum"`);
    await queryRunner.query(`DROP TYPE "public"."Users_role_enum"`);
  }
}
