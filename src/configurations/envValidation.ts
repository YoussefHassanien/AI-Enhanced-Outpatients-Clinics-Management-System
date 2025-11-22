import { plainToInstance } from 'class-transformer';
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
  validateSync,
} from 'class-validator';
import { Environment } from '../constants/enums';

class EnvironmentVariables {
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

  @IsAlphanumeric()
  REFRESH_TOKEN_SECRET: string;

  @IsString()
  @IsNotEmpty()
  ACCESS_TOKEN_EXPIRATION_TIME: string;

  @IsString()
  @IsNotEmpty()
  REFRESH_TOKEN_EXPIRATION_TIME: string;

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

  @IsInt()
  @IsPositive()
  EGYPT_TIME: number;

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

export const validate = (config: Record<string, unknown>) => {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
};
