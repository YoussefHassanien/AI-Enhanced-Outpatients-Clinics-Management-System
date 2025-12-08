import {
  CatchEverythingFilter,
  LoggerMiddleware,
  validateEnviornmentVariables,
} from '@app/common';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { minutes, ThrottlerModule } from '@nestjs/throttler';
import { ApiGatewayController } from './api-gateway.controller';
import { AuthModule } from './auth/auth.module';
import { EnvironmentVariables } from './constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) =>
        validateEnviornmentVariables(EnvironmentVariables, config),
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
      envFilePath: './apps/api-gateway/.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: minutes(2),
        limit: 40,
        blockDuration: minutes(1),
      },
    ]),
    AuthModule,
  ],
  controllers: [ApiGatewayController],
  providers: [{ provide: APP_FILTER, useClass: CatchEverythingFilter }],
})
export class ApiGatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*path');
  }
}
