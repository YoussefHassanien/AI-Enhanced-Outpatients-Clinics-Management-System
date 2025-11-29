import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminTable1764356977891 implements MigrationInterface {
  name = 'AddAdminTable1764356977891';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Doctors" DROP CONSTRAINT "FK_d33661c731dd4bc7083a2e0c558"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Patients" DROP CONSTRAINT "FK_7a6a5ab44fe595679b9bdd6e9e8"`,
    );
    await queryRunner.query(
      `CREATE TABLE "Admins" ("id" SERIAL NOT NULL, "globalId" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "phone" character varying(15) NOT NULL, "email" character varying(256) NOT NULL, "password" character varying(256) NOT NULL, "userId" integer NOT NULL, CONSTRAINT "UQ_a33ff27eb00eb5188bb5251e400" UNIQUE ("globalId"), CONSTRAINT "UQ_5dd3e67c7838483da1149025c32" UNIQUE ("email"), CONSTRAINT "UQ_ed19c1d44ddd3873f38a715e44d" UNIQUE ("userId"), CONSTRAINT "REL_ed19c1d44ddd3873f38a715e44" UNIQUE ("userId"), CONSTRAINT "PK_519fa28e9620ff7e67759daa754" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "refreshToken"`);
    await queryRunner.query(
      `ALTER TABLE "Admins" ADD CONSTRAINT "FK_ed19c1d44ddd3873f38a715e44d" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Doctors" ADD CONSTRAINT "FK_d33661c731dd4bc7083a2e0c558" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Patients" ADD CONSTRAINT "FK_7a6a5ab44fe595679b9bdd6e9e8" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Patients" DROP CONSTRAINT "FK_7a6a5ab44fe595679b9bdd6e9e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Doctors" DROP CONSTRAINT "FK_d33661c731dd4bc7083a2e0c558"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Admins" DROP CONSTRAINT "FK_ed19c1d44ddd3873f38a715e44d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Users" ADD "refreshToken" character varying NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "Admins"`);
    await queryRunner.query(
      `ALTER TABLE "Patients" ADD CONSTRAINT "FK_7a6a5ab44fe595679b9bdd6e9e8" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Doctors" ADD CONSTRAINT "FK_d33661c731dd4bc7083a2e0c558" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
