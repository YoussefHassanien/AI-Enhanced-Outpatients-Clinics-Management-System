import {
  CommonServices,
  dataSourceAsyncOptions,
  LoggingService,
  Microservices,
  validateEnviornmentVariables,
} from '@app/common';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { EnvironmentVariables } from './constants';
import { Clinic } from './entities';

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
      envFilePath: './apps/super-admin/.env',
    }),
    TypeOrmModule.forRootAsync(dataSourceAsyncOptions),
    TypeOrmModule.forFeature([Clinic]),
    ClientsModule.registerAsync([
      {
        name: Microservices.AUTH,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBIT_MQ_URL')],
            queue: configService.getOrThrow<string>('RABBIT_MQ_AUTH_QUEUE'),
            queueOptions: {
              durable: true,
            },
            persistent: true,
            maxConnectionAttempts: 5,
          },
        }),
        inject: [ConfigService],
      },
      {
        name: Microservices.DOCTOR,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBIT_MQ_URL')],
            queue: configService.getOrThrow<string>('RABBIT_MQ_DOCTOR_QUEUE'),
            queueOptions: {
              durable: true,
            },
            persistent: true,
            maxConnectionAttempts: 5,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [SuperAdminController],
  providers: [
    SuperAdminService,
    {
      provide: CommonServices.LOGGING,
      useFactory: (configService: ConfigService) => {
        return new LoggingService(configService, 'super-admin');
      },
      inject: [ConfigService],
    },
  ],
  exports: [CommonServices.LOGGING],
})
export class SuperAdminModule {
  private readonly logger = new Logger(SuperAdminModule.name);
  constructor(private readonly dataSource: DataSource) {
    const connectionStatus: string = this.dataSource.isInitialized
      ? 'succeeded'
      : 'failed';
    this.logger.log(`Database connection ${connectionStatus}`);
  }
}
