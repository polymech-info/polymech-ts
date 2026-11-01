import { useState, useEffect, useRef } from 'react';
import { LogEntry } from '@/contexts/LogContext';

export type LogSource = 'system' | 'images' | 'videos';

interface ServerLogRaw {
    level: number | string;
    time?: number | string;
    timestamp?: string; // Sometimes pino uses timestamp
    msg?: string;
    message?: string;
    [key: string]: any;
}

const mapLevel = (level: number | string): LogEntry['level'] => {
    if (typeof level === 'string') {
        const l = level.toLowerCase();
        if (l === 'error' || l === 'err') return 'error';
        if (l === 'warn' || l === 'warning') return 'warning';
        if (l === 'debug') return 'debug';
        return 'info';
    }
    if (level >= 50) return 'error';
    if (level >= 40) return 'warning';
    return 'info';
};

const mapLog = (raw: ServerLogRaw): LogEntry => {
    return {
        id: `${Date.now()}-${Math.random()}`, // simplistic ID
        timestamp: raw.time ? new Date(raw.time) : (raw.timestamp ? new Date(raw.timestamp) : new Date()),
        level: mapLevel(raw.level),
        message: raw.msg || raw.message || JSON.stringify(raw),
        category: 'server'
    };
};

export const useServerLogs = (source: LogSource) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    // Fetch initial history
    useEffect(() => {
        setLogs([]);
        const url = source === 'system' ? '/api/logs/system' : '/api/images/logs';

        fetch(url)
            .then(async res => {
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    return res.json();
                } else {
                    const text = await res.text();
                    console.error('Expected JSON but got:', text.substring(0, 100));
                    throw new Error('Response was not JSON');
                }
            })
            .then((data: ServerLogRaw[]) => {
                if (Array.isArray(data)) {
                    setLogs(data.map(mapLog));
                }
            })
            .catch(err => console.error('Failed to load logs', err));
    }, [source]);

    // Stream
    useEffect(() => {
        const url = source === 'system' ? '/api/logs/system/stream' : '/api/images/logs/stream';
        const es = new EventSource(url);

        es.onopen = () => setIsConnected(true);
        es.onerror = () => setIsConnected(false); // standard reconnection logic usually handled by variable state

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'info' || data.type === 'error') {
                    // System messages
                    return;
                }
                const newLog = mapLog(data);
                setLogs(prev => [...prev, newLog]);
            } catch (e) {
                // ignore non-json
            }
        };

        return () => {
            es.close();
            setIsConnected(false);
        };
    }, [source]);

    return { logs, isConnected, clearLogs: () => setLogs([]) };
};
