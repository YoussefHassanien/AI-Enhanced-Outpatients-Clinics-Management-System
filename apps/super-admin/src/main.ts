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
import { SuperAdminModule } from './super-admin.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<AsyncMicroserviceOptions>(
    SuperAdminModule,
    {
      useFactory: (configService: ConfigService) => ({
        transport: Transport.RMQ,
        options: {
          urls: [configService.getOrThrow<string>('RABBIT_MQ_URL')],
          queue: configService.getOrThrow<string>(
            'RABBIT_MQ_SUPER_ADMIN_QUEUE',
          ),
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
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = error.constraints
            ? Object.values(error.constraints).join(', ')
            : 'Invalid value';
          return `${error.property}: ${constraints}`;
        });
        return new RpcException(
          new ErrorResponse(`Validation failed: ${messages.join('; ')}`, 400),
        );
      },
    }),
  );
  app.useGlobalInterceptors(LoggingInterceptor(configService, 'super-admin'));
  app.useLogger(logger);

  await app.listen();

  logger.log(
    `Super Admin microservice listening on queue '${configService.getOrThrow<string>('RABBIT_MQ_SUPER_ADMIN_QUEUE')}' via ${configService.getOrThrow<string>('RABBIT_MQ_URL')}`,
  );
}

bootstrap().catch((error) => {
  const logger = new Logger('SuperAdmin');
  logger.error(
    'Super Admin microservice failed to start',
    error instanceof Error ? error.stack : String(error),
  );
});
