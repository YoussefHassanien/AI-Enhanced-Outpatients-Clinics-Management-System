import { Environment } from '@app/common';
import { Equals, IsEnum, IsString, IsUrl } from 'class-validator';

export class EnvironmentVariables {
  @IsEnum(Environment)
  ENVIRONMENT: Environment;

  @IsUrl({
    protocols: ['amqp'],
    require_host: true,
    require_port: true,
    require_tld: false,
  })
  RABBIT_MQ_URL: string;

  @IsString()
  @Equals('doctor')
  RABBIT_MQ_DOCTOR_QUEUE: string;

  @IsString()
  @Equals('auth')
  RABBIT_MQ_AUTH_QUEUE: string;

  @IsString()
  @Equals('admin')
  RABBIT_MQ_ADMIN_QUEUE: string;

  @IsString()
  @Equals('super-admin')
  RABBIT_MQ_SUPER_ADMIN_QUEUE: string;
}
