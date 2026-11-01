import React from 'react';
import { tauriApi } from '../lib/tauriApi';
import log from '../lib/log';

// Safe JSON stringify to prevent circular reference crashes
function safeStringify(obj: any, maxDepth = 3): string {
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
    return JSON.stringify(serialize(obj, 0), null, 2);
  } catch (e) {
    return `[Serialization failed: ${e instanceof Error ? e.message : 'Unknown error'}]`;
  }
}

interface DebugPanelProps {
  debugMessages: any[];
  sendIPCMessage: (messageType: string, data: any) => void;
  clearDebugMessages: () => void;
  ipcInitialized: boolean;
  messageToSend: string;
  setMessageToSend: (message: string) => void;
  sendMessageToImages: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
  debugMessages,
  sendIPCMessage,
  clearDebugMessages,
  ipcInitialized,
  messageToSend,
  setMessageToSend,
  sendMessageToImages,
}) => {
  return (
    <div className="w-full mt-12">
      <div className="glass-card p-6 glass-shimmer shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold accent-text">Debug Panel</h2>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                try {
                  // Get all relevant paths and store info
                  const dataDir = tauriApi.isTauri() 
                    ? await tauriApi.path.appDataDir()
                    : 'N/A (not in Tauri)';
                  const storePath = tauriApi.isTauri() && dataDir !== 'N/A (not in Tauri)'
                    ? await tauriApi.path.join(dataDir, '.kbot-gui.json')
                    : 'N/A';
                  
                  log.info('System Info & Store Paths', {
                    platform: navigator.platform,
                    userAgent: navigator.userAgent,
                    isTauri: tauriApi.isTauri(),
                    dataDir,
                    storePath,
                    cwd: 'Available in Node.js only',
                    timestamp: new Date().toISOString(),
                    windowLocation: window.location.href
                  });
                } catch (error) {
                  log.error('Failed to get system info', { error: (error as Error).message });
                }
              }}
              className="glass-button text-sm px-4 py-2 rounded-lg"
            >
              Test Info
            </button>
            <button
              onClick={() => log.error('Test error message')}
              className="glass-button text-sm px-4 py-2 rounded-lg border-red-400/50 text-red-600 hover:bg-red-500/20"
            >
              Test Error
            </button>
            <button
              onClick={() => sendIPCMessage('test-message', { content: 'Hello from GUI', timestamp: Date.now() })}
              className="glass-button text-sm px-4 py-2 rounded-lg border-blue-400/50 text-blue-600 hover:bg-blue-500/20"
            >
              Send IPC
            </button>
            <button
              onClick={clearDebugMessages}
              className="glass-button text-sm px-4 py-2 rounded-lg border-gray-400/50 text-gray-600 hover:bg-gray-500/20"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="glass-card max-h-96 overflow-y-auto">
          {debugMessages.length === 0 ? (
            <div className="p-4 text-center text-slate-500 dark:text-slate-400">
              No debug messages yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
              {debugMessages.map((msg, index) => (
                <div key={index} className={`p-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 ${msg.isIPC ? 'border-l-4 border-blue-400 bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold uppercase ${msg.isIPC ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-300' : msg.level === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : msg.level === 'warn' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : msg.level === 'debug' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                          {msg.isIPC ? '📨 IPC' : msg.level}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{msg.timestamp}</span>
                        {msg.isIPC && msg.data?.id && (
                          <span className="text-xs text-blue-500 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/20 px-1 rounded font-mono">
                            {msg.data.id.split('_').pop()}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-700 dark:text-slate-300 mb-1">{msg.message}</div>
                      {msg.data && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded font-mono max-h-40 overflow-y-auto">
                          {safeStringify(msg.data)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 glass-card p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold accent-text">Send Message to images.ts</h3>
            <span className={`text-xs text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800/50 px-2 py-1 rounded ${ipcInitialized ? 'text-green-600' : 'text-red-600'}`}>
              {ipcInitialized ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
          <div className="flex gap-3">
            <textarea
              value={messageToSend}
              onChange={(e) => setMessageToSend(e.target.value)}
              placeholder="Type a message to send to images.ts process..."
              className="flex-1 glass-input p-3 rounded-lg min-h-[80px] resize-none text-sm"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  sendMessageToImages();
                }
              }}
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={sendMessageToImages}
                disabled={!messageToSend.trim()}
                className="glass-button px-4 py-2 rounded-lg border-blue-400/50 text-blue-600 hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                title="Send message (Ctrl+Enter)"
              >
                📤 Send
              </button>
              <button
                onClick={() => {
                  setMessageToSend('Hello from GUI!');
                }}
                className="glass-button px-4 py-2 rounded-lg border-green-400/50 text-green-600 hover:bg-green-500/20 text-xs"
                title="Quick test message"
              >
                Test
              </button>
              <button
                onClick={() => {
                  const echoMsg = `Echo: ${Date.now()}`;
                  setMessageToSend(echoMsg);
                  setTimeout(() => sendMessageToImages(), 100);
                }}
                className="glass-button px-4 py-2 rounded-lg border-orange-400/50 text-orange-600 hover:bg-orange-500/20 text-xs"
                title="Send echo test"
              >
                Echo
              </button>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            💡 Press <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">Ctrl+Enter</kbd> to send quickly
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
