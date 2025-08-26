import axios from 'axios';
import type { Employee, PaginatedEmployeesResponse, EmployeeFormData } from '../features/employees/types';
import { employeeSchema } from '../features/employees/types';
import { safeEmployee, safeGet } from '../lib/utils';

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
  try {
    const { data } = await apiClient.get('/employees', { params });
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid API response format');
    }
    
    // Safely handle the response data
    const result: PaginatedEmployeesResponse = {
      totalItems: safeGet(data.totalItems, 0),
      currentPage: safeGet(data.currentPage, 1),
      totalPages: safeGet(data.totalPages, 1),
      data: Array.isArray(data.data) 
        ? data.data.map((employee: unknown) => safeEmployee(employee) as Employee)
        : []
    };
    
    return result;
  } catch (error) {
    console.error('Error fetching employees:', error);
    return {
      totalItems: 0,
      currentPage: 1,
      totalPages: 1,
      data: []
    };
  }
};

export const getEmployeeById = async (id: string): Promise<Employee> => {
  try {
    const { data } = await apiClient.get(`/employees/${id}`);
    return safeEmployee(data) as Employee;
  } catch (error) {
    console.error('Error fetching employee by ID:', error);
    return safeEmployee(null) as Employee;
  }
};

export const createEmployee = async (employeeData: EmployeeFormData): Promise<Employee> => {
  try {
    const validatedData = employeeSchema.parse(employeeData);
    const { data } = await apiClient.post('/employees', validatedData);
    return safeEmployee(data) as Employee;
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error; // Re-throw for mutation error handling
  }
};

export const updateEmployee = async ({ id, ...employeeData }: Partial<EmployeeFormData> & { id: string }): Promise<Employee> => {
  try {
    const validatedData = employeeSchema.partial().parse(employeeData);
    const { data } = await apiClient.patch(`/employees/${id}`, validatedData);
    return safeEmployee(data) as Employee;
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error; // Re-throw for mutation error handling
  }
};

export const deleteEmployee = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/employees/${id}`);
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error; // Re-throw for mutation error handling
  }
};
