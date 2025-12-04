import { BaseEntity, Environment, Language } from '@app/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  Contains,
  Equals,
  IsAlphanumeric,
  IsBooleanString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsPhoneNumber,
  IsPositive,
  IsString,
  IsStrongPassword,
  IsUrl,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Column } from 'typeorm';

export abstract class BaseStaff extends BaseEntity {
  @Column('varchar', { length: 15 })
  phone: string;

  @Column('varchar', { length: 256, unique: true })
  email: string;

  @Column('varchar', { length: 256 })
  password: string;

  @Column({ unique: true })
  userId: number;
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  ENVIRONMENT: Environment;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number;

  @IsNumberString()
  VERSION: string;

  @IsString()
  @Equals('api')
  GLOBAL_PREFIX: string;

  @IsUrl({ protocols: ['postgresql'] })
  DATABASE_URL: string;

  @IsInt()
  @IsPositive()
  ROUNDS: number;

  @IsAlphanumeric()
  ACCESS_TOKEN_SECRET: string;

  @IsInt()
  @IsPositive()
  ACCESS_TOKEN_EXPIRATION_TIME: number;

  @IsString()
  @IsIn(['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512'])
  HASHING_ALGORITHM: string;

  @IsString()
  @IsNotEmpty()
  ISSUER: string;

  @IsString()
  @IsNotEmpty()
  AUDIENCE: string;

  @IsAlphanumeric()
  COOKIES_SECRET: string;

  @IsInt()
  @IsPositive()
  COOKIES_EXPIRATION_TIME: number;

  @ValidateIf(
    (environmentVariables: EnvironmentVariables) =>
      environmentVariables.ENVIRONMENT === Environment.PRODUCTION,
  )
  @IsString()
  @IsNotEmpty()
  @Contains(',')
  METHODS: string;

  @ValidateIf(
    (environmentVariables: EnvironmentVariables) =>
      environmentVariables.ENVIRONMENT === Environment.PRODUCTION,
  )
  @IsString()
  @IsNotEmpty()
  @Contains(',')
  ALLOWED_HEADERS: string;

  @ValidateIf(
    (environmentVariables: EnvironmentVariables) =>
      environmentVariables.ENVIRONMENT === Environment.PRODUCTION,
  )
  @IsBooleanString()
  CREDENTIALS: string;
}

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
  language: Language;

  @ApiProperty({
    description: 'User national ID',
    example: '30202041234567',
  })
  @IsString()
  @IsNotEmpty()
  @Length(14, 14)
  @Matches(/^[23]\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{7}$/)
  socialSecurityNumber: string;
}

export abstract class BaseStaffDto extends CreateUserDto {
  @ApiProperty({
    description: 'User email',
    example: 'John@gmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User mobile phone number',
    example: '+201015411320',
  })
  @IsPhoneNumber('EG')
  phone: string;

  @ApiProperty({
    description: 'User password',
    example: 'StrongPassword123!',
    minLength: 8,
  })
  @IsStrongPassword()
  password: string;
}
