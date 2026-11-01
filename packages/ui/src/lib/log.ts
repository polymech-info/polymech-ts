// Logger system - stubbed for now
// This could be enhanced to show logs in a dev panel or send to a logging service

export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs

  private addLog(level: LogEntry['level'], message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data
    };

    this.logs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // For now, just console.log with prefixes
    const prefix = {
      debug: '🐛',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    }[level];

    if (data) {
      console[level](`${prefix} ${message}`, data);
    } else {
      console[level](`${prefix} ${message}`);
    }
  }

  debug(message: string, data?: any) {
    this.addLog('debug', message, data);
  }

  info(message: string, data?: any) {
    this.addLog('info', message, data);
  }

  warn(message: string, data?: any) {
    this.addLog('warn', message, data);
  }

  error(message: string, data?: any) {
    this.addLog('error', message, data);
  }

  // Get all logs (for dev panel)
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Clear all logs
  clearLogs() {
    this.logs = [];
    console.clear();
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

const log = new Logger();
export default log;
