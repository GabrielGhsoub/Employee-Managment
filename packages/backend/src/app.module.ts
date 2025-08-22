import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesModule } from './employees/employees.module';
import * as Joi from 'joi';
import { LoggerModule } from 'nestjs-pino';
import { promises as fs } from 'fs';
import path from 'path';
import { Employee } from './employees/entities/employee.entity';

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
      useFactory: (configService: ConfigService) => ({
        type: 'better-sqlite3', 
        database: 'employee-directory.sqlite',
        entities: [Employee],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),

    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';
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
                  target: 'pino/file',
                  options: { destination: logFile },
                }
              : {
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
    EmployeesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
