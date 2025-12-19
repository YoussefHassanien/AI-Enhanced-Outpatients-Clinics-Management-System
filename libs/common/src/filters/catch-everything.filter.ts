import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ErrorResponse } from '../constants';

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
  private readonly logger: Logger;

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {
    this.logger = new Logger('Exception Filter');
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    let status = 500;
    let message = 'Internal Server Error!';

    if (this.isRpcError(exception)) {
      status = exception.status;
      message = exception.message;
      this.logger.error('Rpc Exception');
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
      this.logger.error('Http Exception');
    } else {
      this.logger.error('Unknown Exception', exception);
    }

    httpAdapter.reply(ctx.getResponse(), message, status);
  }

  private isRpcError(exception: unknown): exception is ErrorResponse {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'status' in exception &&
      'message' in exception &&
      typeof (exception as Record<string, unknown>).status === 'number' &&
      typeof (exception as Record<string, unknown>).message === 'string'
    );
  }
}
