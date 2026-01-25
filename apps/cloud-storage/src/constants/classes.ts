import { Environment } from '@app/common';
import {
  Equals,
  IsAlphanumeric,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsString,
  IsUrl,
} from 'class-validator';

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
  @Equals('cloud-storage')
  RABBIT_MQ_CLOUD_STORAGE_QUEUE: string;

  @IsString()
  @IsNotEmpty()
  CLOUDINARY_CLOUD_NAME: string;

  @IsNumberString()
  CLOUDINARY_API_KEY: string;

  @IsAlphanumeric()
  CLOUDINARY_API_SECRET: string;
}
