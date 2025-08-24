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
  IconButton,
  useTheme,
  alpha,
  Badge,
  useMediaQuery,
  Collapse,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { 
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  PersonAdd as PersonAddIcon,
  FilterAlt as FilterAltIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [sortBy, setSortBy] = useState('firstName');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const debouncedSearch = useDebounce(search, 500);

  // Build filter query for API
  const buildFilterQuery = () => {
    const filters: Record<string, string | undefined> = {};
    
    if (department) filters.department = department;
    if (location) filters.location = location;
    if (jobTitle) filters.title = jobTitle;
    
    return filters;
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['employees', {
      page: page + 1,
      limit: rowsPerPage,
      search: debouncedSearch,
      ...buildFilterQuery(),
      sortBy,
      sortOrder
    }],
    queryFn: () => getEmployees({
      page: page + 1,
      limit: rowsPerPage,
      search: debouncedSearch,
      ...buildFilterQuery(),
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
    setPage(0);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return !!(search || department || location || jobTitle || sortBy !== 'firstName' || sortOrder !== 'ASC');
  }, [search, department, location, jobTitle, sortBy, sortOrder]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search) count++;
    if (department) count++;
    if (location) count++;
    if (jobTitle) count++;
    if (sortBy !== 'firstName') count++;
    if (sortOrder !== 'ASC') count++;
    return count;
  }, [search, department, location, jobTitle, sortBy, sortOrder]);

  const filterOptions = useMemo(() => {
    if (!data?.data) return { departments: [], locations: [], titles: [] };
    
    // Get all employees for filter options (you might want to fetch this separately)
    const allEmployees = queryClient.getQueryData<typeof data>(['employees', {}])?.data || data.data;
    
    return {
      departments: [...new Set(allEmployees.map(e => e.department))].sort(),
      locations: [...new Set(allEmployees.map(e => e.location))].sort(),
      titles: [...new Set(allEmployees.map(e => e.jobTitle))].sort()
    };
  }, [data, queryClient]);

  // Use API data directly since filtering is done server-side
  const employees = data?.data || [];

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
        <Button 
          variant="contained" 
          onClick={() => refetch()}
          sx={{
            background: `linear-gradient(45deg, ${theme.palette.error.main} 30%, ${theme.palette.error.light} 90%)`,
            '&:hover': {
              background: `linear-gradient(45deg, ${theme.palette.error.dark} 30%, ${theme.palette.error.main} 90%)`,
            }
          }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: { xs: 2, sm: 3 },
          background: theme.palette.background.paper,
          borderRadius: { xs: 1, sm: 2 },
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          justifyContent="space-between" 
          alignItems={{ xs: 'flex-start', sm: 'center' }} 
          spacing={{ xs: 2, sm: 3 }}
        >
          <Box>
            <Typography 
              variant={isMobile ? 'h5' : 'h4'}
              component="h1"
              fontWeight="700" 
              gutterBottom
              sx={{
                color: theme.palette.text.primary,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
              }}
            >
              Employee Directory
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip 
                label={`${data?.totalItems || 0} employees`}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  fontWeight: 'medium',
                }}
              />
              {hasActiveFilters && (
                <Chip 
                  label={`${activeFilterCount} filters active`}
                  size="small"
                  onDelete={clearFilters}
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.dark,
                    fontWeight: 'medium',
                    '& .MuiChip-deleteIcon': {
                      color: theme.palette.warning.main,
                    }
                  }}
                />
              )}
            </Stack>
          </Box>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={1.5} 
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              alignSelf: { xs: 'stretch', sm: 'center' }
            }}
          >
            {/* Wrap disabled IconButton in span for Tooltip */}
            <span>
              <IconButton 
                onClick={() => refetch()} 
                disabled={isLoading}
                sx={{
                  minWidth: 40,
                  height: 40,
                  border: `1px solid ${theme.palette.divider}`,
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                  },
                  '&:disabled': {
                    borderColor: alpha(theme.palette.action.disabled, 0.2),
                  },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </span>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setFormOpen(true)}
              size={isMobile ? "medium" : "large"}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                px: { xs: 2, sm: 3 },
                py: { xs: 1, sm: 1.5 },
                width: { xs: '100%', sm: 'auto' },
                fontSize: { xs: '0.9rem', sm: '1rem' },
                fontWeight: 500,
                background: theme.palette.primary.main,
                '&:hover': {
                  background: theme.palette.primary.dark,
                }
              }}
            >
              Add Employee
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: { xs: 2, sm: 3 }, 
          borderRadius: { xs: 1, sm: 2 },
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack spacing={2}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            alignItems="stretch"
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by name, email, or any field..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        setSearch('');
                        setPage(0);
                      }}
                      sx={{
                        color: theme.palette.text.secondary,
                        '&:hover': {
                          color: theme.palette.error.main,
                        }
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { 
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  }
                }
              }}
              size={isMobile ? "small" : "medium"}
            />
            
            <Stack 
              direction="row" 
              spacing={1} 
              sx={{ 
                flexShrink: 0, 
                alignSelf: { xs: 'flex-end', sm: 'center' },
                justifyContent: { xs: 'flex-end', sm: 'center' }
              }}
            >
              <Badge badgeContent={activeFilterCount} color="warning">
                <IconButton
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{
                    minWidth: 40,
                    height: 40,
                    border: `1px solid ${showFilters ? theme.palette.primary.main : theme.palette.divider}`,
                    borderRadius: 1,
                    bgcolor: showFilters ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                    color: showFilters ? theme.palette.primary.main : theme.palette.text.secondary,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  <FilterAltIcon />
                </IconButton>
              </Badge>
              
              <Stack 
                direction="row" 
                sx={{ 
                  border: `1px solid ${theme.palette.divider}`, 
                  borderRadius: 1,
                  overflow: 'hidden',
                  height: 40,
                }}
              >
                <IconButton
                  onClick={() => setViewMode('grid')}
                  sx={{
                    borderRadius: 0,
                    minWidth: 40,
                    height: 40,
                    bgcolor: viewMode === 'grid' ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                    color: viewMode === 'grid' ? theme.palette.primary.main : theme.palette.text.secondary,
                    borderRight: `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.primary.main,
                    }
                  }}
                >
                  <GridViewIcon />
                </IconButton>
                <IconButton
                  onClick={() => setViewMode('list')}
                  sx={{
                    borderRadius: 0,
                    minWidth: 40,
                    height: 40,
                    bgcolor: viewMode === 'list' ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                    color: viewMode === 'list' ? theme.palette.primary.main : theme.palette.text.secondary,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.primary.main,
                    }
                  }}
                >
                  <ListViewIcon />
                </IconButton>
              </Stack>
            </Stack>
          </Stack>

          <Collapse in={showFilters}>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              sx={{ 
                pt: 2,
                pb: 1,
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              }}
            >
              <FormControl size={isMobile ? "small" : "medium"} sx={{ minWidth: { xs: '100%', sm: 180 } }}>
                <InputLabel>Department</InputLabel>
                <Select
                  value={department}
                  label="Department"
                  onChange={(e: SelectChangeEvent) => {
                    setDepartment(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">
                    <em>All Departments</em>
                  </MenuItem>
                  {filterOptions.departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size={isMobile ? "small" : "medium"} sx={{ minWidth: { xs: '100%', sm: 180 } }}>
                <InputLabel>Location</InputLabel>
                <Select
                  value={location}
                  label="Location"
                  onChange={(e: SelectChangeEvent) => {
                    setLocation(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">
                    <em>All Locations</em>
                  </MenuItem>
                  {filterOptions.locations.map((loc) => (
                    <MenuItem key={loc} value={loc}>
                      {loc}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size={isMobile ? "small" : "medium"} sx={{ minWidth: { xs: '100%', sm: 180 } }}>
                <InputLabel>Job Title</InputLabel>
                <Select
                  value={jobTitle}
                  label="Job Title"
                  onChange={(e: SelectChangeEvent) => {
                    setJobTitle(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">
                    <em>All Job Titles</em>
                  </MenuItem>
                  {filterOptions.titles.map((title) => (
                    <MenuItem key={title} value={title}>
                      {title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size={isMobile ? "small" : "medium"} sx={{ minWidth: { xs: '100%', sm: 140 } }}>
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
                  <MenuItem value="location">Location</MenuItem>
                  <MenuItem value="createdAt">Date Added</MenuItem>
                </Select>
              </FormControl>

              <FormControl size={isMobile ? "small" : "medium"} sx={{ minWidth: { xs: '100%', sm: 100 } }}>
                <InputLabel>Order</InputLabel>
                <Select
                  value={sortOrder}
                  label="Order"
                  onChange={(e: SelectChangeEvent) => setSortOrder(e.target.value as 'ASC' | 'DESC')}
                >
                  <MenuItem value="ASC">A → Z</MenuItem>
                  <MenuItem value="DESC">Z → A</MenuItem>
                </Select>
              </FormControl>

              {hasActiveFilters && (
                <Button
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  onClick={clearFilters}
                  startIcon={<ClearIcon />}
                  sx={{ 
                    borderRadius: 2,
                    borderColor: theme.palette.error.main,
                    color: theme.palette.error.main,
                    alignSelf: { xs: 'stretch', sm: 'center' },
                    '&:hover': {
                      borderColor: theme.palette.error.dark,
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                    }
                  }}
                >
                  Clear All
                </Button>
              )}
            </Stack>
          </Collapse>

          {hasActiveFilters && (
            <Stack 
              direction="row" 
              spacing={1} 
              flexWrap="wrap" 
              sx={{ 
                pt: 1,
                gap: 0.5,
              }}
            >
              {search && (
                <Chip
                  label={`Search: "${search}"`}
                  onDelete={() => setSearch('')}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: theme.palette.info.dark,
                    '& .MuiChip-deleteIcon': {
                      color: theme.palette.info.main,
                      '&:hover': {
                        color: theme.palette.info.dark,
                      }
                    }
                  }}
                />
              )}
              {department && (
                <Chip
                  label={`Dept: ${department}`}
                  onDelete={() => {
                    setDepartment('');
                    setPage(0);
                  }}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.dark,
                    '& .MuiChip-deleteIcon': {
                      color: theme.palette.primary.main,
                      '&:hover': {
                        color: theme.palette.primary.dark,
                      }
                    }
                  }}
                />
              )}
              {location && (
                <Chip
                  label={`Loc: ${location}`}
                  onDelete={() => {
                    setLocation('');
                    setPage(0);
                  }}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    color: theme.palette.secondary.dark,
                    '& .MuiChip-deleteIcon': {
                      color: theme.palette.secondary.main,
                      '&:hover': {
                        color: theme.palette.secondary.dark,
                      }
                    }
                  }}
                />
              )}
              {jobTitle && (
                <Chip
                  label={`Title: ${jobTitle}`}
                  onDelete={() => {
                    setJobTitle('');
                    setPage(0);
                  }}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.dark,
                    '& .MuiChip-deleteIcon': {
                      color: theme.palette.success.main,
                      '&:hover': {
                        color: theme.palette.success.dark,
                      }
                    }
                  }}
                />
              )}
              {(sortBy !== 'firstName' || sortOrder !== 'ASC') && (
                <Chip
                  label={`Sort: ${sortBy} (${sortOrder === 'ASC' ? 'A→Z' : 'Z→A'})`}
                  onDelete={() => {
                    setSortBy('firstName');
                    setSortOrder('ASC');
                  }}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.dark,
                    '& .MuiChip-deleteIcon': {
                      color: theme.palette.warning.main,
                      '&:hover': {
                        color: theme.palette.warning.dark,
                      }
                    }
                  }}
                />
              )}
            </Stack>
          )}
        </Stack>
      </Paper>

      {isLoading && !data ? (
        <PageLoader message="Loading employees..." />
      ) : (
        <EmployeeList
          employees={employees}
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