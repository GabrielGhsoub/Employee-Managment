import { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  IconButton,
  Box,
  Typography,
  Alert,
  Slide,
  InputAdornment,
  Avatar,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { motion, AnimatePresence } from 'framer-motion';
import type { TransitionProps } from '@mui/material/transitions';
import { forwardRef } from 'react';
import { createEmployee, updateEmployee } from '../../../api/employees';
import { employeeSchema, type Employee, type EmployeeFormData } from '../types';

interface EmployeeFormProps {
  open: boolean;
  onClose: () => void;
  employee?: Employee | null;
  onSuccess?: () => void;
}

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const EmployeeForm = ({ open, onClose, employee, onSuccess }: EmployeeFormProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const isEditMode = !!employee;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      pictureUrl: '',
      jobTitle: '',
      department: '',
      location: '',
    },
  });

  const pictureUrl = watch('pictureUrl');
  const firstName = watch('firstName');
  const lastName = watch('lastName');

  useEffect(() => {
    if (employee) {
      reset({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone || '',
        pictureUrl: employee.pictureUrl || '',
        jobTitle: employee.jobTitle,
        department: employee.department,
        location: employee.location,
      });
    } else {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        pictureUrl: '',
        jobTitle: '',
        department: '',
        location: '',
      });
    }
  }, [employee, reset]);

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      enqueueSnackbar('Employee created successfully', { variant: 'success' });
      onSuccess?.();
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      enqueueSnackbar(error.response?.data?.message || 'Failed to create employee', { variant: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      enqueueSnackbar('Employee updated successfully', { variant: 'success' });
      onSuccess?.();
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      enqueueSnackbar(error.response?.data?.message || 'Failed to update employee', { variant: 'error' });
    },
  });

  const onSubmit = (data: EmployeeFormData) => {
    if (isEditMode && employee) {
      updateMutation.mutate({ ...data, id: employee.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  const getInitials = (first: string, last: string) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'EM';
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      scroll="body"
      fullScreen={isMobile}
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 2 },
          overflow: 'hidden',
          // [CHANGE] Increased max height and width for better visibility
          maxHeight: { xs: '100vh', sm: '90vh' },
          margin: { xs: 0, sm: 1 },
          width: { xs: '100%', sm: 'min(700px, 90vw)' }
        },
      }}
    >
      <DialogTitle
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" fontWeight="bold">
            {isEditMode ? 'Edit Employee' : 'Add New Employee'}
          </Typography>
          <IconButton
            onClick={handleClose}
            disabled={isSubmitting}
            sx={{
              color: theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent
          sx={{
            pt: { xs: 1.5, sm: 2 },
            pb: { xs: 1.5, sm: 2 },
            px: { xs: 2, sm: 2.5 },
            overflowY: 'auto',
            maxHeight: { xs: 'calc(100vh - 140px)', sm: 'calc(90vh - 140px)' },
          }}
        >
          <Stack spacing={2}>
            {/* Avatar Preview */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <Avatar
                  src={pictureUrl}
                  sx={{
                    width: { xs: 70, sm: 80 },
                    height: { xs: 70, sm: 80 },
                    bgcolor: theme.palette.primary.main,
                    fontSize: { xs: '1.5rem', sm: '1.75rem' },
                    boxShadow: theme.shadows[2],
                  }}
                >
                  {!pictureUrl && firstName && lastName && getInitials(firstName, lastName)}
                </Avatar>
              </motion.div>
            </Box>

            <AnimatePresence mode="wait">
              {(errors.firstName || errors.lastName || errors.email) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Alert severity="error">
                    Please correct the errors below
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <Stack spacing={1.5}>
              {/* Personal Information */}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Personal Information
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 1.5, sm: 1.5 } }}>
                <Box>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="First Name"
                      error={!!errors.firstName}
                      helperText={errors.firstName?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
                </Box>

                <Box>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Last Name"
                      error={!!errors.lastName}
                      helperText={errors.lastName?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
                </Box>
              </Box>

              {/* Contact Information */}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 0.5 }}>
                Contact Information
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 1.5, sm: 1.5 } }}>
                <Box>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email"
                      type="email"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
                </Box>

                <Box>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone (Optional)"
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
                </Box>
              </Box>

              {/* Job Information */}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 0.5 }}>
                Job Information
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 1.5, sm: 1.5 } }}>
                <Box>
                <Controller
                  name="jobTitle"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Job Title"
                      error={!!errors.jobTitle}
                      helperText={errors.jobTitle?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <WorkIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
                </Box>

                <Box>
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Department"
                      error={!!errors.department}
                      helperText={errors.department?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
                </Box>
              </Box>

              <Controller
                  name="location"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Location"
                      error={!!errors.location}
                      helperText={errors.location?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />

              {/* Profile Picture */}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 0.5 }}>
                Profile Picture (Optional)
              </Typography>
                <Controller
                  name="pictureUrl"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Picture URL"
                      placeholder="https://example.com/photo.jpg"
                      error={!!errors.pictureUrl}
                      helperText={errors.pictureUrl?.message || 'Enter a valid image URL'}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ImageIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: { xs: 2, sm: 2.5 },
            py: { xs: 1.5, sm: 1.5 },
            borderTop: `1px solid ${theme.palette.divider}`,
            gap: 1,
            flexDirection: { xs: 'column-reverse', sm: 'row' },
          }}
        >
          <Button
            // [CHANGE] Updated button style
            variant="outlined"
            color="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            sx={{
              borderRadius: 2,
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !isDirty}
            sx={{
              borderRadius: 2,
              minWidth: 100,
              width: { xs: '100%', sm: 'auto' },
              // [CHANGE] Removed custom gradient styles for a cleaner look
            }}
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EmployeeForm;