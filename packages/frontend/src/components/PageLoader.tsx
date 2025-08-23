import { Box, Typography, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';

interface PageLoaderProps {
  message?: string;
}

const PageLoader = ({ message = 'Loading...' }: PageLoaderProps) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 3,
      }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.5,
          ease: 'easeOut',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Outer rotating ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
            }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                border: `3px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                borderTop: `3px solid ${theme.palette.primary.main}`,
              }}
            />
          </motion.div>

          {/* Middle rotating ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
            }}
          >
            <Box
              sx={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                border: `3px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                borderTop: `3px solid ${theme.palette.secondary.main}`,
              }}
            />
          </motion.div>

          {/* Inner pulsing circle */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.5)}`,
              }}
            />
          </motion.div>
        </Box>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.5,
        }}
      >
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{
            fontWeight: 300,
            letterSpacing: 1,
          }}
        >
          {message}
        </Typography>
      </motion.div>

      {/* Animated dots */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: index * 0.1,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: theme.palette.primary.main,
                opacity: 0.7,
              }}
            />
          </motion.div>
        ))}
      </Box>
    </Box>
  );
};

export default PageLoader;