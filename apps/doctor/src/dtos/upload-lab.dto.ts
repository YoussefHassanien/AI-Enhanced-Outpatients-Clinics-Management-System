import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UploadLabDto {
  @ApiProperty({
    description: 'Lab test name',
    example: 'General blood analysis',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  name: string;

  @ApiProperty({
    description: 'Lab test doctor comments',
    example: 'Blood pressure readings is concerning',
  })
  @IsString()
  @MaxLength(512)
  @IsOptional()
  comments?: string;

  @ApiProperty({
    description: 'The patient id of this medication',
    example: '0281ba4f-7592-477e-9d02-f2641aa89221',
  })
  @IsUUID()
  patientId: string;

  @ApiProperty({
    description: 'The clinic id of this lab',
    example: '0281ba4f-7592-477e-9d02-f2641aa89221',
  })
  @IsUUID()
  @IsOptional()
  clinicId?: string;
}
