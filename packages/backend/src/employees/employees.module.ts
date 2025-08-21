//src/employees/employees.module.ts

import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { ExternalApiService } from './external-api.service';
import { EmployeeMapper } from './employee.mapper';

@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService, ExternalApiService, EmployeeMapper],
})
export class EmployeesModule {}
