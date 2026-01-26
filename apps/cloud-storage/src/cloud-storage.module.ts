import {
  CommonServices,
  LoggingService,
  validateEnviornmentVariables,
} from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CloudStorageController } from './cloud-storage.controller';
import { CloudStorageService } from './cloud-storage.service';
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
      envFilePath: './apps/cloud-storage/.env',
    }),
  ],
  controllers: [CloudStorageController],
  providers: [
    CloudStorageService,
    {
      provide: CommonServices.LOGGING,
      useFactory: (configService: ConfigService) => {
        return new LoggingService(configService, 'cloud-storage');
      },
      inject: [ConfigService],
    },
  ],
})
export class CloudStorageModule {}
