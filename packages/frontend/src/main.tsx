import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';

import App from './App';
import './index.css';
import { logger } from './lib/logger';

// Initialize logger (this will set up global error handlers)
logger.info('Application starting', {
  userAgent: navigator.userAgent,
  url: window.location.href,
  timestamp: new Date().toISOString(),
});

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <CssBaseline />
          <App />
        </SnackbarProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);