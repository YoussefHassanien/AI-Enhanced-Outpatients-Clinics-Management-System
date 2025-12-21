import { Environment, ErrorResponse } from '@app/common';
import { ConsoleLogger, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  AsyncMicroserviceOptions,
  RpcException,
  Transport,
} from '@nestjs/microservices';
import { AuthModule } from './auth.module';
const bootstrap = async () => {
  const logger = new Logger('Auth microservice');

  const app = await NestFactory.createMicroservice<AsyncMicroserviceOptions>(
    AuthModule,
    {
      useFactory: (configService: ConfigService) => ({
        transport: Transport.RMQ,
        options: {
          urls: [configService.getOrThrow<string>('RABBIT_MQ_URL')],
          queue: configService.getOrThrow<string>('RABBIT_MQ_AUTH_QUEUE'),
          queueOptions: {
            durable: false,
          },
        },
      }),
      logger: new ConsoleLogger({
        logLevels:
          process.env.ENVIRONMENT === Environment.PRODUCTION
            ? ['error', 'fatal', 'warn']
            : ['log', 'fatal', 'error', 'warn', 'debug', 'verbose'],
        timestamp: true,
      }),

      inject: [ConfigService],
    },
  );

  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidUnknownValues: true,
      exceptionFactory: () =>
        new RpcException(new ErrorResponse('Invalid payload', 400)),
    }),
  );

  await app.listen();

  logger.log(
    `Auth microservice listening on queue '${configService.getOrThrow<string>('RABBIT_MQ_AUTH_QUEUE')}' via ${configService.getOrThrow<string>('RABBIT_MQ_URL')}`,
  );
};

bootstrap().catch((error) => {
  const logger = new Logger('Auth microservice');
  logger.error(
    'Auth microservice failed to start',
    error instanceof Error ? error.stack : String(error),
  );
});
