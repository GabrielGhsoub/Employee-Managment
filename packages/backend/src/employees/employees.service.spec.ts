// src/employees/employees.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeesService } from './employees.service';
import { ExternalApiService } from './external-api.service';
import { EmployeeMapper } from './employee.mapper';
import { getPinoLoggerMock } from '../common/mocks/pino-logger.mock';
import { Employee } from './entities/employee.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { ConfigService } from '@nestjs/config';

type MockCacheManager = {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
  store: {
    reset: jest.Mock;
  };
};

describe('EmployeesService', () => {
  let service: EmployeesService;
  let repository: Repository<Employee>;
  let externalApiService: ExternalApiService;
  let cacheManager: MockCacheManager;

  const mockEmployee: Employee = {
    id: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '123-456-7890',
    pictureUrl: '',
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    location: 'Austin',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockResolvedValue(mockEmployee),
    find: jest.fn().mockResolvedValue([mockEmployee]),
    findOneBy: jest.fn().mockResolvedValue(mockEmployee),
    preload: jest.fn().mockResolvedValue(mockEmployee),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    count: jest.fn().mockResolvedValue(0),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    store: {
      reset: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        {
          provide: getRepositoryToken(Employee),
          useValue: mockRepository,
        },
        {
          provide: ExternalApiService,
          useValue: {
            fetchRawEmployees: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: EmployeeMapper,
          useValue: {
            toEntity: jest.fn(),
          },
        },
        {
          provide: 'PinoLogger:EmployeesService',
          useValue: getPinoLoggerMock(),
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test'),
          },
        },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    repository = module.get<Repository<Employee>>(getRepositoryToken(Employee));
    externalApiService = module.get<ExternalApiService>(ExternalApiService);
    cacheManager = module.get<MockCacheManager>(CACHE_MANAGER as any);

    jest.clearAllMocks();
    mockRepository.findOneBy.mockResolvedValue(mockEmployee);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an employee and invalidate the cache', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      const { id, createdAt, updatedAt, ...createDtoData } = mockEmployee;
      const createDto: CreateEmployeeDto = createDtoData;
      mockRepository.create.mockImplementation((emp) => emp);
      mockRepository.save.mockResolvedValue(mockEmployee);

      const result = await service.create(createDto);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(cacheManager.store.reset).toHaveBeenCalled();
      expect(result).toEqual(mockEmployee);
    });
  });

  describe('find', () => {
    it('should return cached employees if available', async () => {
      mockCacheManager.get.mockResolvedValue([mockEmployee]);
      const result = await service.find({});
      expect(result).toEqual([mockEmployee]);
      expect(repository.find).not.toHaveBeenCalled();
    });

    it('should fetch employees and cache them if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      const result = await service.find({});
      expect(result).toEqual([mockEmployee]);
      expect(repository.find).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a cached employee if available', async () => {
      mockCacheManager.get.mockResolvedValue(mockEmployee);
      const result = await service.findOne(mockEmployee.id);
      expect(result).toEqual(mockEmployee);
      expect(repository.findOneBy).not.toHaveBeenCalled();
    });

    it('should fetch an employee and cache it if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      const result = await service.findOne(mockEmployee.id);
      expect(result).toEqual(mockEmployee);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: mockEmployee.id });
      expect(cacheManager.set).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an employee and invalidate the cache', async () => {
      const updateDto = { firstName: 'Johnny' };
      await service.update(mockEmployee.id, updateDto);
      expect(repository.save).toHaveBeenCalled();
      expect(cacheManager.store.reset).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove an employee and invalidate the cache', async () => {
      await service.remove(mockEmployee.id);
      expect(repository.delete).toHaveBeenCalledWith(mockEmployee.id);
      expect(cacheManager.store.reset).toHaveBeenCalled();
    });
  });
});
