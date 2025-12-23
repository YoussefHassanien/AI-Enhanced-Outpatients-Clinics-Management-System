import { CommonServices, LoggingService, Microservices } from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies';

@Module({
  imports: [
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
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: CommonServices.LOGGING,
      useFactory: (configService: ConfigService) => {
        return new LoggingService(configService, 'api-gateway');
      },
      inject: [ConfigService],
    },
  ],
  exports: [JwtStrategy],
})
export class AuthModule {}
