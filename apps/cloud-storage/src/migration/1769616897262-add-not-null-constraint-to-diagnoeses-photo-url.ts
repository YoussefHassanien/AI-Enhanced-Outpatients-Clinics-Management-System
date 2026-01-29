import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotNullConstraintToDiagnoesesPhotoUrl1769616897262
  implements MigrationInterface
{
  name = 'AddNotNullConstraintToDiagnoesesPhotoUrl1769616897262';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Labs" ALTER COLUMN "photoUrl" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Scans" ALTER COLUMN "photoUrl" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Scans" ALTER COLUMN "photoUrl" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Labs" ALTER COLUMN "photoUrl" DROP NOT NULL`,
    );
  }
}
