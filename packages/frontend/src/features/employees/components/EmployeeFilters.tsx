import { memo } from 'react';
import {
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
  Button,
  Badge,
  useTheme,
  useMediaQuery,
  alpha,
  Collapse,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  FilterAlt as FilterAltIcon,
} from '@mui/icons-material';

interface FilterOptions {
  departments: string[];
  locations: string[];
  titles: string[];
}

interface EmployeeFiltersProps {
  search: string;
  department: string;
  location: string;
  jobTitle: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  viewMode: 'grid' | 'list';
  showFilters: boolean;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  filterOptions: FilterOptions;
  onSearchChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onJobTitleChange: (value: string) => void;
  onSortByChange: (value: string) => void;
  onSortOrderChange: (value: 'ASC' | 'DESC') => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onToggleFilters: () => void;
  onClearFilters: () => void;
}

const EmployeeFilters = memo(({
  search,
  department,
  location,
  jobTitle,
  sortBy,
  sortOrder,
  viewMode,
  showFilters,
  hasActiveFilters,
  activeFilterCount,
  filterOptions,
  onSearchChange,
  onDepartmentChange,
  onLocationChange,
  onJobTitleChange,
  onSortByChange,
  onSortOrderChange,
  onViewModeChange,
  onToggleFilters,
  onClearFilters,
}: EmployeeFiltersProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
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
            onChange={(e) => onSearchChange(e.target.value)}
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
                    onClick={() => onSearchChange('')}
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
                onClick={onToggleFilters}
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
                onClick={() => onViewModeChange('grid')}
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
                onClick={() => onViewModeChange('list')}
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
                onChange={(e: SelectChangeEvent) => onDepartmentChange(e.target.value)}
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
                onChange={(e: SelectChangeEvent) => onLocationChange(e.target.value)}
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
                onChange={(e: SelectChangeEvent) => onJobTitleChange(e.target.value)}
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
                onChange={(e: SelectChangeEvent) => onSortByChange(e.target.value)}
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
                onChange={(e: SelectChangeEvent) => onSortOrderChange(e.target.value as 'ASC' | 'DESC')}
              >
                <MenuItem value="ASC">A → Z</MenuItem>
                <MenuItem value="DESC">Z → A</MenuItem>
              </Select>
            </FormControl>

            {hasActiveFilters && (
              <Button
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                onClick={onClearFilters}
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
                onDelete={() => onSearchChange('')}
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
                onDelete={() => onDepartmentChange('')}
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
                onDelete={() => onLocationChange('')}
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
                onDelete={() => onJobTitleChange('')}
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
                  onSortByChange('firstName');
                  onSortOrderChange('ASC');
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
  );
});

EmployeeFilters.displayName = 'EmployeeFilters';

export default EmployeeFilters;