import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePatientDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  @IsOptional()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  @IsOptional()
  lastName: string;

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
