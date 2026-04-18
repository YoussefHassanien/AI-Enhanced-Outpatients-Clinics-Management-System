import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrateAdminToSuperadmin1776032181935 implements MigrationInterface {
    name = 'MigrateAdminToSuperadmin1776032181935'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Patients" DROP COLUMN "password"`);
        await queryRunner.query(`ALTER TABLE "Super-Admins" ADD "speciality" character varying(512)`);
        await queryRunner.query(`ALTER TYPE "public"."Users_role_enum" RENAME TO "Users_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."Users_role_enum" AS ENUM('0', '1', '2')`);
        await queryRunner.query(`ALTER TABLE "Users" ALTER COLUMN "role" TYPE "public"."Users_role_enum" USING "role"::"text"::"public"."Users_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."Users_role_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."Users_role_enum_old" AS ENUM('0', '1', '2', '3')`);
        await queryRunner.query(`ALTER TABLE "Users" ALTER COLUMN "role" TYPE "public"."Users_role_enum_old" USING "role"::"text"::"public"."Users_role_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."Users_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."Users_role_enum_old" RENAME TO "Users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "Super-Admins" DROP COLUMN "speciality"`);
        await queryRunner.query(`ALTER TABLE "Patients" ADD "password" character varying(256)`);
    }

}
