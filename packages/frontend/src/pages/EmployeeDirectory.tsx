import { useState, useCallback, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  Paper,
  Fade,
  Zoom,
  IconButton,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { motion, AnimatePresence } from 'framer-motion';
import { getEmployees, deleteEmployee } from '../api/employees';
import EmployeeList from '../features/employees/components/EmployeeList';
import EmployeeForm from '../features/employees/components/EmployeeForm';
import ConfirmationModal from '../components/ConfirmationModal';
import PageLoader from '../components/PageLoader';
import type { Employee } from '../features/employees/types';
import { useDebounce } from '../hooks/useDebounce';

type ViewMode = 'grid' | 'list';

const EmployeeDirectory = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [sortBy, setSortBy] = useState('firstName');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);


  const [formOpen, setFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['employees', {
      page: page + 1,
      limit: rowsPerPage,
      search: debouncedSearch,
      department,
      location,
      title: jobTitle,
      sortBy,
      sortOrder
    }],
    queryFn: () => getEmployees({
      page: page + 1,
      limit: rowsPerPage,
      search: debouncedSearch,
      department: department || undefined,
      location: location || undefined,
      title: jobTitle || undefined,
      sortBy,
      sortOrder
    }),
    staleTime: 30000,
    gcTime: 300000
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      enqueueSnackbar('Employee deleted successfully', { variant: 'success' });
      setDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
    },
    onError: () => {
      enqueueSnackbar('Failed to delete employee', { variant: 'error' });
    }
  });

  const handleEdit = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteConfirmOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (employeeToDelete) {
      deleteMutation.mutate(employeeToDelete.id);
    }
  }, [employeeToDelete, deleteMutation]);

  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setSelectedEmployee(null);
  }, []);

  const handleFormSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    handleFormClose();
  }, [queryClient, handleFormClose]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setDepartment('');
    setLocation('');
    setJobTitle('');
    setSortBy('firstName');
    setSortOrder('ASC');
  }, []);

  const hasActiveFilters = useMemo(() => {
    return !!(search || department || location || jobTitle || sortBy !== 'firstName' || sortOrder !== 'ASC');
  }, [search, department, location, jobTitle, sortBy, sortOrder]);

  const filterOptions = useMemo(() => {
    if (!data?.data) return { departments: [], locations: [], titles: [] };
    
    const allEmployees = queryClient.getQueryData<typeof data>(['employees', {}])?.data || data.data;
    
    return {
      departments: [...new Set(allEmployees.map(e => e.department))].sort(),
      locations: [...new Set(allEmployees.map(e => e.location))].sort(),
      titles: [...new Set(allEmployees.map(e => e.jobTitle))].sort()
    };
  }, [data, queryClient]);

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 2
      }}>
        <Typography variant="h5" color="error">Failed to load employees</Typography>
        <Button variant="contained" onClick={() => refetch()}>Retry</Button>
      </Box>
    );
  }

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Employee Directory
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {data?.totalItems || 0} total employees
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <Tooltip title="Refresh">
                <IconButton onClick={() => refetch()} disabled={isLoading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setFormOpen(true)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  py: 1.5,
                  width: { xs: '100%', sm: 'auto' },
                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                  '&:hover': {
                    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                  }
                }}
              >
                Add Employee
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, borderRadius: 2 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: search && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch('')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 }
                }}
              />
              
              <Stack direction="row" spacing={1} sx={{ flexShrink: 0, alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                <Tooltip title="Toggle filters">
                  <IconButton
                    onClick={() => setShowFilters(!showFilters)}
                    color={showFilters ? 'primary' : 'default'}
                    sx={{
                      border: `1px solid ${showFilters ? theme.palette.primary.main : theme.palette.divider}`,
                      borderRadius: 2,
                    }}
                  >
                    <FilterIcon />
                  </IconButton>
                </Tooltip>
                
                <Stack direction="row" sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                  <IconButton
                    onClick={() => setViewMode('grid')}
                    color={viewMode === 'grid' ? 'primary' : 'default'}
                  >
                    <GridViewIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => setViewMode('list')}
                    color={viewMode === 'list' ? 'primary' : 'default'}
                  >
                    <ListViewIcon />
                  </IconButton>
                </Stack>
              </Stack>
            </Stack>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: 'hidden' }}
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Department</InputLabel>
                      <Select
                        value={department}
                        label="Department"
                        onChange={(e: SelectChangeEvent) => setDepartment(e.target.value)}
                      >
                        <MenuItem value="">All</MenuItem>
                        {filterOptions.departments.map(dept => (
                          <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Location</InputLabel>
                      <Select
                        value={location}
                        label="Location"
                        onChange={(e: SelectChangeEvent) => setLocation(e.target.value)}
                      >
                        <MenuItem value="">All</MenuItem>
                        {filterOptions.locations.map(loc => (
                          <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Job Title</InputLabel>
                      <Select
                        value={jobTitle}
                        label="Job Title"
                        onChange={(e: SelectChangeEvent) => setJobTitle(e.target.value)}
                      >
                        <MenuItem value="">All</MenuItem>
                        {filterOptions.titles.map(title => (
                          <MenuItem key={title} value={title}>{title}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Sort By</InputLabel>
                      <Select
                        value={sortBy}
                        label="Sort By"
                        onChange={(e: SelectChangeEvent) => setSortBy(e.target.value)}
                      >
                        <MenuItem value="firstName">First Name</MenuItem>
                        <MenuItem value="lastName">Last Name</MenuItem>
                        <MenuItem value="department">Department</MenuItem>
                        <MenuItem value="jobTitle">Job Title</MenuItem>
                        <MenuItem value="createdAt">Date Added</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <InputLabel>Order</InputLabel>
                      <Select
                        value={sortOrder}
                        label="Order"
                        onChange={(e: SelectChangeEvent) => setSortOrder(e.target.value as 'ASC' | 'DESC')}
                      >
                        <MenuItem value="ASC">A-Z</MenuItem>
                        <MenuItem value="DESC">Z-A</MenuItem>
                      </Select>
                    </FormControl>

                    {hasActiveFilters && (
                      <Zoom in={hasActiveFilters}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={clearFilters}
                          startIcon={<ClearIcon />}
                          sx={{ borderRadius: 2 }}
                        >
                          Clear
                        </Button>
                      </Zoom>
                    )}
                  </Stack>
                </motion.div>
              )}
            </AnimatePresence>

            {hasActiveFilters && (
              <Fade in={hasActiveFilters}>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ pt: 1 }}>
                  {search && (
                    <Chip
                      label={`Search: ${search}`}
                      onDelete={() => setSearch('')}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {department && (
                    <Chip
                      label={`Dept: ${department}`}
                      onDelete={() => setDepartment('')}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {location && (
                    <Chip
                      label={`Location: ${location}`}
                      onDelete={() => setLocation('')}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {jobTitle && (
                    <Chip
                      label={`Title: ${jobTitle}`}
                      onDelete={() => setJobTitle('')}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Stack>
              </Fade>
            )}
          </Stack>
        </Paper>
      </motion.div>

      {isLoading && !data ? (
        <PageLoader />
      ) : (
        <EmployeeList
          employees={data?.data || []}
          totalItems={data?.totalItems || 0}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
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
        message={`Are you sure you want to delete ${employeeToDelete?.firstName} ${employeeToDelete?.lastName}? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setEmployeeToDelete(null);
        }}
        confirmText="Delete"
        confirmColor="error"
        loading={deleteMutation.isPending}
      />
    </Box>
  );
};

export default EmployeeDirectory;