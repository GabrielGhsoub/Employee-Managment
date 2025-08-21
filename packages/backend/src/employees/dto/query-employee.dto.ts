// src/employees/dto/query-employee.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryEmployeeDto {
  @ApiPropertyOptional({
    description: 'Filter by department name (e.g., Engineering)',
    example: 'Engineering',
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
    description: 'Filter by job title (e.g., Software Engineer)',
    example: 'Software Engineer',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Filter by location (e.g., Austin)',
    example: 'Austin',
  })
  @IsOptional()
  @IsString()
  location?: string;
}
