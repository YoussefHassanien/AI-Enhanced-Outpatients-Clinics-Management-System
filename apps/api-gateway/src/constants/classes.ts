import { Environment } from '@app/common';
import {
  Contains,
  Equals,
  IsAlphanumeric,
  IsBooleanString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

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

  @IsAlphanumeric()
  ACCESS_TOKEN_SECRET: string;

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

  @IsString()
  @IsNotEmpty()
  RABBIT_MQ_URL: string;

  @IsString()
  @IsNotEmpty()
  RABBIT_MQ_AUTH_QUEUE: string;

  @IsString()
  @IsNotEmpty()
  RABBIT_MQ_DOCTOR_QUEUE: string;

  @IsString()
  @IsNotEmpty()
  RABBIT_MQ_ADMIN_QUEUE: string;

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
  @IsBooleanString()
  CREDENTIALS: string;
}
