// src/employees/employees.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Employee } from './entities/employee.entity';

@ApiTags('employees')
@Controller('employees')
@ApiBearerAuth()
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new employee record',
    description: 'Adds a new employee to the directory.',
  })
  @ApiBody({
    type: CreateEmployeeDto,
    description: 'The employee data to create.',
  })
  @ApiResponse({
    status: 201,
    description: 'The employee has been successfully created.',
    type: Employee,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({
    status: 409,
    description: 'Employee with that email already exists.',
  })
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Retrieve a paginated list of employees',
    description:
      'Gets a list of employees with optional filters for department, title, and location, and supports pagination.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'The page number.' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'The number of items per page.',
  })
  @ApiResponse({
    status: 200,
    description: 'A paginated list of employees.',
  })
  async find(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query() query: QueryEmployeeDto,
  ) {
    const employees = await this.employeesService.find(query);

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

  @Get(':id')
  @ApiOperation({
    summary: 'Get an employee by ID',
    description: 'Retrieves a single employee record by their unique ID.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'The UUID of the employee.',
  })
  @ApiResponse({
    status: 200,
    description: 'The employee record.',
    type: Employee,
  })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an employee by ID',
    description: 'Updates an existing employee record.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'The UUID of the employee to update.',
  })
  @ApiBody({
    type: UpdateEmployeeDto,
    description: 'The employee data to update.',
  })
  @ApiResponse({
    status: 200,
    description: 'The employee has been successfully updated.',
    type: Employee,
  })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete an employee by ID',
    description: 'Permanently removes an employee record from the directory.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'The UUID of the employee to delete.',
  })
  @ApiResponse({
    status: 204,
    description: 'The employee has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeesService.remove(id);
  }
}
