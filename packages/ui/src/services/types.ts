export type WsStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR' | 'RECONNECTING';

export interface LogEntry {
    logId: number;
    timestamp: number;
    level: string;
    message: string;
    id?: number;
    name?: string;
}


