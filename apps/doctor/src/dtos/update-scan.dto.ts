import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ScanTypes } from '../constants';

export class UpdateScanDto {
  @ApiPropertyOptional({
    description: 'Scan name',
    example: 'Brain MRI',
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  name?: string;

  @ApiPropertyOptional({
    description: 'Scan doctor comments',
    example: 'Brain tumor size decreased',
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  comments?: string;

  @ApiPropertyOptional({
    enum: ScanTypes,
    description: 'Scans types',
    example: ScanTypes.MRI,
  })
  @IsOptional()
  @IsEnum(ScanTypes)
  type?: ScanTypes;
}
