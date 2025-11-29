import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokenLanguageToUser1764337790575
  implements MigrationInterface
{
  name = 'AddRefreshTokenLanguageToUser1764337790575';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "password"`);
    await queryRunner.query(
      `ALTER TABLE "Doctors" ADD "password" character varying(256) NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."Users_language_enum" AS ENUM('0', '1')`,
    );
    await queryRunner.query(
      `ALTER TABLE "Users" ADD "language" "public"."Users_language_enum" NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "Users" ADD "refreshToken" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."Users_role_enum" RENAME TO "Users_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."Users_role_enum" AS ENUM('0', '1', '2', '3')`,
    );
    await queryRunner.query(
      `ALTER TABLE "Users" ALTER COLUMN "role" TYPE "public"."Users_role_enum" USING "role"::"text"::"public"."Users_role_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."Users_role_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."Users_role_enum_old" AS ENUM('0', '1', '2')`,
    );
    await queryRunner.query(
      `ALTER TABLE "Users" ALTER COLUMN "role" TYPE "public"."Users_role_enum_old" USING "role"::"text"::"public"."Users_role_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."Users_role_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."Users_role_enum_old" RENAME TO "Users_role_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "refreshToken"`);
    await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "language"`);
    await queryRunner.query(`DROP TYPE "public"."Users_language_enum"`);
    await queryRunner.query(`ALTER TABLE "Doctors" DROP COLUMN "password"`);
    await queryRunner.query(
      `ALTER TABLE "Users" ADD "password" character varying(256) NOT NULL`,
    );
  }
}
