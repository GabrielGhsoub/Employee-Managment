import { memo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Stack,
  Avatar,
  Tooltip,
  TablePagination,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import type { Employee } from '../types';
import EmployeeCard from './EmployeeCard';

interface EmployeeListProps {
  employees: Employee[];
  totalItems: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  viewMode: 'grid' | 'list';
  isLoading?: boolean;
}

const EmployeeList = memo(function EmployeeList({
  employees,
  totalItems,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete,
  viewMode,
  isLoading = false,
}: EmployeeListProps) {
  const theme = useTheme();

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    onPageChange(newPage);
  }, [onPageChange]);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
    onPageChange(0);
  }, [onPageChange, onRowsPerPageChange]);

  const getInitials = useCallback((firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }, []);

  const getAvatarColor = useCallback((name: string) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.error.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      theme.palette.success.main,
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }, [theme.palette]);

  const renderSkeletons = useCallback(() => {
    const skeletonCount = Math.min(rowsPerPage, 8);
    return Array.from(new Array(skeletonCount)).map((_, index) => (
      <Box key={`skeleton-${index}`}>
        <Card sx={{ height: '100%' }}>
          <Skeleton variant="rectangular" height={180} />
          <CardContent>
            <Skeleton variant="text" sx={{ fontSize: '1.5rem' }} />
            <Skeleton variant="text" />
            <Skeleton variant="text" />
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Skeleton variant="rounded" width={80} height={24} />
              <Skeleton variant="rounded" width={80} height={24} />
            </Stack>
          </CardContent>
        </Card>
      </Box>
    ));
  }, [rowsPerPage]);

  const renderGridView = () => (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: { xs: 2, sm: 2.5, md: 3 },
      width: '100%',
    }}>
      {isLoading && employees.length === 0 ? (
        renderSkeletons()
      ) : (
        employees.map((employee) => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </Box>
  );

  const renderListView = () => (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Table sx={{ minWidth: { xs: 300, sm: 650 } }}>
        <TableHead>
          <TableRow>
            <TableCell>Employee</TableCell>
            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Job Title</TableCell>
            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Department</TableCell>
            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Location</TableCell>
            <TableCell>Contact</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading && employees.length === 0 ? (
            Array.from(new Array(rowsPerPage)).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell><Skeleton /></TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}><Skeleton /></TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Skeleton /></TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}><Skeleton /></TableCell>
                <TableCell><Skeleton /></TableCell>
                <TableCell><Skeleton /></TableCell>
              </TableRow>
            ))
          ) : (
            employees.map((employee) => (
              <TableRow
                key={employee.id}
                hover
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={employee.pictureUrl}
                      sx={{
                        bgcolor: getAvatarColor(employee.firstName),
                        width: 40,
                        height: 40,
                      }}
                    >
                      {!employee.pictureUrl && getInitials(employee.firstName, employee.lastName)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {employee.firstName} {employee.lastName}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: { xs: 'none', sm: 'block' },
                        }}
                      >
                        {employee.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{employee.jobTitle}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{employee.department}</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{employee.location}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title={employee.email}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `mailto:${employee.email}`;
                        }}
                        sx={{
                          color: theme.palette.primary.main,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                          },
                        }}
                      >
                        <EmailIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {employee.phone && (
                      <Tooltip title={employee.phone}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `tel:${employee.phone}`;
                          }}
                          sx={{
                            color: theme.palette.success.main,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.success.main, 0.1),
                            },
                          }}
                        >
                          <PhoneIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(employee);
                        }}
                        sx={{
                          color: theme.palette.info.main,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                          },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(employee);
                        }}
                        sx={{
                          color: theme.palette.error.main,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.error.main, 0.1),
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ width: '100%' }}>
      {viewMode === 'grid' ? renderGridView() : renderListView()}

      <TablePagination
        component="div"
        count={totalItems}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[6, 12, 24, 48]}
        sx={{
          mt: 3,
          borderTop: `1px solid ${theme.palette.divider}`,
          // [CHANGE] Simplified and improved pagination styles for responsiveness
          '.MuiTablePagination-toolbar': {
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
            py: 1,
            px: 2,
            [theme.breakpoints.up('sm')]: {
              justifyContent: 'flex-end',
            },
          },
          '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
            margin: 0,
          },
          '.MuiTablePagination-spacer': {
            display: 'none',
          },
          '.MuiTablePagination-actions': {
            marginLeft: { sm: 2 },
          },
        }}
      />
    </Box>
  );
});

EmployeeList.displayName = 'EmployeeList';

export default EmployeeList;