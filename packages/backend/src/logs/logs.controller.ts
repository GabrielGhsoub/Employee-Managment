import { Controller, Post, Body } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

interface FrontendLogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
  stack?: string;
  url?: string;
  userAgent?: string;
  component?: string;
}

interface LogsPayload {
  logs: FrontendLogEntry[];
}

@Controller('logs')
export class LogsController {
  constructor(private readonly logger: Logger) {}

  @Post()
  async receiveFrontendLogs(@Body() payload: LogsPayload) {
    try {
      const { logs } = payload;

      for (const log of logs) {
        const logData = {
          frontend: true,
          timestamp: log.timestamp,
          url: log.url,
          userAgent: log.userAgent,
          component: log.component,
          stack: log.stack,
          data: log.data,
        };

        // Log with appropriate level
        switch (log.level) {
          case 'error':
            this.logger.error(logData, `Frontend Error: ${log.message}`);
            break;
          case 'warn':
            this.logger.warn(logData, `Frontend Warning: ${log.message}`);
            break;
          case 'info':
            this.logger.log(logData, `Frontend Info: ${log.message}`);
            break;
          case 'debug':
            this.logger.debug(logData, `Frontend Debug: ${log.message}`);
            break;
          default:
            this.logger.log(logData, `Frontend: ${log.message}`);
        }
      }

      return { success: true, received: logs.length };
    } catch (error) {
      this.logger.error({ error }, 'Failed to process frontend logs');
      throw error;
    }
  }
}