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
  Fade,
  Zoom,
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
import { motion, AnimatePresence } from 'framer-motion';
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

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (index: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: index * 0.05,
        duration: 0.3,
        type: 'spring' as const,
        stiffness: 100,
      },
    }),
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2,
      },
    },
  };

  const renderSkeletons = () => {
    return Array.from(new Array(rowsPerPage)).map((_, index) => (
      <Box key={`skeleton-${index}`}>
        <Card sx={{ height: '100%' }}>
          <Skeleton variant="rectangular" height={200} />
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
      gridTemplateColumns: {
        xs: '1fr',
        sm: 'repeat(auto-fill, minmax(280px, 1fr))',
        md: 'repeat(auto-fill, minmax(300px, 1fr))'
      }, 
      gap: { xs: 2, sm: 3 } 
    }}>
      {isLoading && employees.length === 0 ? (
        renderSkeletons()
      ) : (
        <AnimatePresence mode="popLayout">
          {employees.map((employee, index) => (
            <Box key={employee.id}>
              <motion.div
                custom={index}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={cardVariants}
                whileHover="hover"
                layout
                onHoverStart={() => setHoveredCard(employee.id)}
                onHoverEnd={() => setHoveredCard(null)}
                style={{ height: '100%' }}
              >
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'visible',
                    borderRadius: 3,
                    background: hoveredCard === employee.id
                      ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
                      : theme.palette.background.paper,
                    transition: 'all 0.3s ease',
                    boxShadow: hoveredCard === employee.id
                      ? '0 10px 30px rgba(0,0,0,0.3)'
                      : theme.shadows[2],
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      borderRadius: '12px 12px 0 0',
                      opacity: hoveredCard === employee.id ? 1 : 0,
                      transition: 'opacity 0.3s ease',
                    },
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    {employee.pictureUrl ? (
                      <CardMedia
                        component="img"
                        height="200"
                        image={employee.pictureUrl}
                        alt={`${employee.firstName} ${employee.lastName}`}
                        sx={{
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 200,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `linear-gradient(135deg, ${alpha(getAvatarColor(employee.firstName), 0.2)} 0%, ${alpha(getAvatarColor(employee.lastName), 0.3)} 100%)`,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 80,
                            height: 80,
                            fontSize: '2rem',
                            bgcolor: getAvatarColor(employee.firstName),
                          }}
                        >
                          {getInitials(employee.firstName, employee.lastName)}
                        </Avatar>
                      </Box>
                    )}
                    
                    <Fade in={hoveredCard === employee.id}>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          display: 'flex',
                          gap: 1,
                        }}
                      >
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => onEdit(employee)}
                            sx={{
                              bgcolor: alpha(theme.palette.background.paper, 0.9),
                              '&:hover': {
                                bgcolor: theme.palette.primary.main,
                                color: 'white',
                              },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => onDelete(employee)}
                            sx={{
                              bgcolor: alpha(theme.palette.background.paper, 0.9),
                              '&:hover': {
                                bgcolor: theme.palette.error.main,
                                color: 'white',
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Fade>
                  </Box>

                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      {employee.firstName} {employee.lastName}
                    </Typography>
                    
                    <Stack spacing={0.5}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WorkIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {employee.jobTitle}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {employee.department}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {employee.location}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
                      <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                        <Tooltip title={employee.email}>
                          <Chip
                            icon={<EmailIcon />}
                            label="Email"
                            size="small"
                            variant="outlined"
                            onClick={() => window.location.href = `mailto:${employee.email}`}
                            sx={{
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                borderColor: theme.palette.primary.main,
                              },
                            }}
                          />
                        </Tooltip>
                      </Zoom>
                      {employee.phone && (
                        <Zoom in={true} style={{ transitionDelay: '200ms' }}>
                          <Tooltip title={employee.phone}>
                            <Chip
                              icon={<PhoneIcon />}
                              label="Call"
                              size="small"
                              variant="outlined"
                              onClick={() => window.location.href = `tel:${employee.phone}`}
                              sx={{
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                  borderColor: theme.palette.secondary.main,
                                },
                              }}
                            />
                          </Tooltip>
                        </Zoom>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>
          ))}
        </AnimatePresence>
      )}
    </Box>
  );

  const renderListView = () => (
    <TableContainer 
      component={Paper} 
      sx={{ 
        borderRadius: 2,
        overflowX: 'auto',
        maxWidth: '100%'
      }}
    >
      <Table sx={{ minWidth: { xs: 650, sm: 750 } }}>
        <TableHead>
          <TableRow>
            <TableCell>Employee</TableCell>
            <TableCell>Job Title</TableCell>
            <TableCell>Department</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Contact</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading && employees.length === 0 ? (
            Array.from(new Array(rowsPerPage)).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell><Skeleton /></TableCell>
                <TableCell><Skeleton /></TableCell>
                <TableCell><Skeleton /></TableCell>
                <TableCell><Skeleton /></TableCell>
                <TableCell><Skeleton /></TableCell>
                <TableCell><Skeleton /></TableCell>
              </TableRow>
            ))
          ) : (
            <AnimatePresence>
              {employees.map((employee, index) => (
                <TableRow
                  key={employee.id}
                  component={motion.tr}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}
                  onHoverStart={() => setHoveredCard(employee.id)}
                  onHoverEnd={() => setHoveredCard(null)}
                  sx={{ cursor: 'pointer' }}
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
                        <Typography variant="body1" fontWeight="medium">
                          {employee.firstName} {employee.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {employee.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{employee.jobTitle}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.location}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title={employee.email}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `mailto:${employee.email}`;
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
                          >
                            <PhoneIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(employee);
                          }}
                          sx={{
                            '&:hover': {
                              color: theme.palette.primary.main,
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
                            '&:hover': {
                              color: theme.palette.error.main,
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </AnimatePresence>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {viewMode === 'grid' ? renderGridView() : renderListView()}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
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
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
              mb: 0,
            },
            '.MuiTablePagination-toolbar': {
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1, sm: 0 },
              alignItems: { xs: 'stretch', sm: 'center' },
            },
          }}
        />
      </motion.div>
    </Box>
  );
});

EmployeeList.displayName = 'EmployeeList';

export default EmployeeList;