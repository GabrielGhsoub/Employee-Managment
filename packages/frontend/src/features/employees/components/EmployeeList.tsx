import { memo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Chip,
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
  LocationOn as LocationIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import type { Employee } from '../types';

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

const EmployeeList = memo(({
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
}: EmployeeListProps) => {
  const theme = useTheme();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleChangePage = (_: unknown, newPage: number) => {
    onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
    onPageChange(0);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getAvatarColor = (name: string) => {
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
  };

  const renderSkeletons = () => {
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
  };

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
          <Card
            key={employee.id}
            onMouseEnter={() => setHoveredCard(employee.id)}
            onMouseLeave={() => setHoveredCard(null)}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              borderRadius: 2,
              transition: theme.transitions.create(['transform', 'box-shadow', 'border-color'], {
                duration: theme.transitions.duration.short,
                easing: theme.transitions.easing.easeInOut,
              }),
              boxShadow: hoveredCard === employee.id ? theme.shadows[4] : theme.shadows[1],
              border: `1px solid ${hoveredCard === employee.id ? theme.palette.primary.light : 'transparent'}`,
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: theme.shadows[8],
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            <Box sx={{ position: 'relative' }}>
              {employee.pictureUrl ? (
                <CardMedia
                  component="img"
                  height={180}
                  image={employee.pictureUrl}
                  alt={`${employee.firstName} ${employee.lastName}`}
                  sx={{
                    objectFit: 'cover',
                    objectPosition: 'center',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    height: 180,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${alpha(getAvatarColor(employee.firstName), 0.1)} 0%, ${alpha(getAvatarColor(employee.lastName), 0.1)} 100%)`,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      fontSize: '2rem',
                      bgcolor: getAvatarColor(employee.firstName),
                      boxShadow: theme.shadows[2],
                      fontWeight: 600,
                    }}
                  >
                    {getInitials(employee.firstName, employee.lastName)}
                  </Avatar>
                </Box>
              )}

              {hoveredCard === employee.id && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    display: 'flex',
                    gap: 0.5,
                  }}
                >
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(employee);
                      }}
                      sx={{
                        bgcolor: alpha(theme.palette.background.paper, 0.9),
                        backdropFilter: 'blur(8px)',
                        '&:hover': {
                          bgcolor: theme.palette.primary.main,
                          color: 'white',
                        },
                      }}
                    >
                      <EditIcon sx={{ fontSize: 18 }} />
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
                        bgcolor: alpha(theme.palette.background.paper, 0.9),
                        backdropFilter: 'blur(8px)',
                        '&:hover': {
                          bgcolor: theme.palette.error.main,
                          color: 'white',
                        },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>

            <CardContent sx={{
              flexGrow: 1,
              p: 2,
              '&:last-child': { pb: 2 }
            }}>
              <Typography
                variant="h6"
                gutterBottom
                fontWeight="600"
                sx={{
                  fontSize: '1.1rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  mb: 1.5,
                }}
              >
                {employee.firstName} {employee.lastName}
              </Typography>

              <Stack spacing={1} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WorkIcon sx={{ fontSize: 16, color: theme.palette.text.secondary, flexShrink: 0 }} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: '0.875rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {employee.jobTitle}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon sx={{ fontSize: 16, color: theme.palette.text.secondary, flexShrink: 0 }} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: '0.875rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {employee.department}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationIcon sx={{ fontSize: 16, color: theme.palette.text.secondary, flexShrink: 0 }} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: '0.875rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {employee.location}
                  </Typography>
                </Box>
              </Stack>

              <Stack
                direction="row"
                spacing={1}
                sx={{
                  mt: 'auto',
                }}
              >
                <Tooltip title={employee.email}>
                  <Chip
                    icon={<EmailIcon />}
                    label="Email"
                    size="small"
                    variant="outlined"
                    onClick={() => window.location.href = `mailto:${employee.email}`}
                    sx={{
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      height: 28,
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      color: theme.palette.primary.main,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        borderColor: theme.palette.primary.main,
                      },
                      '& .MuiChip-icon': {
                        fontSize: 16,
                        color: theme.palette.primary.main,
                      },
                    }}
                  />
                </Tooltip>
                {employee.phone && (
                  <Tooltip title={employee.phone}>
                    <Chip
                      icon={<PhoneIcon />}
                      label="Call"
                      size="small"
                      variant="outlined"
                      onClick={() => window.location.href = `tel:${employee.phone}`}
                      sx={{
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        height: 28,
                        borderColor: alpha(theme.palette.success.main, 0.3),
                        color: theme.palette.success.main,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.success.main, 0.08),
                          borderColor: theme.palette.success.main,
                        },
                        '& .MuiChip-icon': {
                          fontSize: 16,
                          color: theme.palette.success.main,
                        },
                      }}
                    />
                  </Tooltip>
                )}
              </Stack>
            </CardContent>
          </Card>
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
                onMouseEnter={() => setHoveredCard(employee.id)}
                onMouseLeave={() => setHoveredCard(null)}
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