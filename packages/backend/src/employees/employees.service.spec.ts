// src/employees/employees.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeesService } from './employees.service';
import { ExternalApiService } from './external-api.service';
import { EmployeeMapper } from './employee.mapper';
import { getPinoLoggerMock } from '../common/mocks/pino-logger.mock';
import { Employee } from './entities/employee.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let repository: Repository<Employee>;
  let externalApiService: ExternalApiService;

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
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockResolvedValue(mockEmployee),
    find: jest.fn().mockResolvedValue([mockEmployee]),
    findOneBy: jest.fn().mockResolvedValue(mockEmployee),
    preload: jest.fn().mockResolvedValue(mockEmployee),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    count: jest.fn().mockResolvedValue(0),
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
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    repository = module.get<Repository<Employee>>(getRepositoryToken(Employee));
    externalApiService = module.get<ExternalApiService>(ExternalApiService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return an employee when email does not exist', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const { id, createdAt, updatedAt, ...createDtoData } = mockEmployee;
      const createDto: CreateEmployeeDto = createDtoData;

      mockRepository.create.mockImplementation(emp => emp);
      mockRepository.save.mockResolvedValue(mockEmployee);

      const result = await service.create(createDto);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email: createDto.email });
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        id: expect.any(String),
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockEmployee);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockEmployee);

      const { id, createdAt, updatedAt, ...createDtoData } = mockEmployee;
      const createDto: CreateEmployeeDto = createDtoData;

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email: createDto.email });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('find', () => {
    it('should return an array of employees', async () => {
      const result = await service.find({});
      expect(result).toEqual([mockEmployee]);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single employee', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockEmployee);
      const result = await service.findOne(mockEmployee.id);
      expect(result).toEqual(mockEmployee);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: mockEmployee.id });
    });

    it('should throw NotFoundException if employee not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return an employee', async () => {
      const updateDto = { firstName: 'Johnny' };
      const result = await service.update(mockEmployee.id, updateDto);
      expect(repository.preload).toHaveBeenCalledWith({ id: mockEmployee.id, ...updateDto });
      expect(repository.save).toHaveBeenCalledWith(mockEmployee);
      expect(result).toEqual(mockEmployee);
    });

    it('should throw NotFoundException if employee to update not found', async () => {
      mockRepository.preload.mockResolvedValue(null);
      await expect(service.update('bad-id', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an employee', async () => {
      await service.remove(mockEmployee.id);
      expect(repository.delete).toHaveBeenCalledWith(mockEmployee.id);
    });

    it('should throw NotFoundException if employee to remove not found', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('seeding', () => {
    it('should fetch from external API when database is empty', async () => {
      mockRepository.count.mockResolvedValue(0);
      const mockRawUsers = [{ login: { uuid: '1' } }];
      (externalApiService.fetchRawEmployees as jest.Mock).mockResolvedValue(mockRawUsers);
      await service.onModuleInit();
      expect(externalApiService.fetchRawEmployees).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should NOT fetch from external API when database has data', async () => {
      mockRepository.count.mockResolvedValue(100);
      await service.onModuleInit();
      expect(externalApiService.fetchRawEmployees).not.toHaveBeenCalled();
    });
  });
});