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
import { AdminModule } from './admin.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<AsyncMicroserviceOptions>(
    AdminModule,
    {
      useFactory: (configService: ConfigService) => ({
        transport: Transport.RMQ,
        options: {
          urls: [configService.getOrThrow<string>('RABBIT_MQ_URL')],
          queue: configService.getOrThrow<string>('RABBIT_MQ_ADMIN_QUEUE'),
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
  app.useGlobalInterceptors(LoggingInterceptor(configService, 'admin'));
  app.useLogger(logger);

  await app.listen();

  logger.log(
    `Admin microservice listening on queue '${configService.getOrThrow<string>('RABBIT_MQ_ADMIN_QUEUE')}' via ${configService.getOrThrow<string>('RABBIT_MQ_URL')}`,
  );
}

bootstrap().catch((error) => {
  const logger = new Logger('Admin');
  logger.error(
    'Admin microservice failed to start',
    error instanceof Error ? error.stack : String(error),
  );
});
