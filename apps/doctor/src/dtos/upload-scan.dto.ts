import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
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
}
