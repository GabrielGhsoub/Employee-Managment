import axios from 'axios';
import type { Employee, PaginatedEmployeesResponse, EmployeeFormData } from '../features/employees/types';
import { employeeSchema } from '../features/employees/types';

const apiClient = axios.create({
  baseURL: '/api',
});

type GetEmployeesParams = {
  page?: number;
  limit?: number;
  department?: string;
  title?: string;
  location?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const getEmployees = async (params: GetEmployeesParams): Promise<PaginatedEmployeesResponse> => {
  const { data } = await apiClient.get('/employees', { params });
  return data;
};

export const getEmployeeById = async (id: string): Promise<Employee> => {
  const { data } = await apiClient.get(`/employees/${id}`);
  return data;
};

export const createEmployee = async (employeeData: EmployeeFormData): Promise<Employee> => {
    const validatedData = employeeSchema.parse(employeeData);
    const { data } = await apiClient.post('/employees', validatedData);
    return data;
};

export const updateEmployee = async ({ id, ...employeeData }: Partial<EmployeeFormData> & { id: string }): Promise<Employee> => {
    const validatedData = employeeSchema.partial().parse(employeeData);
    const { data } = await apiClient.patch(`/employees/${id}`, validatedData);
    return data;
};

export const deleteEmployee = async (id: string): Promise<void> => {
  await apiClient.delete(`/employees/${id}`);
};
