import { MigrationInterface, QueryRunner } from 'typeorm';

export class MadePhotoUrlInScansAndLabsNullable1769380702477
  implements MigrationInterface
{
  name = 'MadePhotoUrlInScansAndLabsNullable1769380702477';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Labs" ALTER COLUMN "photoUrl" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Scans" ALTER COLUMN "photoUrl" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Scans" ALTER COLUMN "photoUrl" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Labs" ALTER COLUMN "photoUrl" SET NOT NULL`,
    );
  }
}
