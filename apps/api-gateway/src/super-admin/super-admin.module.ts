import { Microservices } from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: Microservices.SUPER_ADMIN,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBIT_MQ_URL')],
            queue: configService.getOrThrow<string>(
              'RABBIT_MQ_SUPER_ADMIN_QUEUE',
            ),
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
  providers: [SuperAdminService],
})
export class SuperAdminModule {}
