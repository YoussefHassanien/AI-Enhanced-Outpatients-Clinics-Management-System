import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { tap } from 'rxjs/operators';
import { createLogger, format, Logger, transports } from 'winston';
import { Environment } from '../constants/enums';

export function LoggingInterceptor(
  configService: ConfigService,
  serviceName: string,
): NestInterceptor {
  const environment = configService.get<Environment>('ENVIRONMENT');

  const date = new Date().toISOString().split('T')[0];
  const logDir = `logs/${serviceName}`;

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

  return {
    intercept(context: ExecutionContext, next: CallHandler) {
      if (context.getType() === 'rpc') {
        const handler = context.getHandler().name;
        const className = context.getClass().name;
        const startTime = Date.now();

        return next.handle().pipe(
          tap({
            next: () => {
              const endTime = Date.now();
              const duration = endTime - startTime;
              logger.info(`${className}.${handler} - Success - ${duration}ms`);
            },
            error: (err: Error) => {
              const endTime = Date.now();
              const duration = endTime - startTime;
              logger.error(
                `${className}.${handler} - Error: ${err.message} - ${duration}ms`,
              );
            },
          }),
        );
      }

      return next.handle();
    },
  };
}
