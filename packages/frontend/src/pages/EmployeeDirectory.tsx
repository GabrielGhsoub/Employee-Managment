import { useState } from 'react';
import { Box } from '@mui/material';
import { useEmployees, useDeleteEmployee, useEmployeeFilterOptions } from '../features/employees/hooks/useEmployees';
import { useEmployeeFilters } from '../features/employees/hooks/useEmployeeFilters';
import { useEmployeeActions } from '../features/employees/hooks/useEmployeeActions';
import EmployeeDirectoryHeader from '../features/employees/components/EmployeeDirectoryHeader';
import EmployeeFilters from '../features/employees/components/EmployeeFilters';
import EmployeeList from '../features/employees/components/EmployeeList';
import EmployeeForm from '../features/employees/components/EmployeeForm';
import ConfirmationModal from '../components/ConfirmationModal';
import PageLoader from '../components/PageLoader';
import ErrorFallback from '../components/ui/ErrorFallback';
import ErrorBoundary from '../components/ui/ErrorBoundary';


const EmployeeDirectory = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Custom hooks for state management
  const { filters, rawFilters, updateFilter, clearFilters, hasActiveFilters, activeFilterCount } = useEmployeeFilters();
  const { 
    formOpen, 
    selectedEmployee, 
    deleteConfirmOpen, 
    employeeToDelete,
    handleEdit,
    handleAdd,
    handleDelete,
    handleFormClose,
    handleFormSuccess,
    handleDeleteCancel,
  } = useEmployeeActions();

  // Data fetching with custom hooks
  const { data, isLoading, error, refetch } = useEmployees({
    page: filters.page,
    limit: filters.rowsPerPage,
    search: filters.search,
    department: filters.department,
    location: filters.location,
    title: filters.jobTitle,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const deleteMutation = useDeleteEmployee();
  const filterOptions = useEmployeeFilterOptions(data?.data);

  const handleConfirmDelete = () => {
    if (employeeToDelete) {
      deleteMutation.mutate(employeeToDelete.id);
      handleDeleteCancel();
    }
  };

  const employees = data?.data || [];

  if (error) {
    return (
      <ErrorFallback
        error={error}
        title="Failed to load employees"
        message="We couldn't load the employee directory. Please check your connection and try again."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <ErrorBoundary>
      <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        <EmployeeDirectoryHeader
          totalItems={data?.totalItems || 0}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          isLoading={isLoading}
          onAddEmployee={handleAdd}
          onRefresh={refetch}
          onClearFilters={clearFilters}
        />

        <EmployeeFilters
          search={rawFilters.search}
          department={rawFilters.department}
          location={rawFilters.location}
          jobTitle={rawFilters.jobTitle}
          sortBy={rawFilters.sortBy}
          sortOrder={rawFilters.sortOrder}
          viewMode={viewMode}
          showFilters={showFilters}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          filterOptions={filterOptions}
          onSearchChange={(value) => updateFilter('search', value)}
          onDepartmentChange={(value) => updateFilter('department', value)}
          onLocationChange={(value) => updateFilter('location', value)}
          onJobTitleChange={(value) => updateFilter('jobTitle', value)}
          onSortByChange={(value) => updateFilter('sortBy', value)}
          onSortOrderChange={(value) => updateFilter('sortOrder', value)}
          onViewModeChange={setViewMode}
          onToggleFilters={() => setShowFilters(!showFilters)}
          onClearFilters={clearFilters}
        />

        {isLoading && !data ? (
          <PageLoader message="Loading employees..." />
        ) : (
          <EmployeeList
            employees={employees}
            totalItems={data?.totalItems || 0}
            page={filters.page}
            rowsPerPage={filters.rowsPerPage}
            onPageChange={(page) => updateFilter('page', page)}
            onRowsPerPageChange={(rowsPerPage) => updateFilter('rowsPerPage', rowsPerPage)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            viewMode={viewMode}
            isLoading={isLoading}
          />
        )}

        <EmployeeForm
          open={formOpen}
          onClose={handleFormClose}
          employee={selectedEmployee}
          onSuccess={handleFormSuccess}
        />

        <ConfirmationModal
          open={deleteConfirmOpen}
          title="Delete Employee"
          message={`Are you sure you want to delete ${employeeToDelete?.firstName} ${employeeToDelete?.lastName}? This action cannot be undone in the future.`}
          onConfirm={handleConfirmDelete}
          onCancel={handleDeleteCancel}
          confirmText="Delete"
          confirmColor="error"
          loading={deleteMutation.isPending}
        />
      </Box>
    </ErrorBoundary>
  );
};

export default EmployeeDirectory;