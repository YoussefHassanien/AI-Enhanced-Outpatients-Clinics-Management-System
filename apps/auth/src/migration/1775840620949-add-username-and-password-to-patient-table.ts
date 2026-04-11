import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsernameAndPasswordToPatientTable1775840620949 implements MigrationInterface {
    name = 'AddUsernameAndPasswordToPatientTable1775840620949'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Patients" ADD "username" character varying(128) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Patients" ADD CONSTRAINT "UQ_0fc181c16bfa2ad068bfa141bf4" UNIQUE ("username")`);
        await queryRunner.query(`ALTER TABLE "Patients" ADD "password" character varying(256) NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_0fc181c16bfa2ad068bfa141bf" ON "Patients" ("username") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_0fc181c16bfa2ad068bfa141bf"`);
        await queryRunner.query(`ALTER TABLE "Patients" DROP COLUMN "password"`);
        await queryRunner.query(`ALTER TABLE "Patients" DROP CONSTRAINT "UQ_0fc181c16bfa2ad068bfa141bf4"`);
        await queryRunner.query(`ALTER TABLE "Patients" DROP COLUMN "username"`);
    }

}
