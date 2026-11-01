import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import App from "./App";

// Check if we're running in Tauri environment
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

// Safe stringify for error handling
function safeStringifyError(obj: any): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return `[Serialization failed: ${e instanceof Error ? e.message : 'Unknown error'}] - Object type: ${typeof obj}`;
  }
}

let invoke: any;

// Safe invoke function that works in both Tauri and browser environments
const safeInvoke = (command: string, args?: any) => {
  if (isTauri && invoke) {
    return invoke(command, args);
  } else {
    console.log(`[Browser Mode] Would invoke: ${command}`, args);
    return Promise.resolve(null);
  }
};

// Only import Tauri APIs if we're in Tauri environment
if (isTauri) {
  import("@tauri-apps/api/core").then(module => {
    invoke = module.invoke;
  });
}

window.addEventListener('error', event => {
  const errorPayload = {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error ? event.error.stack : 'No stack available',
  };
  safeInvoke('log_error_to_console', { error: `[JavaScript Error] ${safeStringifyError(errorPayload)}` });
});

window.addEventListener('unhandledrejection', event => {
  const reason = event.reason || {};
  const errorPayload = {
    message: reason.message || 'Unhandled promise rejection',
    stack: reason.stack || 'No stack available',
    reason: String(reason)
  };
  safeInvoke('log_error_to_console', { error: `[Unhandled Promise Rejection] ${safeStringifyError(errorPayload)}` });
});

// Hijack console.log to send messages to the Rust backend (only in Tauri mode)
if (isTauri) {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.log = (...args: any[]) => {
    // Call the original console.log so messages still appear in the browser devtools
    originalConsoleLog(...args);
    
    // Format the arguments into a single string
    const message = args.map(arg => typeof arg === 'object' ? safeStringifyError(arg) : String(arg)).join(' ');
    
    // Send the message to the Rust backend (with delay to ensure invoke is loaded)
    setTimeout(() => {
      safeInvoke('log_error_to_console', { error: `[WebView CONSOLE.LOG]: ${message}` });
    }, 100);
  };

  console.error = (...args: any[]) => {
    // Call the original console.error so messages still appear in the browser devtools
    originalConsoleError(...args);
    
    // Format the arguments into a single string
    const message = args.map(arg => typeof arg === 'object' ? safeStringifyError(arg) : String(arg)).join(' ');
    
    // Send the message to the Rust backend (with delay to ensure invoke is loaded)
    setTimeout(() => {
      safeInvoke('log_error_to_console', { error: `[WebView CONSOLE.ERROR]: ${message}` });
    }, 100);
  };

  console.warn = (...args: any[]) => {
    // Call the original console.warn so messages still appear in the browser devtools
    originalConsoleWarn(...args);
    
    // Format the arguments into a single string
    const message = args.map(arg => typeof arg === 'object' ? safeStringifyError(arg) : String(arg)).join(' ');
    
    // Send the message to the Rust backend (with delay to ensure invoke is loaded)
    setTimeout(() => {
      safeInvoke('log_error_to_console', { error: `[WebView CONSOLE.WARN]: ${message}` });
    }, 100);
  };
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
