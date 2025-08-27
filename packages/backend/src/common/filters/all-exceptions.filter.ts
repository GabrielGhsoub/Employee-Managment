// src/common/filters/all-exceptions.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(Logger) private readonly logger: Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const path = httpAdapter.getRequestUrl(request);
    const method = request.method;
    const userAgent = request.headers['user-agent'];
    const ip = request.ip || request.connection.remoteAddress;

    // Detailed error logging
    const errorDetails = {
      timestamp: new Date().toISOString(),
      method,
      path,
      statusCode: httpStatus,
      userAgent,
      ip,
      headers: request.headers,
      query: request.query,
      body: request.body,
      params: request.params,
      error: {
        name: exception instanceof Error ? exception.constructor.name : 'Unknown',
        message: exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
        cause: exception instanceof Error ? (exception as any).cause : undefined,
      },
    };

    // Log with appropriate level based on status
    if (httpStatus >= 500) {
      this.logger.error(errorDetails, 'Internal Server Error');
    } else if (httpStatus >= 400) {
      this.logger.warn(errorDetails, 'Client Error');
    } else {
      this.logger.log(errorDetails, 'Exception Handled');
    }

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path,
      message: exception instanceof HttpException ? exception.getResponse() : 'Internal server error',
    };

    httpAdapter.reply(response, responseBody, httpStatus);
  }
}