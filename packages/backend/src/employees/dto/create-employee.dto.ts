// src/employees/dto/create-employee.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsOptional, IsUrl, MinLength, ValidateIf } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ description: 'First name of the employee', example: 'John' })
  @IsNotEmpty()
  @IsString()
  @MinLength(1, { message: 'First name cannot be empty' })
  firstName!: string;

  @ApiProperty({ description: 'Last name of the employee', example: 'Doe' })
  @IsNotEmpty()
  @IsString()
  @MinLength(1, { message: 'Last name cannot be empty' })
  lastName!: string;

  @ApiProperty({ description: 'Email address of the employee', example: 'john.doe@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ description: 'Phone number of the employee', example: '123-456-7890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'URL to the employee\'s picture', example: 'https://randomuser.me/api/portraits/men/1.jpg' })
  @IsOptional()
  @ValidateIf((object, value) => value !== '' && value != null)
  @IsUrl()
  pictureUrl?: string;

  @ApiProperty({ description: 'Job title of the employee', example: 'Software Engineer' })
  @IsNotEmpty()
  @IsString()
  @MinLength(1, { message: 'Job title cannot be empty' })
  jobTitle!: string;

  @ApiProperty({ description: 'Department of the employee', example: 'Engineering' })
  @IsNotEmpty()
  @IsString()
  @MinLength(1, { message: 'Department cannot be empty' })
  department!: string;

  @ApiProperty({ description: 'Location of the employee', example: 'Austin, TX' })
  @IsNotEmpty()
  @IsString()
  @MinLength(1, { message: 'Location cannot be empty' })
  location!: string;
}