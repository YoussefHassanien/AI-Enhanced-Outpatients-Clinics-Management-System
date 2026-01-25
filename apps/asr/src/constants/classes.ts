import { Environment } from '@app/common';
import { Equals, IsEnum, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class EnvironmentVariables {
  @IsEnum(Environment)
  ENVIRONMENT: Environment;

  @IsUrl({ protocols: ['https'] })
  API_URL: string;

  @IsUrl({ protocols: ['https'] })
  HF_API_URL: string;

  @IsUrl({
    protocols: ['amqp'],
    require_host: true,
    require_port: true,
    require_tld: false,
  })
  RABBIT_MQ_URL: string;

  @IsString()
  @Equals('asr')
  RABBIT_MQ_ASR_QUEUE: string;

  @IsString()
  @IsNotEmpty()
  ASR_TMP_DIR: string;
}
