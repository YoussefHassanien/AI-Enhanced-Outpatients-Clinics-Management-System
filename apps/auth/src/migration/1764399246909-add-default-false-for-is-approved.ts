import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultFalseForIsApproved1764399246909
  implements MigrationInterface
{
  name = 'AddDefaultFalseForIsApproved1764399246909';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Doctors" ALTER COLUMN "isApproved" SET DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Doctors" ALTER COLUMN "isApproved" DROP DEFAULT`,
    );
  }
}
