import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddedUniqueConstraintOnUserPhone1766270315747
  implements MigrationInterface
{
  name = 'AddedUniqueConstraintOnUserPhone1766270315747';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Admins" DROP CONSTRAINT "FK_ed19c1d44ddd3873f38a715e44d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Admins" ADD CONSTRAINT "UQ_230a223057d1ed63f52a48d2cad" UNIQUE ("phone")`,
    );
    await queryRunner.query(
      `ALTER TABLE "Admins" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Doctors" DROP CONSTRAINT "FK_d33661c731dd4bc7083a2e0c558"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Doctors" ADD CONSTRAINT "UQ_7a64caf34e350834ca2331a0500" UNIQUE ("phone")`,
    );
    await queryRunner.query(
      `ALTER TABLE "Doctors" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Admins" ADD CONSTRAINT "FK_ed19c1d44ddd3873f38a715e44d" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Doctors" ADD CONSTRAINT "FK_d33661c731dd4bc7083a2e0c558" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Doctors" DROP CONSTRAINT "FK_d33661c731dd4bc7083a2e0c558"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Admins" DROP CONSTRAINT "FK_ed19c1d44ddd3873f38a715e44d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Doctors" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Doctors" DROP CONSTRAINT "UQ_7a64caf34e350834ca2331a0500"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Doctors" ADD CONSTRAINT "FK_d33661c731dd4bc7083a2e0c558" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Admins" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Admins" DROP CONSTRAINT "UQ_230a223057d1ed63f52a48d2cad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Admins" ADD CONSTRAINT "FK_ed19c1d44ddd3873f38a715e44d" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
