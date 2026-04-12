import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class PatientLoginDto {
  @ApiProperty({
    description: 'User national ID',
    example: '30202041234567',
  })
  @IsString()
  @Length(14, 14)
  @Matches(/^[23]\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{7}$/)
  socialSecurityNumber: string;

  @ApiProperty({
    description: 'Patient password',
    example: 'StrongPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
