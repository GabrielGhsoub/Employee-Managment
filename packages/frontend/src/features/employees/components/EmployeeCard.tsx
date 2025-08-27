import { memo, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Chip,
  Stack,
  Avatar,
  Tooltip,
  Box,
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
import { safeStopPropagation } from '../../../lib/utils';

interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

const EmployeeCard = memo(({ employee, onEdit, onDelete }: EmployeeCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const getInitials = useCallback((firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }, []);

  const getAvatarColor = useCallback((name: string) => {
    const colors = [
      '#1976d2',
      '#dc004e',
      '#d32f2f',
      '#ed6c02',
      '#0288d1',
      '#2e7d32',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }, []);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    safeStopPropagation(e);
    onEdit(employee);
  }, [employee, onEdit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    safeStopPropagation(e);
    onDelete(employee);
  }, [employee, onDelete]);

  const handleEmailClick = useCallback(() => {
    window.location.href = `mailto:${employee.email}`;
  }, [employee.email]);

  const handlePhoneClick = useCallback(() => {
    if (employee.phone) {
      window.location.href = `tel:${employee.phone}`;
    }
  }, [employee.phone]);

  return (
    <Card
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        borderRadius: 2,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out',
        boxShadow: isHovered ? '0px 4px 20px rgba(0,0,0,0.1)' : '0px 2px 10px rgba(0,0,0,0.05)',
        border: `1px solid ${isHovered ? '#42a5f5' : 'transparent'}`,
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0px 8px 30px rgba(0,0,0,0.15)',
          borderColor: '#1976d2',
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
              background: `linear-gradient(135deg, ${alpha(getAvatarColor(employee.firstName || 'A'), 0.1)} 0%, ${alpha(getAvatarColor(employee.lastName || 'B'), 0.1)} 100%)`,
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                fontSize: '2rem',
                bgcolor: getAvatarColor(employee.firstName || 'A'),
                boxShadow: '0px 2px 10px rgba(0,0,0,0.1)',
                fontWeight: 600,
              }}
            >
              {getInitials(employee.firstName || 'A', employee.lastName || 'B')}
            </Avatar>
          </Box>
        )}

        {isHovered && (
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
                onClick={handleEdit}
                sx={{
                  bgcolor: alpha('#fff', 0.9),
                  backdropFilter: 'blur(8px)',
                  '&:hover': {
                    bgcolor: '#1976d2',
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
                onClick={handleDelete}
                sx={{
                  bgcolor: alpha('#fff', 0.9),
                  backdropFilter: 'blur(8px)',
                  '&:hover': {
                    bgcolor: '#d32f2f',
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
            <WorkIcon sx={{ fontSize: 16, color: 'rgba(0, 0, 0, 0.6)', flexShrink: 0 }} />
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
            <BusinessIcon sx={{ fontSize: 16, color: 'rgba(0, 0, 0, 0.6)', flexShrink: 0 }} />
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
            <LocationIcon sx={{ fontSize: 16, color: 'rgba(0, 0, 0, 0.6)', flexShrink: 0 }} />
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
              onClick={handleEmailClick}
              sx={{
                cursor: 'pointer',
                fontSize: '0.75rem',
                height: 28,
                borderColor: alpha('#1976d2', 0.3),
                color: '#1976d2',
                '&:hover': {
                  bgcolor: alpha('#1976d2', 0.08),
                  borderColor: '#1976d2',
                },
                '& .MuiChip-icon': {
                  fontSize: 16,
                  color: '#1976d2',
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
                onClick={handlePhoneClick}
                sx={{
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  height: 28,
                  borderColor: alpha('#2e7d32', 0.3),
                  color: '#2e7d32',
                  '&:hover': {
                    bgcolor: alpha('#2e7d32', 0.08),
                    borderColor: '#2e7d32',
                  },
                  '& .MuiChip-icon': {
                    fontSize: 16,
                    color: '#2e7d32',
                  },
                }}
              />
            </Tooltip>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
});

EmployeeCard.displayName = 'EmployeeCard';

export default EmployeeCard;