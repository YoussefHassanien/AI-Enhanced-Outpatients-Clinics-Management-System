import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAudioUrlsForMedications1769521389586
  implements MigrationInterface
{
  name = 'AddAudioUrlsForMedications1769521389586';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Medications" ADD "commentsAudioUrl" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Medications" DROP COLUMN "commentsAudioUrl"`,
    );
  }
}
