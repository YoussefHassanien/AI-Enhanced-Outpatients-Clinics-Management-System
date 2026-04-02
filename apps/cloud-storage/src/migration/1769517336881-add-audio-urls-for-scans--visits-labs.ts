import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAudioUrlsForScansVisitsLabs1769517336881
  implements MigrationInterface
{
  name = 'AddAudioUrlsForScans-VisitsLabs1769517336881';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Visits" ADD "diagnosesAudioUrl" text`,
    );
    await queryRunner.query(`ALTER TABLE "Labs" ADD "commentsAudioUrl" text`);
    await queryRunner.query(`ALTER TABLE "Scans" ADD "commentsAudioUrl" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Scans" DROP COLUMN "commentsAudioUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Labs" DROP COLUMN "commentsAudioUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Visits" DROP COLUMN "diagnosesAudioUrl"`,
    );
  }
}
