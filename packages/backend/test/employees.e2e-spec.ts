// test/employees.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';


describe('EmployeesController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/employees (GET)', () => {
    return request(app.getHttpServer())
      .get('/employees')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('totalItems');
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('currentPage');
        expect(res.body).toHaveProperty('totalPages');
      });
  });
});