// src/employees/dto/create-employee.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ description: 'First name of the employee', example: 'John' })
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @ApiProperty({ description: 'Last name of the employee', example: 'Doe' })
  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @ApiProperty({ description: 'Email address of the employee', example: 'john.doe@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Phone number of the employee', example: '123-456-7890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'URL to the employee\'s picture', example: 'https://randomuser.me/api/portraits/men/1.jpg' })
  @IsOptional()
  @IsUrl()
  pictureUrl?: string;

  @ApiProperty({ description: 'Job title of the employee', example: 'Software Engineer' })
  @IsNotEmpty()
  @IsString()
  jobTitle!: string;

  @ApiProperty({ description: 'Department of the employee', example: 'Engineering' })
  @IsNotEmpty()
  @IsString()
  department!: string;

  @ApiProperty({ description: 'Location of the employee', example: 'Austin, TX' })
  @IsNotEmpty()
  @IsString()
  location!: string;
}