// src/app.module.ts

import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmployeesModule } from './employees/employees.module';
import * as Joi from 'joi';
import { LoggerModule } from 'nestjs-pino';
import { promises as fs } from 'fs';
import path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        RANDOM_USER_API_URL: Joi.string().uri().required(),
        RANDOM_USER_API_SEED: Joi.string().required(),
        CACHE_TTL_SECONDS: Joi.number().default(300),
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
      }),
    }),

    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        const logDir = 'logs';
        const logFile = path.join(logDir, 'app.log');

        if (isProduction) {
          try {
            await fs.mkdir(logDir, { recursive: true });
          } catch (e) {
            console.error('Could not create log directory', e);
          }
        }

        return {
          pinoHttp: {
            level: isProduction ? 'info' : 'debug',

            transport: isProduction
              ? {
                  // In production, log to a file.
                  target: 'pino/file',
                  options: { destination: logFile },
                }
              : {
                  // In development, using pino-pretty for readable logs.
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    colorize: true,
                  },
                },
          },
        };
      },
    }),

    CacheModule.register({
      isGlobal: true,
    }),
    EmployeesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
