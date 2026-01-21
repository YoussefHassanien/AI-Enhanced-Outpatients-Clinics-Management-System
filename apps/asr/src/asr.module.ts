import { CommonServices, LoggingService } from '@app/common';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AsrController } from './asr.controller';
import { AsrService } from './asr.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/asr/.env',
    }),
    HttpModule,
  ],
  controllers: [AsrController],
  providers: [
    AsrService,
    {
      provide: CommonServices.LOGGING,
      useFactory: (configService: ConfigService) => {
        return new LoggingService(configService, 'asr');
      },
      inject: [ConfigService],
    },
  ],
})
export class AsrModule { }
