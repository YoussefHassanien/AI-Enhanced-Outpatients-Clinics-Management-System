import { Environment, Role } from '@app/common';
import {
  Equals,
  IsAlphanumeric,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Matches,
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
  @Equals('admin')
  RABBIT_MQ_ADMIN_QUEUE: string;
}

export class JwtPayload {
  @IsInt()
  @IsPositive()
  sub: number;

  @IsUUID()
  globalId: string;

  @IsString()
  @Length(14, 14)
  @Matches(/^[23]\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{7}$/)
  socialSecurityNumber: string;

  @IsEnum(Role)
  role: Role;
}
