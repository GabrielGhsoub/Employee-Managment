// src/employees/employee.mapper.ts

import { Injectable } from '@nestjs/common';
import { Employee } from './entities/employee.entity';

type Department = 'Engineering' | 'Marketing' | 'Sales' | 'Human Resources' | 'Design';
type JobTitles = Record<Department, string[]>;

@Injectable()
export class EmployeeMapper {
  private readonly departments: Department[] = [
    'Engineering',
    'Marketing',
    'Sales',
    'Human Resources',
    'Design',
  ];
  private readonly jobTitles: JobTitles = {
    Engineering: ['Software Engineer', 'QA Engineer', 'DevOps Engineer', 'Tech Lead'],
    Marketing: ['Marketing Specialist', 'Content Creator', 'SEO Analyst'],
    Sales: ['Account Executive', 'Sales Development Rep', 'Sales Manager'],
    'Human Resources': ['Recruiter', 'HR Generalist'],
    Design: ['UI/UX Designer', 'Graphic Designer', 'Product Designer'],
  };

  private getHash(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash);
  }

  toEntity(rawUser: any): Employee {
    const userId = rawUser.login.uuid;
    const hash = this.getHash(userId);

    const department = this.departments[hash % this.departments.length];
    const titlesInDept = this.jobTitles[department];
    const jobTitle = titlesInDept[hash % titlesInDept.length];

    const location = `${rawUser.location.city}, ${rawUser.location.state}`;

    return {
      id: userId,
      firstName: rawUser.name.first,
      lastName: rawUser.name.last,
      email: rawUser.email,
      phone: rawUser.phone,
      pictureUrl: rawUser.picture.large,
      jobTitle,
      department,
      location,
    };
  }
}
