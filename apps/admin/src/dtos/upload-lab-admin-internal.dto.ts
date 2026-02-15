import {
    IsInt,
    IsMimeType,
    IsNotEmpty,
    IsOptional,
    IsPositive,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';

export class UploadLabAdminInternalDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(256)
    readonly name: string;

    @IsString()
    @MaxLength(512)
    @IsOptional()
    readonly comments?: string;

    @IsUUID()
    readonly patientGlobalId: string;

    @IsInt()
    @IsPositive()
    readonly adminUserId: number;

    @IsString()
    @IsNotEmpty()
    readonly imageFilePath: string;

    @IsMimeType()
    readonly imageMimetype: string;

    @IsString()
    @IsOptional()
    readonly audioFilePath?: string;

    @IsMimeType()
    @IsOptional()
    readonly audioMimetype?: string;
}
