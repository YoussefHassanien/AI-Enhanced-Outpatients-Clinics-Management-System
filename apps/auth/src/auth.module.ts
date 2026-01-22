import {
  CommonServices,
  dataSourceAsyncOptions,
  LoggingService,
  Microservices,
  validateEnviornmentVariables,
} from '@app/common';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EnvironmentVariables } from './constants';
import { Admin, Doctor, Patient, User } from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (config) =>
        validateEnviornmentVariables(EnvironmentVariables, config),
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
      envFilePath: './apps/auth/.env',
    }),
    TypeOrmModule.forRootAsync(dataSourceAsyncOptions),
    TypeOrmModule.forFeature([User, Patient, Doctor, Admin]),
    JwtModule.register({ global: true }),
    ClientsModule.registerAsync([
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
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: CommonServices.LOGGING,
      useFactory: (configService: ConfigService) => {
        return new LoggingService(configService, 'auth');
      },
      inject: [ConfigService],
    },
  ],
  exports: [CommonServices.LOGGING],
})
export class AuthModule {
  private readonly logger = new Logger(AuthModule.name);
  constructor(private readonly dataSource: DataSource) {
    const connectionStatus: string = this.dataSource.isInitialized
      ? 'succeeded'
      : 'failed';
    this.logger.log(`Database connection ${connectionStatus}`);
  }
}
