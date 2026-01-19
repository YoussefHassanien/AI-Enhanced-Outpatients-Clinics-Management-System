import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddedNotNullConstraintOnUserId1766274800153
  implements MigrationInterface
{
  name = 'AddedNotNullConstraintOnUserId1766274800153';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Admins" DROP CONSTRAINT "FK_ed19c1d44ddd3873f38a715e44d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Admins" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Doctors" DROP CONSTRAINT "FK_d33661c731dd4bc7083a2e0c558"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Doctors" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Patients" DROP CONSTRAINT "FK_7a6a5ab44fe595679b9bdd6e9e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Patients" ALTER COLUMN "userId" SET NOT NULL`,
    );
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
      `ALTER TABLE "Patients" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Patients" ADD CONSTRAINT "FK_7a6a5ab44fe595679b9bdd6e9e8" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Doctors" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Doctors" ADD CONSTRAINT "FK_d33661c731dd4bc7083a2e0c558" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Admins" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Admins" ADD CONSTRAINT "FK_ed19c1d44ddd3873f38a715e44d" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
