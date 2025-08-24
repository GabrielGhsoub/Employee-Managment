import {
  Box,
  Typography,
  Button,
  Paper,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface ErrorFallbackProps {
  error?: Error;
  onRetry?: () => void;
  title?: string;
  message?: string;
}

const ErrorFallback = ({
  error,
  onRetry,
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
}: ErrorFallbackProps) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          maxWidth: 500,
          width: '100%',
          textAlign: 'center',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.error.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ErrorIcon
              sx={{
                fontSize: 32,
                color: theme.palette.error.main,
              }}
            />
          </Box>
        </Box>

        <Typography variant="h6" fontWeight="600" gutterBottom>
          {title}
        </Typography>

        <Typography variant="body2" color="text.secondary" paragraph>
          {message}
        </Typography>

        {process.env.NODE_ENV === 'development' && error && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              mt: 2,
              p: 2,
              bgcolor: alpha(theme.palette.error.main, 0.05),
              borderRadius: 1,
              fontFamily: 'monospace',
              textAlign: 'left',
              fontSize: '0.75rem',
            }}
          >
            {error.message}
          </Typography>
        )}

        {onRetry && (
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
            sx={{ mt: 3 }}
          >
            Try Again
          </Button>
        )}
      </Paper>
    </Box>
  );
};

export default ErrorFallback;