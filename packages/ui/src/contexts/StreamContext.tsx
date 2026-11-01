import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppEvent } from '../types-server';
import logger from '@/Logger';
import { serverUrl } from '@/lib/db';

type StreamStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

interface StreamContextType {
    status: StreamStatus;
    lastEvent: AppEvent | null;
    isConnected: boolean;
    subscribe: (callback: (event: AppEvent) => void) => () => void;
}

const StreamContext = createContext<StreamContextType | undefined>(undefined);

export const useStream = () => {
    const context = useContext(StreamContext);
    if (context === undefined) {
        throw new Error('useStream must be used within a StreamProvider');
    }
    return context;
};

export const useOptionalStream = () => {
    return useContext(StreamContext);
};

interface StreamProviderProps {
    children: ReactNode;
    url?: string;
}

export const StreamProvider: React.FC<StreamProviderProps> = ({ children, url }) => {
    const [status, setStatus] = useState<StreamStatus>('DISCONNECTED');
    const [lastEvent, setLastEvent] = useState<AppEvent | null>(null);
    const listenersRef = React.useRef<Set<(event: AppEvent) => void>>(new Set());

    const subscribe = React.useCallback((callback: (event: AppEvent) => void) => {
        listenersRef.current.add(callback);
        return () => listenersRef.current.delete(callback);
    }, []);

    useEffect(() => {
        let eventSource: EventSource | null = null;
        let reconnectTimer: NodeJS.Timeout | null = null;

        const connect = () => {
            setStatus('CONNECTING');

            const streamUrl = `${serverUrl}/api/stream`;

            try {
                eventSource = new EventSource(streamUrl);

                eventSource.onopen = () => {
                    setStatus('CONNECTED');
                    // Clear any pending reconnect
                    if (reconnectTimer) clearTimeout(reconnectTimer);
                };

                eventSource.onerror = (err) => {
                    setStatus('ERROR');
                    eventSource?.close();
                    // Auto-reconnect after 5s
                    reconnectTimer = setTimeout(() => {
                        connect();
                    }, 10000);
                };

                // Listen for 'connected' event (handshake)
                eventSource.addEventListener('connected', (e) => {
                    //const data = JSON.parse(e.data);
                });

                // Listen for specific event types
                // We listen to the generic 'app-update' if the server sends it,
                // OR specific kinds like 'cache', 'system' if the server sends named events.
                // The server implementation sends: event: event.kind ('cache', 'system', etc.)

                const handleEvent = (e: MessageEvent) => {
                    try {
                        const eventData: AppEvent = JSON.parse(e.data);

                        // 1. Notify listeners (synchronously/immediately)
                        listenersRef.current.forEach(listener => listener(eventData));

                        // 2. Update state (subject to React batching, useful for debug/simple UI)
                        setLastEvent(eventData);
                        // console.log('Stream event received', eventData);
                        // logger.debug('Stream event received', eventData);
                    } catch (err) {
                        logger.error('Failed to parse stream event', err);
                    }
                };

                // Add listeners for known event kinds
                eventSource.addEventListener('cache', handleEvent);
                eventSource.addEventListener('system', handleEvent);
                eventSource.addEventListener('chat', handleEvent);
                eventSource.addEventListener('other', handleEvent);

            } catch (err) {
                logger.error('Failed to initialize EventSource', err);
                setStatus('ERROR');
            }
        };

        connect();

        return () => {
            logger.info('Closing EventStream');
            eventSource?.close();
            if (reconnectTimer) clearTimeout(reconnectTimer);
        };
    }, []);

    return (
        <StreamContext.Provider value={{ status, lastEvent, isConnected: status === 'CONNECTED', subscribe }}>
            {children}
        </StreamContext.Provider>
    );
};
