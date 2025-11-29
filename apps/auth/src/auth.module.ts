import {
  BaseModule,
  dataSourceAsyncOptions,
  validateEnviornmentVariables,
} from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EnvironmentVariables } from './constants/classes';
import { Admin, Doctor, Patient, User } from './entities';
import { JwtStrategy, LocalStrategy } from './strategies';

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
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
})
export class AuthModule extends BaseModule {
  constructor() {
    super(AuthModule.name);
  }
}
