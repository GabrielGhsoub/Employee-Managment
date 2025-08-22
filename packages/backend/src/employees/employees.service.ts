// src/employees/employees.service.ts

import { Injectable, NotFoundException, OnModuleInit, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { ExternalApiService } from './external-api.service';
import { EmployeeMapper } from './employee.mapper';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EmployeesService implements OnModuleInit {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly externalApiService: ExternalApiService,
    private readonly employeeMapper: EmployeeMapper,
    @InjectPinoLogger(EmployeesService.name)
    private readonly logger: PinoLogger,
  ) {}

  async onModuleInit() {
    await this.seedDatabase();
  }

  private async seedDatabase() {
    const count = await this.employeeRepository.count();
    if (count > 0) {
      this.logger.info('Database already seeded. Skipping.');
      return;
    }

    this.logger.info('Database is empty. Seeding with initial data...');
    const rawUsers = await this.externalApiService.fetchRawEmployees();
    const employees = rawUsers.map((user) =>
      this.employeeMapper.toEntity(user),
    );

    await this.employeeRepository.save(employees);
    this.logger.info('Database seeded successfully.');
  }

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    const { email } = createEmployeeDto;
    const existingEmployee = await this.employeeRepository.findOneBy({ email });

    if (existingEmployee) {
      throw new ConflictException(`Employee with email "${email}" already exists.`);
    }
    
    const newEmployee = this.employeeRepository.create({
        ...createEmployeeDto,
        phone: createEmployeeDto.phone ?? '',
        pictureUrl: createEmployeeDto.pictureUrl ?? '', 
        id: uuidv4(),
    });
    return this.employeeRepository.save(newEmployee);
  }

  async find(query: QueryEmployeeDto): Promise<Employee[]> {
    this.logger.debug({ query }, 'Finding employees with filters');

    const { department, title, location, search, sortBy, sortOrder } = query;
    const where: FindOptionsWhere<Employee> | FindOptionsWhere<Employee>[] = [];

    const baseConditions: FindOptionsWhere<Employee> = {};
    if (department) baseConditions.department = department;
    if (title) baseConditions.jobTitle = title;
    if (location) baseConditions.location = ILike(`%${location}%`);

    if (search) {
      where.push({ ...baseConditions, firstName: ILike(`%${search}%`) });
      where.push({ ...baseConditions, lastName: ILike(`%${search}%`) });
      where.push({ ...baseConditions, jobTitle: ILike(`%${search}%`) });
    } else {
      where.push(baseConditions);
    }

    return this.employeeRepository.find({
      where,
      order: sortBy && sortOrder ? { [sortBy]: sortOrder } : {},
    });
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOneBy({ id });
    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }
    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee> {
    const employee = await this.employeeRepository.preload({
      id,
      ...updateEmployeeDto,
    });
    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }
    return this.employeeRepository.save(employee);
  }

  async remove(id: string): Promise<void> {
    const result = await this.employeeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }
  }
}