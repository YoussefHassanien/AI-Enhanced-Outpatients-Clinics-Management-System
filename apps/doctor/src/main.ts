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
import { DoctorModule } from './doctor.module';

async function bootstrap() {
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
  app.useGlobalInterceptors(LoggingInterceptor(configService, 'doctor'));
  app.useLogger(logger);

  await app.listen();

  logger.log(
    `Doctor microservice listening on queue '${configService.getOrThrow<string>('RABBIT_MQ_DOCTOR_QUEUE')}' via ${configService.getOrThrow<string>('RABBIT_MQ_URL')}`,
  );
}

bootstrap().catch((error) => {
  const logger = new Logger('Doctor');
  logger.error(
    'Doctor microservice failed to start',
    error instanceof Error ? error.stack : String(error),
  );
});
