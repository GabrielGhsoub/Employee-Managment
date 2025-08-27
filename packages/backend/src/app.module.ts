import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesModule } from './employees/employees.module';
import { LogsModule } from './logs/logs.module';
import * as Joi from 'joi';
import { LoggerModule } from 'nestjs-pino';
import { promises as fs } from 'fs';
import path from 'path';
import { Employee } from './employees/entities/employee.entity';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        RANDOM_USER_API_URL: Joi.string().uri().required(),
        RANDOM_USER_API_SEED: Joi.string().required(),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
      }),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const databaseUrl = configService.get('DATABASE_URL', 'employee-directory.sqlite');
        let database = databaseUrl;
        
        // Handle file: URLs
        if (databaseUrl.startsWith('file:')) {
          database = databaseUrl.replace('file:', '');
          
          // Ensure directory exists
          const dir = path.dirname(database);
          if (dir && dir !== '.') {
            await fs.mkdir(dir, { recursive: true });
          }
        }
        
        return {
          type: 'better-sqlite3',
          database,
          entities: [Employee],
          synchronize: true,
        };
      },
    }),

    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';
        const logDir = 'logs';
        const logFile = path.join(logDir, 'app.log');

        // Always create log directory for comprehensive logging
        try {
          await fs.mkdir(logDir, { recursive: true });
        } catch (e) {
          console.error('Could not create log directory', e);
        }

        return {
          pinoHttp: {
            // Always use debug level to capture everything including dev logs
            level: 'debug',
            transport: isProduction
              ? {
                  target: 'pino/file',
                  options: { 
                    destination: logFile,
                  },
                }
              : {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    colorize: true,
                    translateTime: 'SYS:standard',
                  },
                },
            // Enhanced serializers for better error logging
            serializers: {
              req: (req: any) => ({
                method: req.method,
                url: req.url,
                headers: req.headers,
                remoteAddress: req.remoteAddress,
                remotePort: req.remotePort,
              }),
              res: (res: any) => ({
                statusCode: res.statusCode,
                headers: res.getHeaders?.() || res.headers,
              }),
              err: (err: any) => ({
                type: err.constructor?.name || 'Error',
                message: err.message,
                stack: err.stack,
                ...err,
              }),
            },
          },
        };
      },
    }),
    EmployeesModule,
    LogsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
