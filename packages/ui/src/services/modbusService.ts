
/**
 * Interval in milliseconds for polling REST API endpoints 
 * (Coils, Registers, SystemInfo).
 */
export const REST_POLLING_INTERVAL_MS = 2000;

/**
 * WebSocket reconnect attempt interval in milliseconds.
 */
export const WS_RECONNECT_INTERVAL_MS = 5000;

/**
 * WebSocket register refresh interval in milliseconds.
 */
export const WS_REGISTER_REFRESH_INTERVAL_MS = 500;

// Add new constant for polling
export const WS_REGISTER_POLL_INTERVAL_MS = 2500; // Interval for polling all registers via WebSocket

// Add other constants here as needed 

export const WS_HEARTBEAT_INTERVAL_MS = 10000;
export const WS_HEARTBEAT_TIMEOUT_MS = 25000;

export type StatusChangeCallback = (status: WsStatus) => void;

const getLogLevelConsoleColor = (level: string): string => {
  switch (level) {
    case 'Fatal':
    case 'Error':
      return 'color: #ed4e4c; font-weight: bold;';
    case 'Warning':
      return 'color: #d2c057;';
    case 'Info':
      return 'color: #2774f0;';
    case 'Debug':
      return 'color: #01c800;';
    case 'Verbose':
      return 'color: #a142f4;';
    case 'Trace':
      return 'color: #898989;';
    default:
      return 'color: #cfd0d0;';
  }
};

let currentLogGroup = '';

const logToConsole = (log: any, levelMap: { [key: number]: string }) => {
  const { level, message, name, id, timestamp } = log;
  const levelStr = (typeof level === 'number' ? levelMap[level] : level) || 'Unknown';

  if (levelStr === 'Silent') return;

  const time = new Date(timestamp || Date.now()).toLocaleTimeString('en-GB');
  const levelColor = getLogLevelConsoleColor(levelStr);
  const componentInfo = name ? `${name}${id !== undefined ? `#${id}` : ''}` : 'System';

  // Only create a new group if the component has changed
  if (componentInfo !== currentLogGroup) {
    if (currentLogGroup !== '') {
      console.groupEnd(); // Close previous group
    }
    console.group(`%c[${componentInfo}]`, 'color: #e59e66; font-weight: bold;');
    currentLogGroup = componentInfo;
  }

  console.log(
    `%c${time} %c[${levelStr.toUpperCase()}] %c${message}`,
    'color: grey;',
    levelColor,
    'color: inherit;'
  );
};

import {

} from '../types';
import { WsStatus } from './types';

export type DisplayMessagePayload = {
  id: string | number;
  message: string;
  timestamp: number;
};

export interface LogOptions {
  mode?: 'append' | 'overwrite';
  format?: 'json' | 'html' | 'md';
}

export interface LogPayload {
  name: string;
  level?: string;
  message: any;
  options?: LogOptions;
  [key: string]: any;
}

enum LogLevel {
  SILENT = 0,
  FATAL,
  ERROR,
  WARNING,
  INFO,
  TRACE,
  VERBOSE
};

const LOG_LEVEL_MAP: { [key in LogLevel]: string } = {
  [LogLevel.SILENT]: 'Silent',
  [LogLevel.FATAL]: 'Fatal',
  [LogLevel.ERROR]: 'Error',
  [LogLevel.WARNING]: 'Warning',
  [LogLevel.INFO]: 'Info',
  [LogLevel.TRACE]: 'Trace',
  [LogLevel.VERBOSE]: 'Verbose',
};

class ModbusService {
  private ws: WebSocket | null = null;
  private wsUrl: string = '';
  private status: WsStatus = 'DISCONNECTED';
  private messageId: number = 0;
  private pendingRequests: Map<number, {
    resolve: Function;
    reject: Function;
    command: string;
    data?: any;
  }> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isIntentionalDisconnect: boolean = false;
  private isFetchingAllRegisters: boolean = false;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastMessageTimestamp: number = 0;
  private messageHandlers: Map<string, Set<(data: any) => void>> = new Map();


  constructor() { }

  // --- Connection Management ---
  public connect(
    wsUrl: string,
    onStatusChange: StatusChangeCallback,
  ): Promise<boolean> {
    if (this.ws && (this.status === 'CONNECTED' || this.status === 'CONNECTING' || this.status === 'RECONNECTING')) {
      if (this.status === 'CONNECTED') {
        console.log('WebSocket already connected.');
        return Promise.resolve(false);
      }
    }

    this.wsUrl = wsUrl;
    this.onStatusChange = onStatusChange;
    this.isIntentionalDisconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    return this.attemptConnection().then(() => true);
  }

  private attemptConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      // If we already have a valid/active connection or an ongoing connection attempt, abort this attempt
      if (this.ws) {
        const isOpen = this.ws.readyState === WebSocket.OPEN && this.status === 'CONNECTED';
        const isConnecting = this.ws.readyState === WebSocket.CONNECTING && (this.status === 'CONNECTING' || this.status === 'RECONNECTING');
        if (isOpen || isConnecting) {
          resolve();
          return;
        }
      }

      if (!this.wsUrl) {
        this.updateStatus('ERROR');
        reject(new Error('WebSocket URL is not set.'));
        return;
      }

      if (this.ws) {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        if (this.ws.readyState !== WebSocket.CLOSED && this.ws.readyState !== WebSocket.CLOSING) {
          this.ws.close();
        }
        this.ws = null;
      }

      const connectingState = (this.status === 'DISCONNECTED' || this.status === 'ERROR') ? 'CONNECTING' : 'RECONNECTING';
      this.updateStatus(connectingState);

      try {
        const newWs = new WebSocket(this.wsUrl);
        newWs.binaryType = 'arraybuffer'; // Enable binary messages
        this.ws = newWs;

        newWs.onopen = () => {
          this.updateStatus('CONNECTED');
          if ((window as any).markAppAsReady) {
            (window as any).markAppAsReady();
          }
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
          }
          this.startHeartbeat();
          resolve();
        };

        newWs.onmessage = (event) => {
          this.lastMessageTimestamp = Date.now();
          this.handleMessage(event.data);
        };
        newWs.onerror = (event: Event) => {
          console.error('WebSocket Error:', event);
          this.onSocketClosed(newWs, reject, event);
        }

        newWs.onclose = (event: Event) => this.onSocketClosed(newWs, reject, event);

      } catch (error) {

        console.error(`Failed to create WebSocket: ${error instanceof Error ? error.message : String(error)}`);
        this.updateStatus('ERROR');
        this.ws = null;
        reject(error);
      }
    });
  }

  private onSocketClosed(wsInstance: WebSocket, reject: (reason?: any) => void, event: Event) {
    if (this.ws !== wsInstance) {
      return;
    }

    const wasConnected = this.status === 'CONNECTED';

    let reason = 'Connection closed';
    let code: number | undefined;

    if (event instanceof CloseEvent) {
      reason = event.reason || 'No reason specified';
      code = event.code;
      console.log(`WebSocket Disconnected: ${reason} (Code: ${code})`);
    } else {
      console.error('WebSocket Error:', event);
      reason = 'Connection error';
    }

    this.ws = null;

    this.stopHeartbeat();
    const rejectionReason = this.isIntentionalDisconnect
      ? 'WebSocket disconnected intentionally'
      : 'WebSocket disconnected';
    this.rejectPendingRequests(rejectionReason);


    if (this.isIntentionalDisconnect) {
      this.updateStatus('DISCONNECTED');
      if (!wasConnected) {
        reject(new Error('WebSocket connection intentionally disconnected before opening.'));
      }
    } else {
      this.updateStatus('RECONNECTING');
      console.log(`WebSocket connection lost. Retrying in ${WS_RECONNECT_INTERVAL_MS / 1000} seconds...`);
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => this.attemptConnection(), WS_RECONNECT_INTERVAL_MS);

      if (!wasConnected) {
        reject(new Error(`WebSocket connection failed: ${reason}${code ? ` (Code: ${code})` : ''}`));
      }
    }
  }

  disconnect(intentional: boolean = true): void {
    console.log(`Disconnecting WebSocket (intentional: ${intentional})`);
    this.isIntentionalDisconnect = intentional;
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
    } else {
      console.log('No WebSocket connection to disconnect.');
      if (intentional && this.status !== 'DISCONNECTED') {
        this.updateStatus('DISCONNECTED');
      }
    }
  }
  private onStatusChange: StatusChangeCallback = () => { };
  private updateStatus(newStatus: WsStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.onStatusChange(newStatus);
    }
  }

  private rejectPendingRequests(reason: string): void {
    this.pendingRequests.forEach((req) => {
      req.reject(new Error(`${req.command} failed: ${reason}`));
    });
    this.pendingRequests.clear();
  }

  private startHeartbeat(): Promise<void> {

    this.stopHeartbeat();
    this.lastMessageTimestamp = Date.now();
    return new Promise((resolve, reject) => {
      this.heartbeatTimer = setInterval(async () => {
        if (Date.now() - this.lastMessageTimestamp > WS_HEARTBEAT_TIMEOUT_MS) {
          console.error('Heartbeat timeout. Connection lost.');
          this.disconnect(false); // Trigger reconnect
        } else {
          try {
            await this.sendRequest('ping');
            resolve();
          } catch (error) {
            console.error("Heartbeat get_sysinfo failed:", error);
            reject(error);
          }

        }
      }, WS_HEARTBEAT_INTERVAL_MS);
    });
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }



  // --- Message Handling ---
  private handleMessage(data: any): void {
    try {
      let response = null

      try {
        response = JSON.parse(data);
      } catch (error) {
        // console.error('Failed to parse WebSocket message or handle it:');
        return;
      }

      if (response.id !== undefined && this.pendingRequests.has(response.id)) {
        const request = this.pendingRequests.get(response.id)!;

        // Command specific handling if needed (mostly unnecessary if promise matches)
        if (request.command === 'get_coils' || request.command === 'get_registers') {
          // logic reserved
        }

        this.pendingRequests.delete(response.id);
        if (response.error) {
          console.error(`[handleMessage] Error response for command ${request.command} (ID: ${response.id}):`, response.error);
          request.reject(new Error(response.error));
        } else {
          request.resolve(response.data);
        }
      } else if (response.type && this.messageHandlers.has(response.type)) {
        // Check for registered generic handlers (e.g., layout-update)
        this.messageHandlers.get(response.type)?.forEach(handler => handler(response.data));
      } else {
        console.warn('Received unexpected WebSocket message format or type:', response);
      }
    } catch (error) {
      console.warn('Failed to parse WebSocket message or handle it:', data, error);
    }
  }
  private sendRequest<T>(command: string, payload: object = {}): Promise<T> {
    if (!this.ws || this.status !== 'CONNECTED') {
      const errorMsg = `[sendRequest] Cannot send command '${command}': WebSocket not connected or status is '${this.status}'. WS object: ${this.ws ? 'exists' : 'null'}.`;
      console.warn(errorMsg);
      return Promise.reject(new Error(errorMsg));
    }

    return new Promise((resolve, reject) => {
      const id = this.messageId++;
      const message = { ...payload, command, id };

      try {
        if (!this.ws) {
          const errorMsg = `[sendRequest] Critical Error: WebSocket is null just before send for command '${command}', ID: ${id}.`;
          console.error(errorMsg);
          return reject(new Error(errorMsg));
        }
        this.ws.send(JSON.stringify(message));
        this.pendingRequests.set(id, { resolve, reject, command, data: payload });
      } catch (error) {
        const errorMsg = `[sendRequest] WebSocket send error for command '${command}', ID: ${id}. Error: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMsg, error);
        reject(new Error(errorMsg));
      }
    });
  }
  // --- Public API Methods ---

  public getConnectionStatus(): WsStatus {
    return this.status;
  }


  // Generic method for sending custom websocket commands
  public async sendCommand<T>(command: string, payload: object = {}): Promise<T> {
    return this.sendRequest<T>(command, payload);
  }
  async writeRegister(address: number, value: number): Promise<void> {
    return this.sendRequest<void>('write_register', { address, value });
  }

  async requestCoils(): Promise<void> {
    if (this.status !== 'CONNECTED') {
      throw new Error('WebSocket not connected');
    }
    await this.sendRequest('get_coils');
  }

  async writeCoil(address: number, value: boolean): Promise<void> {
    if (this.status !== 'CONNECTED') {
      throw new Error('WebSocket not connected');
    }
    return this.sendRequest<void>('write_coil', { address, value });
  }

  async writeMultipleCoils(address: number, values: boolean[]): Promise<void> {
    if (this.status !== 'CONNECTED') {
      throw new Error('WebSocket not connected');
    }
    return this.sendRequest<void>('write_multiple_coils', { address, values });
  }

  async log(payload: LogPayload): Promise<void> {
    return this.sendRequest<void>('log', payload);
  }

  public addMessageHandler(type: string, handler: (data: any) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(type);
        }
      }
    };
  }
}
const modbusService = new ModbusService();
export default modbusService;
