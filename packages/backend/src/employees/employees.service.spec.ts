// src/employees/employees.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesService } from './employees.service';
import { ExternalApiService } from './external-api.service';
import { EmployeeMapper } from './employee.mapper';
import { ConfigService } from '@nestjs/config';
import { getCacheManagerMock } from '../common/mocks/cache-manager.mock';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getLoggerToken } from 'nestjs-pino'; // <-- Import getLoggerToken
import { getPinoLoggerMock } from '../common/mocks/pino-logger.mock';
import { Employee } from './entities/employee.entity';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let externalApiService: ExternalApiService;
  let cacheManager: any;

  const mockEmployees: Employee[] = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '123-456-7890',
      pictureUrl: '',
      jobTitle: 'Software Engineer',
      department: 'Engineering',
      location: 'Austin',
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '098-765-4321',
      pictureUrl: '',
      jobTitle: 'Product Designer',
      department: 'Design',
      location: 'San Francisco',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        {
          provide: ExternalApiService,
          useValue: {
            fetchRawEmployees: jest.fn(),
          },
        },
        {
          provide: EmployeeMapper,
          useValue: {
            toEntity: jest.fn().mockImplementation((user) => ({
              id: user.login.uuid,
              firstName: user.name.first,
              lastName: user.name.last,
              email: user.email,
              phone: user.phone,
              pictureUrl: user.picture.large,
              jobTitle: 'Software Engineer',
              department: 'Engineering',
              location: `${user.location.city}, ${user.location.state}`,
            })),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(300),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: getCacheManagerMock(),
        },
        {
          provide: getLoggerToken(EmployeesService.name),
          useValue: getPinoLoggerMock(),
        },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    externalApiService = module.get<ExternalApiService>(ExternalApiService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('find', () => {
    it('should filter employees by department', async () => {
      cacheManager.get.mockResolvedValue(mockEmployees);
      const result = await service.find('Engineering');
      expect(result).toHaveLength(1);
      expect(result[0].department).toBe('Engineering');
    });

    it('should filter employees by title', async () => {
      cacheManager.get.mockResolvedValue(mockEmployees);
      const result = await service.find(undefined, 'Product Designer');
      expect(result).toHaveLength(1);
      expect(result[0].jobTitle).toBe('Product Designer');
    });

    it('should filter employees by location', async () => {
        cacheManager.get.mockResolvedValue(mockEmployees);
        const result = await service.find(undefined, undefined, 'Austin');
        expect(result).toHaveLength(1);
        expect(result[0].location).toBe('Austin');
      });
  });

  describe('caching', () => {
    it('should fetch from external API when cache is empty', async () => {
      cacheManager.get.mockResolvedValue(undefined);
      const mockRawUsers = [
        {
          login: { uuid: '1' },
          name: { first: 'John', last: 'Doe' },
          email: 'john.doe@example.com',
          phone: '123-456-7890',
          picture: { large: '' },
          location: { city: 'Austin', state: 'Texas' },
        },
      ];
      (externalApiService.fetchRawEmployees as jest.Mock).mockResolvedValue(mockRawUsers);
  
      await service.find();
  
      expect(externalApiService.fetchRawEmployees).toHaveBeenCalledTimes(1);
      expect(cacheManager.set).toHaveBeenCalled();
    });
  
    it('should NOT fetch from external API when cache has data', async () => {
      cacheManager.get.mockResolvedValue(mockEmployees);
  
      await service.find();
  
      expect(externalApiService.fetchRawEmployees).not.toHaveBeenCalled();
    });
  });
});