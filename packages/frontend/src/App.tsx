import { Container, Box } from '@mui/material';
import AppRoutes from './routes';

function App() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <AppRoutes />
      </Box>
    </Container>
  );
}

export default App;
