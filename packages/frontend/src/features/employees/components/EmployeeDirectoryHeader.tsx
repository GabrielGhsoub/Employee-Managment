import { memo } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  Paper,
  IconButton,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface EmployeeDirectoryHeaderProps {
  totalItems: number;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  isLoading: boolean;
  onAddEmployee: () => void;
  onRefresh: () => void;
  onClearFilters: () => void;
}

const EmployeeDirectoryHeader = memo(({
  totalItems,
  hasActiveFilters,
  activeFilterCount,
  isLoading,
  onAddEmployee,
  onRefresh,
  onClearFilters,
}: EmployeeDirectoryHeaderProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
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
              label={`${totalItems} employees`}
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
                onDelete={onClearFilters}
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
          <IconButton 
            onClick={onRefresh} 
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
          
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={onAddEmployee}
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
  );
});

EmployeeDirectoryHeader.displayName = 'EmployeeDirectoryHeader';

export default EmployeeDirectoryHeader;