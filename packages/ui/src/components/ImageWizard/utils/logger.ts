/**
 * Logger utility for ImageWizard
 * Provides a cleaner API for logging with automatic category prefixing
 */

import { LogEntry } from "@/contexts/LogContext";

export interface Logger {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warning: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  success: (message: string, ...args: any[]) => void;
  verbose: (message: string, ...args: any[]) => void; // Alias for debug
}

/**
 * Format log message with additional arguments
 */
const formatMessage = (message: string, args: any[]): string => {
  if (args.length === 0) return message;

  // Stringify additional arguments and append them
  const argsStr = args.map(arg => {
    if (typeof arg === 'string') return arg;
    if (arg instanceof Error) return arg.message;
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }).join(' ');

  return `${message} ${argsStr}`;
};

/**
 * Create a logger instance with a specific category
 * @param addLog The addLog function from LogContext
 * @param category Optional category prefix for all logs
 */
export const createLogger = (
  addLog: (level: LogEntry['level'], message: string, category?: string) => void,
  category?: string
): Logger => {
  return {
    debug: (message: string, ...args: any[]) => {
      const formattedMessage = formatMessage(message, args);
      addLog('debug', formattedMessage, category);
      console.debug(`[DEBUG] ${formattedMessage}`);
    },
    info: (message: string, ...args: any[]) => {
      const formattedMessage = formatMessage(message, args);
      addLog('info', formattedMessage, category);
      console.info(`[INFO] ${formattedMessage}`);
    },
    warning: (message: string, ...args: any[]) => {
      const formattedMessage = formatMessage(message, args);
      addLog('warning', formattedMessage, category);
      console.warn(`[WARN] ${formattedMessage}`);
    },
    error: (message: string, ...args: any[]) => {
      const formattedMessage = formatMessage(message, args);
      addLog('error', formattedMessage, category);
      console.error(`[ERROR] ${formattedMessage}`);
    },
    success: (message: string, ...args: any[]) => {
      const formattedMessage = formatMessage(message, args);
      addLog('success', formattedMessage, category);
      console.log(`[SUCCESS] ${formattedMessage}`);
    },
    verbose: (message: string, ...args: any[]) => {
      const formattedMessage = formatMessage(message, args);
      addLog('debug', formattedMessage, category);
      console.debug(`[DEBUG] ${formattedMessage}`);
    },
  };
};

/**
 * Create a scoped logger with a sub-category
 * @param logger Parent logger
 * @param addLog The addLog function from LogContext
 * @param subCategory Sub-category to append to parent category
 */
export const createScopedLogger = (
  addLog: (level: LogEntry['level'], message: string, category?: string) => void,
  category: string,
  subCategory: string
): Logger => {
  const fullCategory = `${category} > ${subCategory}`;
  return createLogger(addLog, fullCategory);
};
