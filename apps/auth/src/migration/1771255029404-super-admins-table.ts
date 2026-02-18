import { MigrationInterface, QueryRunner } from 'typeorm';

export class SuperAdminsTable1771255029404 implements MigrationInterface {
  name = 'SuperAdminsTable1771255029404';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "Super-Admins" ("id" SERIAL NOT NULL, "globalId" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "phone" character varying(15) NOT NULL, "email" character varying(256) NOT NULL, "password" character varying(256) NOT NULL, "userId" integer NOT NULL, CONSTRAINT "UQ_1dd8b02fd9f628c504d9f540109" UNIQUE ("globalId"), CONSTRAINT "UQ_dd9b6a10c36b14b8ba2891d64f9" UNIQUE ("phone"), CONSTRAINT "UQ_9d4713e72586f758bd3ee32df49" UNIQUE ("email"), CONSTRAINT "REL_fed7bbf8f21dbe2f11a9caff3d" UNIQUE ("userId"), CONSTRAINT "PK_9bfa198cb3fb57e319f363be2f6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "Super-Admins" ADD CONSTRAINT "FK_fed7bbf8f21dbe2f11a9caff3d1" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Super-Admins" DROP CONSTRAINT "FK_fed7bbf8f21dbe2f11a9caff3d1"`,
    );
    await queryRunner.query(`DROP TABLE "Super-Admins"`);
  }
}
