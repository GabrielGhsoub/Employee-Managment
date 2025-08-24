import { Box } from '@mui/material';
import AppRoutes from './routes';

function App() {
  return (
    <Box sx={{ 
      minHeight: '100vh',
      width: '100%',
      bgcolor: 'background.default',
      p: { xs: 1, sm: 2, md: 3 }
    }}>
      <AppRoutes />
    </Box>
  );
}

export default App;
