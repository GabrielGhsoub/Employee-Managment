// src/employees/employees.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { ExternalApiService } from './external-api.service';
import { EmployeeMapper } from './employee.mapper';
import { Employee } from './entities/employee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee])],
  controllers: [EmployeesController],
  providers: [EmployeesService, ExternalApiService, EmployeeMapper],
})
export class EmployeesModule {}