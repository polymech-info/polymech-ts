import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import logger from '@/Logger';

// Lazy-loaded modbusService reference
type ModbusServiceType = typeof import('@/services/modbusService').default;

const getModbusService = async (): Promise<ModbusServiceType> => {
  const mod = await import('@/services/modbusService');
  return mod.default;
};

export type WsStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR' | 'RECONNECTING';

interface WebSocketContextType {
  isConnected: boolean;
  isConnecting: boolean;
  wsStatus: WsStatus;
  apiUrl: string;
  setApiUrl: (url: string) => void;
  connectToServer: (url?: string) => Promise<boolean>;
  disconnectFromServer: () => void;
  abortConnectionAttempt: () => void;
  addListener: (handler: (msg: any) => void) => void;
  removeListener: (handler: (msg: any) => void) => void;
  sendCommand: (command: string, payload?: object) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
  url?: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, url: initialUrl = '' }) => {
  const [apiUrl, setApiUrl] = useState<string>(initialUrl);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setConnecting] = useState<boolean>(false);
  const [wsStatus, setWsStatus] = useState<WsStatus>('DISCONNECTED');
  const [connectionAborted, setConnectionAborted] = useState<boolean>(false);
  const modbusRef = useRef<ModbusServiceType | null>(null);

  const ensureModbus = useCallback(async () => {
    if (!modbusRef.current) {
      modbusRef.current = await getModbusService();
    }
    return modbusRef.current;
  }, []);

  const handleWsStatusChange = useCallback((status: WsStatus) => {
    setWsStatus(status);
    setIsConnected(status === 'CONNECTED');

    if (status === 'CONNECTED') {
      setConnecting(false);
    } else {
      if (status === 'ERROR') {
        setConnecting(false);
      } else if (status === 'RECONNECTING') {
        setConnecting(true);
      } else if (status === 'DISCONNECTED') {
        setConnecting(false);
      }
    }
  }, []);

  const disconnectWebSocket = useCallback(async (intentional: boolean = true) => {
    const svc = await ensureModbus();
    svc.disconnect(intentional);
  }, [ensureModbus]);

  const connectWebSocket = useCallback(async (urlToConnect: string): Promise<boolean> => {
    if (!urlToConnect) {
      logger.error('API URL not set');
      return false;
    }
    let wsUrl: string;
    try {
      const url = new URL(urlToConnect);
      if (url.protocol === 'http:') {
        url.protocol = 'ws:';
      } else if (url.protocol === 'https:') {
        url.protocol = 'wss:';
      }

      if (!url.pathname.endsWith('/ws')) {
        url.pathname = url.pathname.replace(/\/+$/, '') + '/ws';
      }

      wsUrl = url.toString();
    } catch (error) {
      logger.logError(error, 'Invalid API URL');
      return false;
    }

    try {
      const svc = await ensureModbus();
      const newConnectionEstablished = await svc.connect(
        wsUrl,
        handleWsStatusChange,
      );
      return newConnectionEstablished;
    } catch (error) {
      //  logger.logError(error, '[ModbusContext] modbusService.connect() failed');
      return false;
    }
  }, [handleWsStatusChange, ensureModbus]);

  const abortConnectionAttempt = useCallback(() => {
    setConnectionAborted(true);
    setConnecting(false);
    disconnectWebSocket(true);
  }, [disconnectWebSocket]);

  const connectToServer = useCallback(async (urlToUse?: string): Promise<boolean> => {
    const raw = urlToUse ?? apiUrl;
    const targetUrl =
      raw || (typeof window !== 'undefined' ? window.location.origin : '');

    if (urlToUse && urlToUse !== apiUrl) {
      setApiUrl(targetUrl);
    }

    setConnectionAborted(false);
    setConnecting(true);
    try {
      const didConnect = await connectWebSocket(targetUrl);

      if (didConnect) {

      } else {
        const svc = await ensureModbus();
        if (svc.getConnectionStatus() === 'CONNECTED') {

        } else {

        }
      }

      const svc = modbusRef.current!;
      const isNowConnected = svc.getConnectionStatus() === 'CONNECTED';
      setConnecting(false);
      return isNowConnected;

    } catch (error: any) {
      //   logger.logError(error, '[ModbusContext] Error in connectToServer');
      setIsConnected(false);
      setConnecting(false);
      return false;
    }
  }, [apiUrl, connectWebSocket, ensureModbus]);

  const disconnectFromServer = useCallback((): void => {
    setConnectionAborted(true);
    setIsConnected(false);
    disconnectWebSocket(true);
  }, [disconnectWebSocket]);

  // Initial connection effect (same-origin when initialUrl is empty)
  useEffect(() => {
    const base =
      initialUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    if (base && !isConnected && !isConnecting && !connectionAborted) {
      connectToServer(base);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl]);

  const listeners = useRef<Array<(msg: any) => void>>([]);

  const addListener = useCallback((handler: (msg: any) => void) => {
    if (!listeners.current.includes(handler)) {
      listeners.current.push(handler);
    }
  }, []);

  const removeListener = useCallback((handler: (msg: any) => void) => {
    listeners.current = listeners.current.filter(l => l !== handler);
  }, []);

  // Sync contextual generic handlers with ModbusService underlying instance
  useEffect(() => {
    let unsubscribeStats: (() => void) | undefined;

    // We register a wildcard type or just specific types directly against modbusService
    // Because AdminPage listens for `sys-stats`, we map it here:
    // This is slightly opinionated, but `modbusService` expects string typing.
    ensureModbus().then(svc => {
      unsubscribeStats = svc.addMessageHandler('sys-stats', (data: any) => {
        // AdminPage expects the whole message (with type), so reconstruct it:
        const msg = { type: 'sys-stats', stats: data?.stats || data, pings: data?.pings };
        listeners.current.forEach(l => l(msg));
      });
    });

    return () => {
      if (unsubscribeStats) unsubscribeStats();
    };
  }, [ensureModbus]);

  const sendCommand = useCallback((command: string, payload: object = {}) => {
    ensureModbus().then(svc => {
      svc.sendCommand(command, payload).catch(() => { /* fire-and-forget */ });
    });
  }, [ensureModbus]);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        isConnecting,
        wsStatus,
        apiUrl,
        setApiUrl,
        connectToServer,
        disconnectFromServer,
        abortConnectionAttempt,
        addListener,
        removeListener,
        sendCommand,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
