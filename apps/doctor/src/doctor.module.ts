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
import { EnvironmentVariables } from './constants';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { Lab, Medication, Scan, Visit } from './entities';

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
      envFilePath: './apps/doctor/.env',
    }),
    TypeOrmModule.forRootAsync(dataSourceAsyncOptions),
    TypeOrmModule.forFeature([Scan, Lab, Medication, Visit]),
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
        name: Microservices.ADMIN,
        imports: [ConfigModule],
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
    ]),
  ],
  controllers: [DoctorController],
  providers: [
    DoctorService,
    {
      provide: CommonServices.LOGGING,
      useFactory: (configService: ConfigService) => {
        return new LoggingService(configService, 'doctor');
      },
      inject: [ConfigService],
    },
  ],
  exports: [CommonServices.LOGGING],
})
export class DoctorModule {
  private readonly logger = new Logger(DoctorModule.name);
  constructor(private readonly dataSource: DataSource) {
    const connectionStatus: string = this.dataSource.isInitialized
      ? 'succeeded'
      : 'failed';
    this.logger.log(`Database connection ${connectionStatus}`);
  }
}
