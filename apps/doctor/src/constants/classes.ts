import { Environment } from '@app/common';
import { IsEnum, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class EnvironmentVariables {
  @IsEnum(Environment)
  ENVIRONMENT: Environment;

  @IsUrl({ protocols: ['postgresql'] })
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  RABBIT_MQ_URL: string;

  @IsString()
  @IsNotEmpty()
  RABBIT_MQ_DOCTOR_QUEUE: string;
}
