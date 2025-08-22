// test/employees.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CreateEmployeeDto } from '../src/employees/dto/create-employee.dto';

describe('EmployeesController (e2e)', () => {
  let app: INestApplication;
  let createdEmployeeId: string;

  const createEmployeeDto: CreateEmployeeDto = {
    firstName: 'E2E',
    lastName: 'Test',
    email: 'e2e.test@example.com',
    jobTitle: 'Tester',
    department: 'QA',
    location: 'Test Suite',
    phone: '555-555-5555',
    pictureUrl: 'http://example.com/pic.jpg',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/employees (POST)', () => {
    it('should create a new employee', () => {
      return request(app.getHttpServer())
        .post('/employees')
        .send(createEmployeeDto)
        .expect(201)
        .then((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.firstName).toEqual(createEmployeeDto.firstName);
          createdEmployeeId = res.body.id;
        });
    });

    it('should fail with bad request for invalid data', () => {
        return request(app.getHttpServer())
          .post('/employees')
          .send({ firstName: 'Missing fields' })
          .expect(400);
    });
  });

  describe('/employees (GET)', () => {
    it('should return a paginated list of employees', () => {
      return request(app.getHttpServer())
        .get('/employees')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalItems');
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body).toHaveProperty('currentPage', 1);
          expect(res.body).toHaveProperty('totalPages');
        });
    });
  });

  describe('/employees/:id (GET)', () => {
    it('should return a single employee by ID', () => {
      return request(app.getHttpServer())
        .get(`/employees/${createdEmployeeId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toEqual(createdEmployeeId);
          expect(res.body.email).toEqual(createEmployeeDto.email);
        });
    });

    it('should return 404 for a non-existent employee', () => {
        const nonExistentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4aaa';
        return request(app.getHttpServer())
          .get(`/employees/${nonExistentId}`)
          .expect(404);
    });
  });

  describe('/employees/:id (PATCH)', () => {
    it('should update an employee', () => {
      const updatedFirstName = 'E2E Updated';
      return request(app.getHttpServer())
        .patch(`/employees/${createdEmployeeId}`)
        .send({ firstName: updatedFirstName })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toEqual(createdEmployeeId);
          expect(res.body.firstName).toEqual(updatedFirstName);
        });
    });
  });

  describe('/employees/:id (DELETE)', () => {
    it('should delete an employee', () => {
      return request(app.getHttpServer())
        .delete(`/employees/${createdEmployeeId}`)
        .expect(200); 
    });

    it('should return 404 after deleting', () => {
        return request(app.getHttpServer())
          .get(`/employees/${createdEmployeeId}`)
          .expect(404);
    });
  });
});
