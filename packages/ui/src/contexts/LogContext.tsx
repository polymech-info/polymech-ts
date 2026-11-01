import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'debug' | 'warning' | 'error' | 'success';
  message: string;
  category?: string;
  data?: any;
}

interface LogContextType {
  logs: LogEntry[];
  addLog: (level: LogEntry['level'], message: string, category?: string) => void;
  clearLogs: () => void;
  isLoggerVisible: boolean;
  setLoggerVisible: (visible: boolean) => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export const useLog = () => {
  const context = useContext(LogContext);
  if (!context) {
    throw new Error('useLog must be used within a LogProvider');
  }
  return context;
};

interface LogProviderProps {
  children: ReactNode;
}

export const LogProvider: React.FC<LogProviderProps> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoggerVisible, setLoggerVisible] = useState(false);

  const addLog = useCallback((level: LogEntry['level'], message: string, category?: string) => {
    const newLog: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      category,
    };
    setLogs(prev => [...prev, newLog]);
    console.log(`[LOG] ${message}`, newLog);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <LogContext.Provider value={{ logs, addLog, clearLogs, isLoggerVisible, setLoggerVisible }}>
      {children}
    </LogContext.Provider>
  );
};

