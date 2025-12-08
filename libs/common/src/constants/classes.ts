import { Inject, Logger, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LoggerMiddleware } from '../middlewares';

export abstract class BaseModule implements NestModule {
  @Inject(DataSource)
  private readonly dataSource: DataSource;

  protected constructor(private readonly moduleName: string) {}

  onModuleInit() {
    const logger = new Logger(this.moduleName);
    const connectionStatus: string = this.dataSource.isInitialized
      ? 'succeeded'
      : 'failed';
    logger.log(`Database connection ${connectionStatus}`);
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*path');
  }
}

export class ErrorResponse {
  public message: string;
  public status: number;

  constructor(message: string, status: number) {
    this.message = message;
    this.status = status;
  }
}
