import {
  dataSourceAsyncOptions,
  validateEnviornmentVariables,
} from '@app/common';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EnvironmentVariables } from './constants';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { Labs, Medications, Scans, Visits } from './entities';

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
    TypeOrmModule.forFeature([Scans, Labs, Medications, Visits]),
  ],
  controllers: [DoctorController],
  providers: [DoctorService],
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
