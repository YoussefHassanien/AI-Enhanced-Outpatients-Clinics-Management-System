import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AsyncMicroserviceOptions, Transport } from '@nestjs/microservices';
import { AuthModule } from './auth.module';

const bootstrap = async () => {
  const logger = new Logger(AuthModule.name);

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
      logger: ['debug'],
      inject: [ConfigService],
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  await app.listen();

  logger.log(
    `Auth microservice listening on queue '${process.env.RABBIT_MQ_AUTH_QUEUE}' via ${process.env.RABBIT_MQ_URL}`,
  );
};

bootstrap().catch((error) => {
  const logger = new Logger(AuthModule.name);
  logger.error(
    'Auth microservice failed to start',
    error instanceof Error ? error.stack : String(error),
  );
});
