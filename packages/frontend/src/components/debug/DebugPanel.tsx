import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { logger } from '../../lib/logger';

interface DebugPanelProps {
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const DebugPanel = ({ open, onClose }: DebugPanelProps) => {
  const [tab, setTab] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  useEffect(() => {
    if (open) {
      refreshLogs();
    }
  }, [open]);

  const refreshLogs = () => {
    const allLogs = logger.getLogs(undefined, 500);
    setLogs(allLogs);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesText = filter
      ? log.message.toLowerCase().includes(filter.toLowerCase()) ||
        JSON.stringify(log.data).toLowerCase().includes(filter.toLowerCase())
      : true;
    
    const matchesLevel = levelFilter ? log.level === levelFilter : true;
    
    return matchesText && matchesLevel;
  });

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return 'error';
      case 'warn': return 'warning';
      case 'info': return 'info';
      case 'debug': return 'default';
      default: return 'default';
    }
  };

  const SystemInfo = () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>System Information</Typography>
      <List dense>
        <ListItem>
          <ListItemText primary="User Agent" secondary={navigator.userAgent} />
        </ListItem>
        <ListItem>
          <ListItemText primary="URL" secondary={window.location.href} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Screen Resolution" secondary={`${window.screen.width}x${window.screen.height}`} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Viewport" secondary={`${window.innerWidth}x${window.innerHeight}`} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Local Storage Available" secondary={localStorage ? 'Yes' : 'No'} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Environment" secondary={import.meta.env.MODE} />
        </ListItem>
      </List>
    </Paper>
  );

  const LogsTab = () => (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Filter logs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <TextField
          size="small"
          select
          placeholder="Level"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          SelectProps={{ native: true }}
          sx={{ minWidth: 100 }}
        >
          <option value="">All</option>
          <option value="error">Error</option>
          <option value="warn">Warn</option>
          <option value="info">Info</option>
          <option value="debug">Debug</option>
        </TextField>
        <Button startIcon={<RefreshIcon />} onClick={refreshLogs}>
          Refresh
        </Button>
        <Button startIcon={<ClearIcon />} onClick={() => logger.clearLogs()}>
          Clear
        </Button>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Showing {filteredLogs.length} of {logs.length} logs
      </Typography>

      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        {filteredLogs.map((log, index) => (
          <Paper key={index} sx={{ mb: 1, p: 2 }} variant="outlined">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip size="small" label={log.level.toUpperCase()} color={getLogColor(log.level) as any} />
              <Typography variant="caption" color="text.secondary">
                {new Date(log.timestamp).toLocaleString()}
              </Typography>
              {log.component && (
                <Chip size="small" label={log.component} variant="outlined" />
              )}
            </Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {log.message}
            </Typography>
            {log.data && (
              <Box>
                <Typography variant="caption" color="text.secondary">Data:</Typography>
                <pre style={{ 
                  fontSize: '0.75rem', 
                  backgroundColor: 'rgba(0,0,0,0.1)', 
                  padding: '8px', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              </Box>
            )}
            {log.stack && (
              <Box>
                <Typography variant="caption" color="text.secondary">Stack:</Typography>
                <pre style={{ 
                  fontSize: '0.6rem', 
                  backgroundColor: 'rgba(255,0,0,0.1)', 
                  padding: '8px', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '150px'
                }}>
                  {log.stack}
                </pre>
              </Box>
            )}
          </Paper>
        ))}
      </Box>
    </Box>
  );

  const ActionsTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Debug Actions</Typography>
      <List>
        <ListItem>
          <Button 
            variant="outlined" 
            fullWidth 
            startIcon={<DownloadIcon />}
            onClick={() => logger.downloadLogs()}
          >
            Download All Logs
          </Button>
        </ListItem>
        <ListItem>
          <Button 
            variant="outlined" 
            fullWidth 
            color="warning"
            startIcon={<ClearIcon />}
            onClick={() => {
              logger.clearLogs();
              setLogs([]);
            }}
          >
            Clear All Logs
          </Button>
        </ListItem>
        <ListItem>
          <Button 
            variant="outlined" 
            fullWidth
            onClick={() => {
              logger.info('Manual test log', { test: true, timestamp: new Date().toISOString() });
              refreshLogs();
            }}
          >
            Test Log Entry
          </Button>
        </ListItem>
        <ListItem>
          <Button 
            variant="outlined" 
            fullWidth
            color="error"
            onClick={() => {
              logger.error('Manual test error', { 
                test: true, 
                error: 'This is a test error',
                stack: new Error('Test error').stack 
              });
              refreshLogs();
            }}
          >
            Test Error Log
          </Button>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Debug Panel
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)}>
            <Tab label="Logs" />
            <Tab label="System Info" />
            <Tab label="Actions" />
          </Tabs>
        </Box>
        
        <TabPanel value={tab} index={0}>
          <LogsTab />
        </TabPanel>
        
        <TabPanel value={tab} index={1}>
          <SystemInfo />
        </TabPanel>
        
        <TabPanel value={tab} index={2}>
          <ActionsTab />
        </TabPanel>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DebugPanel;