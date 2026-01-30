import { Language } from '@app/common';
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

export abstract class CreateUserDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  lastName: string;

  @ApiProperty({
    description: 'User language',
    enum: Language,
    example: Language.ARABIC,
    enumName: 'Language',
  })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @ApiProperty({
    description: 'User national ID',
    example: '30202041234567',
  })
  @IsString()
  @Length(14, 14)
  @Matches(/^[23]\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{7}$/)
  socialSecurityNumber: string;
}
