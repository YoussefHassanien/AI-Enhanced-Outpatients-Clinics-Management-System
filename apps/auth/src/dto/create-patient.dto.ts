import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateUserDto } from '../constants';

export class CreatePatientDto extends CreateUserDto {
  @ApiProperty({
    description: 'User address',
    example: '53 El tahrir street, Dokki, Giza, Egypt',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  @IsOptional()
  address: string;

  @ApiProperty({
    description: 'User job',
    example: 'Math teacher',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  @IsOptional()
  job: string;
}
