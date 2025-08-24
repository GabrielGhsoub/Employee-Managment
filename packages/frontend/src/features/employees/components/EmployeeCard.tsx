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

interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

const EmployeeCard = memo(({ employee, onEdit, onDelete }: EmployeeCardProps) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);

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

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(employee);
  }, [employee, onEdit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
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
        transition: theme.transitions.create(['transform', 'box-shadow', 'border-color'], {
          duration: theme.transitions.duration.short,
          easing: theme.transitions.easing.easeInOut,
        }),
        boxShadow: isHovered ? theme.shadows[4] : theme.shadows[1],
        border: `1px solid ${isHovered ? theme.palette.primary.light : 'transparent'}`,
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
                onClick={handleDelete}
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
              onClick={handleEmailClick}
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
                onClick={handlePhoneClick}
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
  );
});

EmployeeCard.displayName = 'EmployeeCard';

export default EmployeeCard;