import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { BaseStaffDto } from '../constants';

export class CreateDoctorDto extends BaseStaffDto {
  @ApiProperty({
    description: 'User medical speciality',
    example: 'Dermatology',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  speciality: string;
}
