import { Environment } from '@app/common';
import { ConsoleLogger, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AsyncMicroserviceOptions, Transport } from '@nestjs/microservices';
import { DoctorModule } from './doctor.module';
const bootstrap = async () => {
  const logger = new Logger('Doctor microservice');

  const app = await NestFactory.createMicroservice<AsyncMicroserviceOptions>(
    DoctorModule,
    {
      useFactory: (configService: ConfigService) => ({
        transport: Transport.RMQ,
        options: {
          urls: [configService.getOrThrow<string>('RABBIT_MQ_URL')],
          queue: configService.getOrThrow<string>('RABBIT_MQ_DOCTOR_QUEUE'),
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

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  await app.listen();

  logger.log(
    `Doctor microservice listening on queue '${process.env.RABBIT_MQ_DOCTOR_QUEUE}' via ${process.env.RABBIT_MQ_URL}`,
  );
};

bootstrap().catch((error) => {
  const logger = new Logger('Doctor microservice');
  logger.error(
    'Doctor microservice failed to start',
    error instanceof Error ? error.stack : String(error),
  );
});
