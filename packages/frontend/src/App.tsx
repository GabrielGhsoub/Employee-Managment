import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import AppRoutes from './routes';
import DebugPanel from './components/debug/DebugPanel';
import { logger } from './lib/logger';

function App() {
  const [debugOpen, setDebugOpen] = useState(false);

  useEffect(() => {
    // Keyboard shortcut to open debug panel: Ctrl+Shift+D (or Cmd+Shift+D on Mac)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setDebugOpen(true);
        logger.info('Debug panel opened via keyboard shortcut');
      }
    };

    // Add global access to logger and debug panel for production debugging
    (window as any).__DEBUG__ = {
      openPanel: () => setDebugOpen(true),
      logger,
      getLogs: () => logger.getLogs(),
      downloadLogs: () => logger.downloadLogs(),
      clearLogs: () => logger.clearLogs(),
      test: () => {
        logger.info('Debug test successful', { timestamp: new Date().toISOString(), test: true });
        console.log('✅ Logger test completed. Use __DEBUG__.getLogs() to see logs or __DEBUG__.openPanel() to open debug panel');
        return 'Logger is working! Check console or use __DEBUG__.getLogs()';
      },
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      delete (window as any).__DEBUG__;
    };
  }, []);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      width: '100%',
      bgcolor: 'background.default',
      p: { xs: 1, sm: 2, md: 3 }
    }}>
      <AppRoutes />
      <DebugPanel open={debugOpen} onClose={() => setDebugOpen(false)} />
    </Box>
  );
}

export default App;
