import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { getEmployees, deleteEmployee } from '../../../api/employees';
import type { Employee } from '../types';
import { safeGet } from '../../../lib/utils';

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
  const allEmployees = Array.isArray(allEmployeesData?.data) ? allEmployeesData.data : Array.isArray(employees) ? employees : [];

  return {
    departments: [...new Set(
      allEmployees
        .filter(e => e && typeof e === 'object' && e.department && typeof e.department === 'string')
        .map(e => safeGet(e.department, ''))
        .filter(d => d.length > 0)
    )].sort(),
    locations: [...new Set(
      allEmployees
        .filter(e => e && typeof e === 'object' && e.location && typeof e.location === 'string')
        .map(e => safeGet(e.location, ''))
        .filter(l => l.length > 0)
    )].sort(),
    titles: [...new Set(
      allEmployees
        .filter(e => e && typeof e === 'object' && e.jobTitle && typeof e.jobTitle === 'string')
        .map(e => safeGet(e.jobTitle, ''))
        .filter(t => t.length > 0)
    )].sort()
  };
};