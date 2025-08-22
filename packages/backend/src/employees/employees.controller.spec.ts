// src/employees/employees.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { Employee } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { v4 as uuidv4 } from 'uuid';

describe('EmployeesController', () => {
  let controller: EmployeesController;
  let service: EmployeesService;

  const mockEmployee: Employee = {
    id: uuidv4(),
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '111-222-3333',
    pictureUrl: '',
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    location: 'Test City',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockEmployees: Employee[] = Array(20)
    .fill(null)
    .map((_, i) => ({
      ...mockEmployee,
      id: uuidv4(),
      firstName: `FirstName${i + 1}`,
      lastName: `LastName${i + 1}`,
      email: `test${i + 1}@example.com`,
    }));

  const mockEmployeesService = {
    create: jest.fn().mockResolvedValue(mockEmployee),
    find: jest.fn().mockResolvedValue(mockEmployees),
    findOne: jest.fn().mockResolvedValue(mockEmployee),
    update: jest.fn().mockResolvedValue(mockEmployee),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [
        {
          provide: EmployeesService,
          useValue: mockEmployeesService,
        },
      ],
    }).compile();

    controller = module.get<EmployeesController>(EmployeesController);
    service = module.get<EmployeesService>(EmployeesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new employee', async () => {
      const createDto: CreateEmployeeDto = { ...mockEmployee };
      const result = await controller.create(createDto);
      expect(result).toEqual(mockEmployee);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('find', () => {
    it('should return paginated employee data', async () => {
      const page = 2;
      const limit = 5;
      const result = await controller.find(page, limit, {});

      expect(result.totalItems).toBe(20);
      expect(result.data.length).toBe(limit);
      expect(result.currentPage).toBe(page);
      expect(result.totalPages).toBe(Math.ceil(mockEmployees.length / limit));
      expect(service.find).toHaveBeenCalledWith({});
    });
  });

  describe('findOne', () => {
    it('should return a single employee by ID', async () => {
      const result = await controller.findOne(mockEmployee.id);
      expect(result).toEqual(mockEmployee);
      expect(service.findOne).toHaveBeenCalledWith(mockEmployee.id);
    });
  });

  describe('update', () => {
    it('should update an employee', async () => {
      const updateDto: UpdateEmployeeDto = { firstName: 'Johnny' };
      const result = await controller.update(mockEmployee.id, updateDto);
      expect(result).toEqual(mockEmployee);
      expect(service.update).toHaveBeenCalledWith(mockEmployee.id, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove an employee', async () => {
      await controller.remove(mockEmployee.id);
      expect(service.remove).toHaveBeenCalledWith(mockEmployee.id);
    });
  });
});