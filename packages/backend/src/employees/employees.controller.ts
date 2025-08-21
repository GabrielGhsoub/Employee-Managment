// src/employees/employees.controller.ts

import { Controller, Get, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { QueryEmployeeDto } from './dto/query-employee.dto';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  async find(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query() query: QueryEmployeeDto,
  ) {
    const employees = await this.employeesService.find(
      query.department,
      query.title,
      query.location,
    );

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedData = employees.slice(startIndex, endIndex);

    return {
      totalItems: employees.length,
      data: paginatedData,
      currentPage: page,
      totalPages: Math.ceil(employees.length / limit),
    };
  }
}
