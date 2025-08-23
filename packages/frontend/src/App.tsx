import { Container, Box } from '@mui/material';
import AppRoutes from './routes';

function App() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ my: { xs: 1, sm: 2, md: 4 }, px: { xs: 2, sm: 0 } }}>
        <AppRoutes />
      </Box>
    </Container>
  );
}

export default App;
