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
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
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
      envFilePath: './apps/admin/.env',
    }),
    TypeOrmModule.forRootAsync(dataSourceAsyncOptions),
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
  controllers: [AdminController],
  providers: [
    AdminService,
    {
      provide: CommonServices.LOGGING,
      useFactory: (configService: ConfigService) => {
        return new LoggingService(configService, 'admin');
      },
      inject: [ConfigService],
    },
  ],
  exports: [CommonServices.LOGGING],
})
export class AdminModule {
  private readonly logger = new Logger(AdminModule.name);
  constructor(private readonly dataSource: DataSource) {
    const connectionStatus: string = this.dataSource.isInitialized
      ? 'succeeded'
      : 'failed';
    this.logger.log(`Database connection ${connectionStatus}`);
  }
}
