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
export declare class IPCClient {
    private guiAppPath;
    private process;
    private messageHandlers;
    private counter;
    private isReady;
    constructor(guiAppPath: string);
    launch(args?: string[]): Promise<void>;
    private handleMessage;
    onMessage(type: string, handler: (message: IPCMessage) => void): void;
    sendMessage(message: IPCMessage): void;
    sendDebugMessage(level: DebugPayload['level'], message: string, data?: any): void;
    sendCounterMessage(count?: number, message?: string): void;
    sendImageMessage(base64: string, mimeType: string, filename?: string): void;
    sendInitData(prompt?: string, dst?: string, apiKey?: string, files?: string[]): void;
    sendIPCViaTauri(messageType: string, data: any): Promise<void>;
    waitForPromptSubmit(): Promise<PromptSubmitPayload | null>;
    close(): void;
}
export declare function getGuiAppPath(): string;
export declare function createIPCClient(): IPCClient;
