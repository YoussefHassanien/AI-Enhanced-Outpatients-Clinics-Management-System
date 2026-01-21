import {
  CatchEverythingFilter,
  CommonServices,
  LoggingService,
  validateEnviornmentVariables,
} from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { minutes, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { ApiGatewayController } from './api-gateway.controller';
import { AuthModule } from './auth/auth.module';
import { EnvironmentVariables } from './constants';
import { DoctorModule } from './doctor/doctor.module';
import { AsrModule } from './asr/asr.module';

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
    DoctorModule,
    AdminModule,
    AsrModule,
  ],
  controllers: [ApiGatewayController],
  providers: [
    { provide: APP_FILTER, useClass: CatchEverythingFilter },
    {
      provide: CommonServices.LOGGING,
      useFactory: (configService: ConfigService) => {
        return new LoggingService(configService, 'api-gateway');
      },
      inject: [ConfigService],
    },
  ],
})
export class ApiGatewayModule { }
