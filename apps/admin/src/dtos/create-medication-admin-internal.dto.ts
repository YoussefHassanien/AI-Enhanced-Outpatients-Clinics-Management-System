import {
    IsEnum,
    IsInt,
    IsMimeType,
    IsNotEmpty,
    IsOptional,
    IsPositive,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';
import { MedicationDosage, MedicationPeriod } from '../../../doctor/src/constants';

export class CreateMedicationAdminInternalDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(256)
    readonly name: string;

    @IsEnum(MedicationDosage)
    readonly dosage: MedicationDosage;

    @IsEnum(MedicationPeriod)
    readonly period: MedicationPeriod;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(512)
    readonly comments?: string;

    @IsUUID()
    readonly patientGlobalId: string;

    @IsInt()
    @IsPositive()
    readonly adminUserId: number;

    @IsString()
    @IsOptional()
    readonly audioFilePath?: string;

    @IsMimeType()
    @IsOptional()
    readonly audioMimetype?: string;
}
