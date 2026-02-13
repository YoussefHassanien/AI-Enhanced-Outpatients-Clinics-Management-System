import { IsInt, IsOptional, IsPositive, IsString, IsUUID, IsMimeType, IsObject } from 'class-validator';

export class UploadLabAdminInternalDto {
    @IsObject()
    uploadLabDto: any;

    @IsUUID()
    patientGlobalId: string;

    @IsInt()
    @IsPositive()
    adminUserId: number;

    @IsString()
    imageFilePath: string;

    @IsMimeType()
    imageMimetype: string;

    @IsString()
    @IsOptional()
    audioFilePath?: string;

    @IsMimeType()
    @IsOptional()
    audioMimetype?: string;
}
