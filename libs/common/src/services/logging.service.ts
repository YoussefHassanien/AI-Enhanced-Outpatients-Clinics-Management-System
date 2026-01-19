import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createLogger, format, Logger, transports } from 'winston';
import { Environment } from '../constants/enums';

@Injectable()
export class LoggingService implements LoggerService {
  private readonly logger: Logger;

  constructor(configService: ConfigService, serviceName: string) {
    const environment = configService.get<Environment>('ENVIRONMENT');

    const date = new Date().toISOString().split('T')[0];
    const logDir = `logs/${serviceName}`;

    this.logger = createLogger({
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

    // Log to console in non-production
    if (environment !== Environment.PRODUCTION) {
      this.logger.add(
        new transports.Console({
          format: format.combine(format.colorize(), format.simple()),
        }),
      );
    }
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { context, trace });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
