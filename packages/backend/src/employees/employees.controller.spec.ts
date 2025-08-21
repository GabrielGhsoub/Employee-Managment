// src/employees/employees.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { Employee } from './entities/employee.entity';

describe('EmployeesController', () => {
  let controller: EmployeesController;
  let service: EmployeesService;

  const mockEmployees: Employee[] = Array(20)
    .fill(null)
    .map((_, i) => ({
      id: `${i + 1}`,
      firstName: `FirstName${i + 1}`,
      lastName: `LastName${i + 1}`,
      email: `test${i + 1}@example.com`,
      phone: '111-222-3333',
      pictureUrl: '',
      jobTitle: 'Software Engineer',
      department: 'Engineering',
      location: 'Test City',
    }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [
        {
          provide: EmployeesService,
          useValue: {
            find: jest.fn().mockResolvedValue(mockEmployees),
          },
        },
      ],
    }).compile();

    controller = module.get<EmployeesController>(EmployeesController);
    service = module.get<EmployeesService>(EmployeesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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
    });
  });
});