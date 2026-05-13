import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ScanTypes } from '../constants';

export class UploadScanDto {
  @ApiProperty({
    description: 'Scan name',
    example: 'Brain MRI',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  name: string;

  @ApiProperty({
    description: 'Scan doctor comments',
    example: 'Brain tumor size decreased',
  })
  @IsString()
  @MaxLength(512)
  @IsOptional()
  comments?: string;

  @ApiProperty({
    enum: ScanTypes,
    description: 'Scans types',
    example: ScanTypes.MRI,
  })
  @IsEnum(ScanTypes)
  type: ScanTypes;

  @ApiProperty({
    description: 'The patient id of this medication',
    example: '0281ba4f-7592-477e-9d02-f2641aa89221',
  })
  @IsUUID()
  patientId: string;

  @ApiProperty({
    description: 'The clinic id of this scan',
    example: '0281ba4f-7592-477e-9d02-f2641aa89221',
  })
  @IsUUID()
  @IsOptional()
  clinicId?: string;
}
