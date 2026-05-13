import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateClinicDto {
  @ApiPropertyOptional({
    description: 'The clinic speciality',
    example: 'Dermatology',
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  speciality?: string;

  @ApiPropertyOptional({
    description: 'The clinic name',
    example: 'Dermatology Clinic-A',
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  name?: string;
}
