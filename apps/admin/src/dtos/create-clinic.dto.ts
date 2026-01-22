import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateClinicDto {
  @ApiProperty({
    description: 'The clinic speciality',
    example: 'Dermatology',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  speciality: string;

  @ApiProperty({
    description: 'The clinic name',
    example: 'Dermatology Clinic-A',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  name: string;
}
