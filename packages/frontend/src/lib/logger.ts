interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
  stack?: string;
  url?: string;
  userAgent?: string;
  component?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs
  private isProduction = import.meta.env.PROD;

  constructor() {
    this.setupGlobalErrorHandlers();
    this.loadPersistedLogs();
  }

  private setupGlobalErrorHandlers() {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.error('Global Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        type: 'javascript-error',
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
        stack: event.reason?.stack,
        type: 'promise-rejection',
      });
    });

    // Capture React Error Boundary errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Check if this is a React error boundary error
      const errorMessage = args.join(' ');
      if (errorMessage.includes('ErrorBoundary caught an error')) {
        this.error('React Error Boundary', {
          args,
          type: 'react-error-boundary',
        });
      }
      originalConsoleError.apply(console, args);
    };
  }

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    data?: any
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: this.sanitizeData(data),
      stack: data?.stack || new Error().stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      component: data?.component,
    };
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    try {
      // Handle circular references and convert to serializable format
      const seen = new Set();
      const sanitized = JSON.parse(JSON.stringify(data, (key, value) => {
        // Remove sensitive information
        if (key.toLowerCase().includes('password') || 
            key.toLowerCase().includes('token') || 
            key.toLowerCase().includes('secret')) {
          return '[REDACTED]';
        }
        
        // Handle circular references
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }
        
        // Handle undefined properties that might cause "Cannot read properties of undefined"
        if (value === undefined) {
          return '[undefined]';
        }
        
        return value;
      }));
      seen.clear();
      return sanitized;
    } catch (error) {
      return { 
        error: 'Failed to serialize log data', 
        originalType: typeof data,
        originalString: String(data)
      };
    }
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Persist to localStorage
    this.persistLogs();

    // In production, also log to console for immediate debugging
    if (this.isProduction) {
      const consoleMethod = console[entry.level] || console.log;
      consoleMethod(`[${entry.timestamp}] ${entry.message}`, entry.data);
    }
  }

  debug(message: string, data?: any) {
    const entry = this.createLogEntry('debug', message, data);
    this.addLog(entry);
  }

  info(message: string, data?: any) {
    const entry = this.createLogEntry('info', message, data);
    this.addLog(entry);
  }

  warn(message: string, data?: any) {
    const entry = this.createLogEntry('warn', message, data);
    this.addLog(entry);
  }

  error(message: string, data?: any) {
    const entry = this.createLogEntry('error', message, data);
    this.addLog(entry);

    // In production, try to send critical errors to backend
    if (this.isProduction) {
      this.sendToBackend([entry]);
    }
  }

  private persistLogs() {
    try {
      const recentLogs = this.logs.slice(-100); // Keep last 100 in localStorage
      localStorage.setItem('app-logs', JSON.stringify(recentLogs));
    } catch (error) {
      console.warn('Failed to persist logs to localStorage:', error);
    }
  }

  private loadPersistedLogs() {
    try {
      const stored = localStorage.getItem('app-logs');
      if (stored) {
        const parsedLogs = JSON.parse(stored);
        if (Array.isArray(parsedLogs)) {
          this.logs = parsedLogs;
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted logs:', error);
    }
  }

  private async sendToBackend(logs: LogEntry[]) {
    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send logs: ${response.status}`);
      }
    } catch (error) {
      console.warn('Failed to send logs to backend:', error);
    }
  }

  // Get logs for debugging
  getLogs(level?: LogEntry['level'], limit = 100): LogEntry[] {
    let filteredLogs = this.logs;

    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }

    return filteredLogs.slice(-limit);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    localStorage.removeItem('app-logs');
  }

  // Download logs as file for debugging
  downloadLogs() {
    const logsText = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([logsText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Enhanced React component error logging
  logComponentError(component: string, error: Error, errorInfo?: any) {
    this.error(`Component Error in ${component}`, {
      component,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
      type: 'component-error',
    });
  }

  // API error logging
  logApiError(url: string, method: string, status: number, response?: any) {
    this.error('API Error', {
      url,
      method,
      status,
      response,
      type: 'api-error',
    });
  }

  // User action logging
  logUserAction(action: string, data?: any) {
    this.info(`User Action: ${action}`, {
      ...data,
      type: 'user-action',
    });
  }
}

export const logger = new Logger();
export default logger;