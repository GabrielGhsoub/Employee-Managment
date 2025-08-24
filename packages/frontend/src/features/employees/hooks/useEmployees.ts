import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { getEmployees, deleteEmployee } from '../../../api/employees';
import type { Employee } from '../types';

export interface EmployeeFilters {
  page: number;
  limit: number;
  search: string;
  department?: string;
  location?: string;
  title?: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

export const useEmployees = (filters: EmployeeFilters) => {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: () => getEmployees({
      page: filters.page + 1, // API expects 1-based page
      limit: filters.limit,
      search: filters.search,
      department: filters.department,
      location: filters.location,
      title: filters.title,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    }),
    staleTime: 30000,
    gcTime: 300000
  });
};

export const useDeleteEmployee = () => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      enqueueSnackbar('Employee deleted successfully', { variant: 'success' });
    },
    onError: () => {
      enqueueSnackbar('Failed to delete employee', { variant: 'error' });
    }
  });
};

export const useEmployeeFilterOptions = (employees: Employee[] = []) => {
  const queryClient = useQueryClient();

  // Get all employees from cache for filter options
  const allEmployeesData = queryClient.getQueryData<{ data: Employee[] }>(['employees', {}]);
  const allEmployees = allEmployeesData?.data || employees;

  return {
    departments: [...new Set(allEmployees.map(e => e.department))].sort(),
    locations: [...new Set(allEmployees.map(e => e.location))].sort(),
    titles: [...new Set(allEmployees.map(e => e.jobTitle))].sort()
  };
};