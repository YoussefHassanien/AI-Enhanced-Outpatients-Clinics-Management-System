import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Gender } from '@app/common';

export class UpdateDoctorDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @MaxLength(320)
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+201234567890',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'User medical speciality',
    example: 'Dermatology',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  @IsOptional()
  speciality?: string;

  @ApiProperty({
    description: 'The global ID of the clinic the doctor belongs to',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  @IsOptional()
  clinicId?: string;

}
