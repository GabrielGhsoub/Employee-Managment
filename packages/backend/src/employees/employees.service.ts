// src/employees/employees.service.ts

import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, Not } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { ExternalApiService } from './external-api.service';
import { EmployeeMapper } from './employee.mapper';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { v4 as uuidv4 } from 'uuid';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmployeesService implements OnModuleInit {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly externalApiService: ExternalApiService,
    private readonly employeeMapper: EmployeeMapper,
    @InjectPinoLogger(EmployeesService.name)
    private readonly logger: PinoLogger,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    if (this.configService.get('NODE_ENV') !== 'test') {
      await this.seedDatabase();
    }
  }

  /**
   * Invalidates all cache entries by resetting the cache store.
   * This is called on any write operation (create, update, delete).
   */
  private async invalidateCache() {
    const store = (this.cacheManager as any).store;
    if (store && typeof store.reset === 'function') {
      await store.reset();
      this.logger.info('Employee cache invalidated.');
    } else {
      this.logger.warn('Cache store does not have a reset method. Skipping cache invalidation.');
    }
  }

  private async seedDatabase() {
    const count = await this.employeeRepository.count();
    if (count > 0) {
      this.logger.info('Database already seeded. Skipping.');
      return;
    }

    this.logger.info('Database is empty. Seeding with initial data...');
    const rawUsers = await this.externalApiService.fetchRawEmployees();
    const employees = rawUsers.map((user) => this.employeeMapper.toEntity(user));

    // Remove duplicates by email before inserting
    const uniqueEmployees = employees.filter((employee, index, arr) => 
      arr.findIndex(e => e.email === employee.email) === index
    );

    this.logger.info(`Filtered ${employees.length} employees to ${uniqueEmployees.length} unique employees`);

    // Insert employees one by one to handle any remaining conflicts gracefully
    let insertedCount = 0;
    for (const employee of uniqueEmployees) {
      try {
        await this.employeeRepository.save(employee);
        insertedCount++;
      } catch (error) {
        // Log and skip employees that still cause conflicts
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to insert employee ${employee.email}: ${errorMessage}`);
      }
    }

    this.logger.info(`Database seeded successfully with ${insertedCount} employees.`);
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

    const savedEmployee = await this.employeeRepository.save(newEmployee);
    await this.invalidateCache();
    return savedEmployee;
  }

  async find(query: QueryEmployeeDto): Promise<Employee[]> {
    const cacheKey = `employees_find_${JSON.stringify(query)}`;
    const cachedData = await this.cacheManager.get<Employee[]>(cacheKey);

    if (cachedData) {
      this.logger.debug({ query }, 'Returning cached employees');
      return cachedData;
    }

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

    const employees = await this.employeeRepository.find({
      where,
      order: sortBy && sortOrder ? { [sortBy]: sortOrder } : {},
    });

    await this.cacheManager.set(cacheKey, employees);
    return employees;
  }

  async findOne(id: string): Promise<Employee> {
    const cacheKey = `employee_${id}`;
    const cachedData = await this.cacheManager.get<Employee>(cacheKey);

    if (cachedData) {
      this.logger.debug({ id }, 'Returning cached employee');
      return cachedData;
    }

    const employee = await this.employeeRepository.findOneBy({ id });
    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }

    await this.cacheManager.set(cacheKey, employee);
    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee> {
    if (updateEmployeeDto.email) {
      const existingEmployee = await this.employeeRepository.findOneBy({
        email: updateEmployeeDto.email,
        id: Not(id),
      });

      if (existingEmployee) {
        throw new ConflictException(
          `Employee with email "${updateEmployeeDto.email}" already exists.`,
        );
      }
    }

    const employee = await this.employeeRepository.preload({
      id,
      ...updateEmployeeDto,
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }

    const savedEmployee = await this.employeeRepository.save(employee);
    await this.invalidateCache();
    return savedEmployee;
  }

  async remove(id: string): Promise<void> {
    const result = await this.employeeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }
    await this.invalidateCache();
  }
}
