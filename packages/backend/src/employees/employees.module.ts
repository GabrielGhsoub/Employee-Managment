// src/employees/employees.module.ts

import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { ExternalApiService } from './external-api.service';
import { EmployeeMapper } from './employee.mapper';
import { Employee } from './entities/employee.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee]),
    CacheModule.register({
      ttl: 60, 
    }),
    ConfigModule,
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService, ExternalApiService, EmployeeMapper],
})
export class EmployeesModule {}