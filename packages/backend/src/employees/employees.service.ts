// src/employees/employees.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Employee } from './entities/employee.entity';
import { ExternalApiService } from './external-api.service';
import { EmployeeMapper } from './employee.mapper';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class EmployeesService {
  private readonly cacheKey = 'all_employees';
  private readonly cacheTtl: number;

  constructor(
    private readonly externalApiService: ExternalApiService,
    private readonly employeeMapper: EmployeeMapper,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectPinoLogger(EmployeesService.name)
    private readonly logger: PinoLogger,
  ) {
    this.cacheTtl = this.configService.get<number>('CACHE_TTL_SECONDS', 300);
  }

  async find(department?: string, title?: string, location?: string): Promise<Employee[]> {
    this.logger.debug({ department, title, location }, 'Finding employees with filters');
    let allEmployees = await this.getAllEmployees();

    if (department) {
      allEmployees = allEmployees.filter(
        (emp) => emp.department.toLowerCase() === department.toLowerCase(),
      );
    }
    if (title) {
      allEmployees = allEmployees.filter(
        (emp) => emp.jobTitle.toLowerCase() === title.toLowerCase(),
      );
    }
    if (location) {
      allEmployees = allEmployees.filter((emp) =>
        emp.location.toLowerCase().includes(location.toLowerCase()),
      );
    }

    return allEmployees;
  }

  private async getAllEmployees(): Promise<Employee[]> {
    const cachedEmployees = await this.cacheManager.get<Employee[]>(this.cacheKey);
    if (cachedEmployees) {
      this.logger.info('Cache hit for key: %s', this.cacheKey);
      return cachedEmployees;
    }

    this.logger.info('Cache miss for key: %s. Fetching fresh data.', this.cacheKey);
    const rawUsers = await this.externalApiService.fetchRawEmployees();
    const employees = rawUsers.map((user) => this.employeeMapper.toEntity(user));

    await this.cacheManager.set(this.cacheKey, employees, this.cacheTtl);
    this.logger.info('Employee data cached successfully.');
    return employees;
  }
}
