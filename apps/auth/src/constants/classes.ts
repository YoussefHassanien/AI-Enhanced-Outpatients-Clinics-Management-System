import { Environment } from '@app/common';
import {
  IsAlphanumeric,
  IsEnum,
  IsIn,
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

  @IsString()
  @IsNotEmpty()
  RABBIT_MQ_URL: string;

  @IsString()
  @IsNotEmpty()
  RABBIT_MQ_AUTH_QUEUE: string;
}
