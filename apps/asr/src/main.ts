import {
  CommonServices,
  ErrorResponse,
  LoggingInterceptor,
  LoggingService,
} from '@app/common';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  AsyncMicroserviceOptions,
  RpcException,
  Transport,
} from '@nestjs/microservices';
import { AsrModule } from './asr.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<AsyncMicroserviceOptions>(
    AsrModule,
    {
      useFactory: (configService: ConfigService) => ({
        transport: Transport.RMQ,
        options: {
          urls: [configService.getOrThrow<string>('RABBIT_MQ_URL')],
          queue: configService.getOrThrow<string>('RABBIT_MQ_ASR_QUEUE'),
          queueOptions: {
            durable: true,
          },
          persistent: true,
          maxConnectionAttempts: 5,
        },
      }),
      inject: [ConfigService],
    },
  );

  const configService = app.get(ConfigService);
  const logger = app.get<LoggingService>(CommonServices.LOGGING);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidUnknownValues: true,
      exceptionFactory: () =>
        new RpcException(new ErrorResponse('Invalid payload', 400)),
    }),
  );
  app.useLogger(logger);
  app.useGlobalInterceptors(LoggingInterceptor(configService, 'asr'));

  await app.listen();

  logger.log(
    `ASR microservice listening on queue '${configService.getOrThrow<string>(
      'RABBIT_MQ_ASR_QUEUE',
    )}' via ${configService.getOrThrow<string>('RABBIT_MQ_URL')}`,
  );
}

bootstrap().catch((error) => {
  const logger = new Logger('ASR');
  logger.error(
    'ASR microservice failed to start',
    error instanceof Error ? error.stack : String(error),
  );
});
