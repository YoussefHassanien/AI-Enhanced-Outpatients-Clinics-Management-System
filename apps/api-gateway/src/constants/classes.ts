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
  IsUrl,
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

  @IsUrl({
    protocols: ['amqp'],
    require_host: true,
    require_port: true,
    require_tld: false,
  })
  RABBIT_MQ_URL: string;

  @IsString()
  @Equals('auth')
  RABBIT_MQ_AUTH_QUEUE: string;

  @IsString()
  @Equals('doctor')
  RABBIT_MQ_DOCTOR_QUEUE: string;

  @IsString()
  @Equals('admin')
  RABBIT_MQ_ADMIN_QUEUE: string;

  @IsString()
  @Equals('ocr')
  RABBIT_MQ_OCR_QUEUE: string;

  @IsString()
  @Equals('asr')
  RABBIT_MQ_ASR_QUEUE: string;

  @IsString()
  @IsNotEmpty()
  ASR_TMP_DIR: string;

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
