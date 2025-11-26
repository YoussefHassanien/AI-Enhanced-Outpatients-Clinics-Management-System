import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddForeignKeyConstraintsForDoctorsPatients1763823391335
  implements MigrationInterface
{
  name = 'AddForeignKeyConstraintsForDoctorsPatients1763823391335';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Doctors" ADD "userId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Doctors" ADD CONSTRAINT "UQ_d33661c731dd4bc7083a2e0c558" UNIQUE ("userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "Patients" ADD "userId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Patients" ADD CONSTRAINT "UQ_7a6a5ab44fe595679b9bdd6e9e8" UNIQUE ("userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "Doctors" ADD CONSTRAINT "FK_d33661c731dd4bc7083a2e0c558" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Patients" ADD CONSTRAINT "FK_7a6a5ab44fe595679b9bdd6e9e8" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "Patients" DROP CONSTRAINT "UQ_7a6a5ab44fe595679b9bdd6e9e8"`,
    );
    await queryRunner.query(`ALTER TABLE "Patients" DROP COLUMN "userId"`);
    await queryRunner.query(
      `ALTER TABLE "Doctors" DROP CONSTRAINT "UQ_d33661c731dd4bc7083a2e0c558"`,
    );
    await queryRunner.query(`ALTER TABLE "Doctors" DROP COLUMN "userId"`);
  }
}
