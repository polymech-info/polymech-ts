import { spawn, ChildProcess } from 'node:child_process';
import * as path from 'node:path';
import { sync as exists } from '@polymech/fs/exists';

export interface IPCMessage {
    type: 'counter' | 'debug' | 'image' | 'prompt_submit' | 'error' | 'init_data' | 'gui_message';
    data: any;
    timestamp?: number;
    id?: string;
}

export interface ImagePayload {
    base64: string;
    mimeType: string;
    filename?: string;
}

export interface PromptSubmitPayload {
    prompt: string;
    files: string[];
    dst: string;
}

export interface CounterPayload {
    count: number;
    message?: string;
}

export interface DebugPayload {
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    data?: any;
}

export interface InitDataPayload {
    prompt?: string;
    dst?: string;
    apiKey?: string;
    files?: string[];
}

export interface GuiMessagePayload {
    message: string;
    timestamp: number;
    source: string;
}

export class IPCClient {
    private process: ChildProcess | null = null;
    private messageHandlers: Map<string, (message: IPCMessage) => void> = new Map();
    private counter = 0;
    private isReady = false;

    constructor(private guiAppPath: string) {}

    async launch(args: string[] = []): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!exists(this.guiAppPath)) {
                return reject(new Error(`GUI application not found at: ${this.guiAppPath}`));
            }

            this.process = spawn(this.guiAppPath, args, { 
                stdio: ['pipe', 'pipe', 'pipe'] 
            });

            let output = '';
            let errorOutput = '';

            this.process.stdout?.on('data', (data) => {
                const chunk = data.toString();
                
                // Try to parse each line as a potential IPC message first
                const lines = chunk.split('\n').filter(line => line.trim());
                let hasIPCMessage = false;
                
                for (const line of lines) {
                    try {
                        const parsed = JSON.parse(line);
                        
                        // Check if it's a structured IPC message
                        if (parsed.type && parsed.data !== undefined) {
                            this.handleMessage(parsed as IPCMessage);
                            hasIPCMessage = true;
                        }
                        // Check if it's a raw GUI message (from console.log in browser mode)
                        else if (parsed.message && parsed.source === 'gui') {
                            const ipcMessage: IPCMessage = {
                                type: 'gui_message',
                                data: parsed,
                                timestamp: parsed.timestamp || Date.now(),
                                id: `gui_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                            };
                            this.handleMessage(ipcMessage);
                            hasIPCMessage = true;
                        }
                    } catch (e) {
                        // Not a JSON message, continue
                    }
                }
                
                // Only log non-IPC stdout (to avoid binary data spam)
                if (!hasIPCMessage && chunk.trim() && !chunk.includes('"base64"')) {
                    console.log('[IPC] GUI stdout:', chunk);
                }
                
                // Also check for GUI messages in stdout
                if (!hasIPCMessage && chunk.trim()) {
                    const lines = chunk.split('\n').filter(line => line.trim());
                    for (const line of lines) {
                        try {
                            const possibleMessage = JSON.parse(line);
                            if (possibleMessage.type === 'gui_message') {
                                this.handleMessage(possibleMessage);
                            }
                        } catch (e) {
                            // Not a JSON message, ignore
                        }
                    }
                }
                
                output += chunk;
            });

            this.process.stderr?.on('data', (data) => {
                const chunk = data.toString();
                console.log('[IPC] GUI stderr:', chunk);
                errorOutput += chunk;
            });

            this.process.on('close', (code) => {
                console.log('[IPC] GUI process closed with code:', code);
                if (code === 0) {
                    const trimmedOutput = output.trim();
                    resolve();
                } else {
                    reject(new Error(`Tauri app exited with code ${code}. stderr: ${errorOutput}`));
                }
            });

            this.process.on('error', (err) => {
                reject(err);
            });

            // Give the process a moment to start
            setTimeout(() => resolve(), 1000);
        });
    }

    private handleMessage(message: IPCMessage) {
        // Create a safe version for logging (without binary data)
        const safeMessage = { ...message };
        if (safeMessage.type === 'image' && safeMessage.data && typeof safeMessage.data === 'object' && 'base64' in safeMessage.data) {
            safeMessage.data = {
                ...safeMessage.data,
                base64: `[BASE64 DATA - ${(safeMessage.data.base64 as string).length} chars]`
            };
        }
        
        console.log('[IPC] Received message:', safeMessage);
        
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
            handler(message);
        } else {
            console.log('[IPC] No handler for message type:', message.type);
        }
    }

    onMessage(type: string, handler: (message: IPCMessage) => void) {
        this.messageHandlers.set(type, handler);
    }

    sendMessage(message: IPCMessage) {
        if (!this.process || !this.process.stdin) {
            console.error('[IPC] Cannot send message: process not available');
            return;
        }

        const messageWithMeta: IPCMessage = {
            ...message,
            timestamp: Date.now(),
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        const jsonMessage = JSON.stringify(messageWithMeta) + '\n';
        
        // Create a safe version for logging (without binary data)
        const safeMessage = { ...messageWithMeta };
        if (safeMessage.type === 'image' && safeMessage.data && typeof safeMessage.data === 'object' && 'base64' in safeMessage.data) {
            safeMessage.data = {
                ...safeMessage.data,
                base64: `[BASE64 DATA - ${(safeMessage.data.base64 as string).length} chars]`
            };
        }
        
        console.log('[IPC] Sending message:', JSON.stringify(safeMessage));
        
        this.process.stdin.write(jsonMessage);
    }

    sendDebugMessage(level: DebugPayload['level'], message: string, data?: any) {
        this.sendMessage({
            type: 'debug',
            data: { level, message, data } as DebugPayload
        });
    }

    sendCounterMessage(count?: number, message?: string) {
        if (count === undefined) {
            this.counter++;
            count = this.counter;
        }
        
        this.sendMessage({
            type: 'counter',
            data: { count, message } as CounterPayload
        });
    }

    sendImageMessage(base64: string, mimeType: string, filename?: string) {
        this.sendMessage({
            type: 'image',
            data: { base64, mimeType, filename } as ImagePayload
        });
    }

    sendInitData(prompt?: string, dst?: string, apiKey?: string, files?: string[]) {
        this.sendMessage({
            type: 'init_data',
            data: { prompt, dst, apiKey, files } as InitDataPayload
        });
    }

    // Send IPC message via Tauri command (when GUI is ready)
    async sendIPCViaTauri(messageType: string, data: any) {
        if (!this.process) {
            console.error('[IPC] Cannot send via Tauri: process not available');
            return;
        }

        // Send a special command to tell the GUI to forward this as an event
        const command = {
            type: 'tauri_command',
            command: 'forward_ipc_message',
            args: { messageType, data }
        };

        const jsonMessage = JSON.stringify(command) + '\n';
        console.log('[IPC] Sending Tauri command:', JSON.stringify({ ...command, args: { messageType, data: messageType === 'image' ? '[IMAGE DATA]' : data } }));
        this.process.stdin?.write(jsonMessage);
    }

    async waitForPromptSubmit(): Promise<PromptSubmitPayload | null> {
        return new Promise((resolve) => {
            this.onMessage('prompt_submit', (message) => {
                resolve(message.data as PromptSubmitPayload);
            });

            // Also handle the legacy format for backwards compatibility
            this.process?.on('close', (code) => {
                if (code === 0) {
                    // Try to parse the final output as legacy format
                    // This will be handled by the existing logic in images.ts
                    resolve(null);
                }
            });
        });
    }

    close() {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
    }
}

export function getGuiAppPath(): string {
    // Get the directory of this script file, then navigate to the GUI app
    const scriptDir = path.dirname(new URL(import.meta.url).pathname);
    // On Windows, URL.pathname can have an extra leading slash, so we need to handle it
    const cleanScriptDir = process.platform === 'win32' && scriptDir.startsWith('/') 
        ? scriptDir.substring(1) 
        : scriptDir;
    
    const packageRoot = path.resolve(cleanScriptDir, '..', '..');
    
    // Determine platform-specific subdirectory and executable name
    let platformDir: string;
    let executableName: string;
    
    switch (process.platform) {
        case 'win32':
            platformDir = 'win-64';
            executableName = 'tauri-app.exe';
            break;
        case 'darwin':
            platformDir = 'osx-64';
            executableName = 'tauri-app';
            break;
        case 'linux':
            platformDir = 'linux-64';
            executableName = 'tauri-app';
            break;
        default:
            throw new Error(`Unsupported platform: ${process.platform}`);
    }
    
    return path.join(packageRoot, 'dist', platformDir, executableName);
}

// Utility function to create and configure an IPC client
export function createIPCClient(): IPCClient {
    const guiAppPath = getGuiAppPath();
    return new IPCClient(guiAppPath);
}
