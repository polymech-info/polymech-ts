import { tauriApi } from './tauriApi';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMessage {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

interface LogState {
  isIpcReady: boolean;
  pendingMessages: LogMessage[];
  localMessages: LogMessage[];
  onMessage?: (message: LogMessage) => void;
}

const logState: LogState = {
  isIpcReady: false,
  pendingMessages: [],
  localMessages: [],
};

/**
 * Set the IPC ready state and flush pending messages
 */
export function setIpcReady(ready: boolean) {
  logState.isIpcReady = ready;
  
  if (ready && logState.pendingMessages.length > 0) {
    info(`🔄 IPC ready, flushing ${logState.pendingMessages.length} pending messages`);
    
    // Flush all pending messages to backend
    logState.pendingMessages.forEach(msg => {
      sendToBackend(msg);
    });
    
    logState.pendingMessages = [];
  }
}

/**
 * Set callback for local message handling (e.g., UI updates)
 */
export function setMessageCallback(callback: (message: LogMessage) => void) {
  logState.onMessage = callback;
}

/**
 * Get current log state for debugging
 */
export function getLogState() {
  return {
    ...logState,
    pendingCount: logState.pendingMessages.length,
    localCount: logState.localMessages.length,
  };
}

/**
 * Safely serialize data to prevent circular references
 */
function safeStringify(obj: any, maxDepth = 3): any {
  const seen = new WeakSet();
  
  function serialize(value: any, depth: number): any {
    if (depth > maxDepth) {
      return '[Max depth reached]';
    }
    
    if (value === null || value === undefined) {
      return value;
    }
    
    if (typeof value !== 'object') {
      return value;
    }
    
    if (seen.has(value)) {
      return '[Circular Reference]';
    }
    
    seen.add(value);
    
    if (Array.isArray(value)) {
      return value.slice(0, 10).map((item, index) => {
        if (index >= 10) return '[Truncated]';
        return serialize(item, depth + 1);
      });
    }
    
    const result: any = {};
    const keys = Object.keys(value).slice(0, 20); // Limit keys
    
    for (const key of keys) {
      try {
        result[key] = serialize(value[key], depth + 1);
      } catch (e) {
        result[key] = '[Serialization Error]';
      }
    }
    
    if (Object.keys(value).length > 20) {
      result['[truncated]'] = `${Object.keys(value).length - 20} more keys...`;
    }
    
    return result;
  }
  
  try {
    return serialize(obj, 0);
  } catch (e) {
    return { error: 'Serialization failed', type: typeof obj };
  }
}

/**
 * Send message to backend via IPC
 */
async function sendToBackend(message: LogMessage) {
  try {
    // Safely serialize data to prevent circular reference issues
    const safeData = message.data ? safeStringify(message.data) : message.data;
    
    await tauriApi.addDebugMessage(message.message, message.level, safeData);
  } catch (error) {
    console.warn('Failed to send log message to backend:', error);
    // Don't create infinite loop by logging this error
  }
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, data?: any) {
  const timestamp = new Date().toLocaleTimeString();
  const logMessage: LogMessage = { level, message, data, timestamp };
  
  // Always log to console for immediate visibility
  const consoleMethod = level === 'error' ? 'error' : 
                       level === 'warn' ? 'warn' :
                       level === 'debug' ? 'debug' : 'log';
  
  const prefix = {
    info: '✅',
    warn: '⚠️', 
    error: '❌',
    debug: '🔍'
  }[level];
  
  // Safely log to console
  if (data) {
    try {
      const safeData = safeStringify(data);
      console[consoleMethod](`${prefix} [${timestamp}] ${message}`, safeData);
    } catch (e) {
      console[consoleMethod](`${prefix} [${timestamp}] ${message} [Data serialization failed]`);
    }
  } else {
    console[consoleMethod](`${prefix} [${timestamp}] ${message}`);
  }
  
  // Store locally for UI
  logState.localMessages.push(logMessage);
  // Keep only last 100 messages
  if (logState.localMessages.length > 100) {
    logState.localMessages = logState.localMessages.slice(-100);
  }
  
  // Notify UI callback if set
  if (logState.onMessage) {
    logState.onMessage(logMessage);
  }
  
  // Send to backend if IPC is ready
  if (logState.isIpcReady) {
    sendToBackend(logMessage);
  } else {
    // Queue for later if IPC not ready
    logState.pendingMessages.push(logMessage);
    // Prevent memory issues - keep only last 50 pending messages
    if (logState.pendingMessages.length > 50) {
      logState.pendingMessages = logState.pendingMessages.slice(-50);
    }
  }
}

/**
 * Logging functions with different levels
 */
export function info(message: string, data?: any) {
  log('info', message, data);
}

export function warn(message: string, data?: any) {
  log('warn', message, data);
}

export function error(message: string, data?: any) {
  log('error', message, data);
}

export function debug(message: string, data?: any) {
  log('debug', message, data);
}

/**
 * Get all local messages for UI display
 */
export function getLocalMessages(): LogMessage[] {
  return [...logState.localMessages];
}

/**
 * Clear all local messages
 */
export function clearLocalMessages() {
  logState.localMessages = [];
  if (logState.onMessage) {
    // Notify UI that messages were cleared
    info('Debug messages cleared');
  }
}

/**
 * Initialize logging system
 */
export function initLogging() {
  info('🚀 Logging system initialized');
  debug('Log state:', getLogState());
}

/**
 * Default export with all logging functions
 */
const logger = {
  info,
  warn, 
  error,
  debug,
  setIpcReady,
  setMessageCallback,
  getLocalMessages,
  clearLocalMessages,
  getLogState,
  initLogging
};

export default logger;
