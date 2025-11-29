import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { Environment } from '../constants/enums';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger: Logger;

  constructor(private readonly configService: ConfigService) {
    if (
      this.configService.get<Environment>('ENVIRONMENT') ===
      Environment.PRODUCTION
    )
      this.logger = new Logger('HTTPS');
    else this.logger = new Logger('HTTP');
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const { method } = req;
    const url = req.originalUrl || req.url;
    const startTime = Date.now();

    // Listen for the response finish event to log completion
    res.on('finish', () => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const { statusCode } = res;

      // Log the response details with full URL
      const logMessage = `${method} ${url} - ${statusCode} - ${responseTime}ms`;

      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }
}
