import { z } from 'zod';

export const employeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  pictureUrl: z.string().optional().refine(
    (val) => !val || val === '' || z.string().url().safeParse(val).success,
    'Must be a valid URL'
  ),
  jobTitle: z.string().min(1, 'Job title is required'),
  department: z.string().min(1, 'Department is required'),
  location: z.string().min(1, 'Location is required'),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;

export type Employee = EmployeeFormData & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedEmployeesResponse = {
  totalItems: number;
  data: Employee[];
  currentPage: number;
  totalPages: number;
};
