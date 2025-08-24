import { useState, useCallback, useMemo } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';

export interface EmployeeFilterState {
  page: number;
  rowsPerPage: number;
  search: string;
  department: string;
  location: string;
  jobTitle: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

const initialState: EmployeeFilterState = {
  page: 0,
  rowsPerPage: 12,
  search: '',
  department: '',
  location: '',
  jobTitle: '',
  sortBy: 'firstName',
  sortOrder: 'ASC',
};

export const useEmployeeFilters = () => {
  const [filters, setFilters] = useState<EmployeeFilterState>(initialState);

  const debouncedSearch = useDebounce(filters.search, 500);

  const updateFilter = useCallback(<K extends keyof EmployeeFilterState>(
    key: K,
    value: EmployeeFilterState[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Reset page when changing filters (except pagination)
      ...(key !== 'page' && key !== 'rowsPerPage' && { page: 0 })
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialState);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.search ||
      filters.department ||
      filters.location ||
      filters.jobTitle ||
      filters.sortBy !== 'firstName' ||
      filters.sortOrder !== 'ASC'
    );
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.department) count++;
    if (filters.location) count++;
    if (filters.jobTitle) count++;
    if (filters.sortBy !== 'firstName') count++;
    if (filters.sortOrder !== 'ASC') count++;
    return count;
  }, [filters]);

  return {
    filters: {
      ...filters,
      search: debouncedSearch, // Use debounced search for API calls
    },
    rawFilters: filters, // Raw filters for UI state
    updateFilter,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
  };
};