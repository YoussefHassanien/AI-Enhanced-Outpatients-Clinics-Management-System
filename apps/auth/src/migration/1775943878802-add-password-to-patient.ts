import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordToPatient1775943878802 implements MigrationInterface {
    name = 'AddPasswordToPatient1775943878802'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Patients" ADD "password" character varying(256)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Patients" DROP COLUMN "password"`);
    }

}
