import { IsInt, IsOptional, IsPositive, IsString, IsUUID, IsMimeType, IsObject } from 'class-validator';

export class CreateMedicationAdminInternalDto {
    @IsObject()
    createMedicationDto: any;

    @IsUUID()
    patientGlobalId: string;

    @IsInt()
    @IsPositive()
    adminUserId: number;

    @IsString()
    @IsOptional()
    audioFilePath?: string;

    @IsMimeType()
    @IsOptional()
    audioMimetype?: string;
}
