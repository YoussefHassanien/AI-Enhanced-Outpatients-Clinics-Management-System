import { Environment } from '@app/common';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  IsUrl,
} from 'class-validator';

export class EnvironmentVariables {
  @IsEnum(Environment)
  ENVIRONMENT: Environment;

  @IsUrl({ protocols: ['postgresql'] })
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  RABBIT_MQ_URL: string;

  @IsInt()
  @IsPositive()
  RABBIT_MQ_TIMEOUT: number;

  @IsString()
  @IsNotEmpty()
  RABBIT_MQ_DOCTOR_QUEUE: string;

  @IsString()
  @IsNotEmpty()
  RABBIT_MQ_AUTH_QUEUE: string;
}
