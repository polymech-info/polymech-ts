import { spawn } from 'node:child_process';
import * as path from 'node:path';
import { sync as exists } from '@polymech/fs/exists';
export class IPCClient {
    guiAppPath;
    process = null;
    messageHandlers = new Map();
    counter = 0;
    isReady = false;
    constructor(guiAppPath) {
        this.guiAppPath = guiAppPath;
    }
    async launch(args = []) {
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
                            this.handleMessage(parsed);
                            hasIPCMessage = true;
                        }
                        // Check if it's a raw GUI message (from console.log in browser mode)
                        else if (parsed.message && parsed.source === 'gui') {
                            const ipcMessage = {
                                type: 'gui_message',
                                data: parsed,
                                timestamp: parsed.timestamp || Date.now(),
                                id: `gui_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                            };
                            this.handleMessage(ipcMessage);
                            hasIPCMessage = true;
                        }
                    }
                    catch (e) {
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
                        }
                        catch (e) {
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
                }
                else {
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
    handleMessage(message) {
        // Create a safe version for logging (without binary data)
        const safeMessage = { ...message };
        if (safeMessage.type === 'image' && safeMessage.data && typeof safeMessage.data === 'object' && 'base64' in safeMessage.data) {
            safeMessage.data = {
                ...safeMessage.data,
                base64: `[BASE64 DATA - ${safeMessage.data.base64.length} chars]`
            };
        }
        console.log('[IPC] Received message:', safeMessage);
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
            handler(message);
        }
        else {
            console.log('[IPC] No handler for message type:', message.type);
        }
    }
    onMessage(type, handler) {
        this.messageHandlers.set(type, handler);
    }
    sendMessage(message) {
        if (!this.process || !this.process.stdin) {
            console.error('[IPC] Cannot send message: process not available');
            return;
        }
        const messageWithMeta = {
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
                base64: `[BASE64 DATA - ${safeMessage.data.base64.length} chars]`
            };
        }
        console.log('[IPC] Sending message:', JSON.stringify(safeMessage));
        this.process.stdin.write(jsonMessage);
    }
    sendDebugMessage(level, message, data) {
        this.sendMessage({
            type: 'debug',
            data: { level, message, data }
        });
    }
    sendCounterMessage(count, message) {
        if (count === undefined) {
            this.counter++;
            count = this.counter;
        }
        this.sendMessage({
            type: 'counter',
            data: { count, message }
        });
    }
    sendImageMessage(base64, mimeType, filename) {
        this.sendMessage({
            type: 'image',
            data: { base64, mimeType, filename }
        });
    }
    sendInitData(prompt, dst, apiKey, files) {
        this.sendMessage({
            type: 'init_data',
            data: { prompt, dst, apiKey, files }
        });
    }
    // Send IPC message via Tauri command (when GUI is ready)
    async sendIPCViaTauri(messageType, data) {
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
    async waitForPromptSubmit() {
        return new Promise((resolve) => {
            this.onMessage('prompt_submit', (message) => {
                resolve(message.data);
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
export function getGuiAppPath() {
    // Get the directory of this script file, then navigate to the GUI app
    const scriptDir = path.dirname(new URL(import.meta.url).pathname);
    // On Windows, URL.pathname can have an extra leading slash, so we need to handle it
    const cleanScriptDir = process.platform === 'win32' && scriptDir.startsWith('/')
        ? scriptDir.substring(1)
        : scriptDir;
    const packageRoot = path.resolve(cleanScriptDir, '..', '..');
    // Determine platform-specific subdirectory and executable name
    let platformDir;
    let executableName;
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
export function createIPCClient() {
    const guiAppPath = getGuiAppPath();
    return new IPCClient(guiAppPath);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpYi9pcGMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLEtBQUssRUFBZ0IsTUFBTSxvQkFBb0IsQ0FBQztBQUN6RCxPQUFPLEtBQUssSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUNsQyxPQUFPLEVBQUUsSUFBSSxJQUFJLE1BQU0sRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBNkNyRCxNQUFNLE9BQU8sU0FBUztJQU1FO0lBTFosT0FBTyxHQUF3QixJQUFJLENBQUM7SUFDcEMsZUFBZSxHQUErQyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQ3hFLE9BQU8sR0FBRyxDQUFDLENBQUM7SUFDWixPQUFPLEdBQUcsS0FBSyxDQUFDO0lBRXhCLFlBQW9CLFVBQWtCO1FBQWxCLGVBQVUsR0FBVixVQUFVLENBQVE7SUFBRyxDQUFDO0lBRTFDLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBaUIsRUFBRTtRQUM1QixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ25DLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQzNCLE9BQU8sTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLGlDQUFpQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLENBQUM7WUFFRCxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRTtnQkFDeEMsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUM7YUFDbEMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO1lBQ2hCLElBQUksV0FBVyxHQUFHLEVBQUUsQ0FBQztZQUVyQixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxF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