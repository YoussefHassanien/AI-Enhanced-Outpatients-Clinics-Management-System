import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { createLogger, format, Logger, transports } from 'winston';
import { Environment } from '../constants/enums';

export function LoggingMiddleware(config: ConfigService, serviceName: string) {
  const environment = config.get<Environment>('ENVIRONMENT');

  const date = new Date().toISOString().split('T')[0];
  const logDir = `logs/${serviceName}`;

  // Create logger ONCE, not on every request
  const logger: Logger = createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp({
        format: () => {
          return new Date().toLocaleString('en-US', {
            timeZone: 'Africa/Cairo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          });
        },
      }),
      format.label({ label: serviceName }),
      format.printf(
        ({
          timestamp,
          label,
          level,
          message,
        }: {
          timestamp: string;
          label: string;
          level: string;
          message: string;
        }) => {
          return `${timestamp} [${label}] ${level.toUpperCase()}: ${message}`;
        },
      ),
    ),
    transports: [
      new transports.File({
        filename: `${logDir}/${date}-error.log`,
        level: 'error',
      }),
      new transports.File({ filename: `${logDir}/${date}.log` }),
    ],
  });

  if (environment !== Environment.PRODUCTION) {
    logger.add(
      new transports.Console({
        format: format.combine(format.colorize(), format.simple()),
      }),
    );
  }

  // Return the actual middleware function
  return (req: Request, res: Response, next: NextFunction) => {
    const { method } = req;
    const url = req.originalUrl || req.url;
    const startTime = Date.now();

    res.on('finish', () => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const { statusCode } = res;

      const logMessage = `${method} ${url} - ${statusCode} - ${responseTime}ms`;

      if (statusCode >= 500) {
        logger.error(logMessage);
      } else if (statusCode >= 400) {
        logger.warn(logMessage);
      } else {
        logger.info(logMessage);
      }
    });

    next();
  };
}
