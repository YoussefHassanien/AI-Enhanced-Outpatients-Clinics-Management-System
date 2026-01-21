import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { BaseStaffDto } from './base-staff.dto';

export class CreateDoctorDto extends BaseStaffDto {
  @ApiProperty({
    description: 'User medical speciality',
    example: 'Dermatology',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  speciality: string;

  @ApiProperty({
    description: 'The clinic id that doctor belongs to',
    example: '718d3eed-43a9-44b9-a01b-5676dd781f25',
  })
  @IsUUID()
  clinicId: string;
}
