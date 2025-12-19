import {
  dataSourceAsyncOptions,
  validateEnviornmentVariables,
} from '@app/common';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
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
  ],
  controllers: [AuthController],
  providers: [AuthService],
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
