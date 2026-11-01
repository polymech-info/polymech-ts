import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';

type MessageHandler = (ws: WebSocket, payload: any) => void;

export class WebSocketManager {
    private static instance: WebSocketManager;
    private wss: WebSocketServer | null = null;
    private handlers: Map<string, MessageHandler> = new Map();
    private writeQueue: Promise<void> = Promise.resolve();

    private constructor() {
        // Register default handlers
        this.registerHandler('log', this.handleLog.bind(this));
        this.registerHandler('echo', (ws, payload) => ws.send(JSON.stringify({ type: 'echo', payload })));
        this.registerHandler('ping', (ws, payload) => ws.send(JSON.stringify({ type: 'pong', id: payload.id })));
    }

    public static getInstance(): WebSocketManager {
        if (!WebSocketManager.instance) {
            WebSocketManager.instance = new WebSocketManager();
        }
        return WebSocketManager.instance;
    }

    public init(server: Server) {
        if (this.wss) {
            console.warn('WebSocketServer already initialized');
            return;
        }

        this.wss = new WebSocketServer({ server, path: '/ws' });

        this.wss.on('connection', (ws: WebSocket) => {
            ws.on('message', (message: string) => {
                try {
                    const data = JSON.parse(message.toString());
                    const { command, ...payload } = data;

                    if (command && this.handlers.has(command)) {
                        this.handlers.get(command)!(ws, payload);
                    } else {
                        console.warn('Unknown command:', command);
                    }
                } catch (err) {
                    console.error('Failed to parse message:', err);
                }
            });

            ws.on('close', () => {

            });

            ws.on('error', (err) => {
                console.error('WebSocket error:', err);
            });
        });

        this.initWatcher();
    }

    private initWatcher() {
        // Watch for changes in canvas-page-new.json
        const logDir = path.join(process.cwd(), 'data');
        // Ensure log directory exists
        if (!fs.existsSync(logDir)) {
            try {
                fs.mkdirSync(logDir, { recursive: true });
            } catch (err) {
                console.error('Failed to create log directory for watcher:', err);
            }
        }

        const handleFile = async (filePath: string) => {
            // Ignore output files (logs) to prevent infinite loops (Frontend -> Log -> Watcher -> Frontend -> Loop)
            const fileName = path.basename(filePath);
            const ext = path.extname(filePath).toLowerCase();

            // Explicitly allow only specific JSON files (layouts) to trigger updates
            // Ignore everything else (logs, dumps, etc.)
            if (ext === '.json') {
                if (fileName !== 'canvas-page-latest-new.json' && fileName !== 'canvas-page-new.json') {
                    return;
                }
            } else if (fileName.startsWith('canvas-html-latest')) {
                return;
            }

            console.log(`[Watcher] File detected: ${filePath}`);
            try {
                const ext = path.extname(filePath).toLowerCase();

                if (ext === '.json') {
                    const content = await fs.promises.readFile(filePath, 'utf-8');
                    if (!content.trim()) return; // Ignore empty writes

                    try {
                        const layoutData = JSON.parse(content);
                        console.log('Broadcasting layout-update (json)...');
                        this.broadcast({
                            type: 'layout-update',
                            data: layoutData
                        });
                    } catch (parseErr) {
                        console.error(`Failed to parse watched JSON file: ${filePath}`, parseErr);
                    }
                } else if (ext === '.html' || ext === '.md') {
                    const content = await fs.promises.readFile(filePath, 'base64');
                    console.log(`Broadcasting layout-update (${ext})...`);
                    this.broadcast({
                        type: 'layout-update',
                        data: content
                    });
                }
            } catch (err) {
                console.error(`Failed to process watched file ${filePath}:`, err);
            }
        };

        chokidar.watch(logDir, {
            persistent: true,
            ignoreInitial: false,
            awaitWriteFinish: {
                stabilityThreshold: 100,
                pollInterval: 100
            }
        })
            .on('add', handleFile)
            .on('change', handleFile);
    }

    public registerHandler(command: string, handler: MessageHandler) {
        if (this.handlers.has(command)) {
            console.warn(`Handler for command '${command}' is being overwritten.`);
        }
        this.handlers.set(command, handler);
        console.log(`Registered WebSocket handler for: ${command}`);
    }

    public broadcast(message: any) {
        if (!this.wss) return;
        const data = JSON.stringify(message);
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }

    private handleLog(ws: WebSocket, payload: any) {
        // Expected payload: { name: string, options?: { mode?: 'append'|'overwrite', format?: 'json'|'html'|'md' }, message: any, ...others }
        const { name, id, options, ...logData } = payload;

        if (!name) {
            console.warn('Log command missing "name" field');
            return;
        }

        const mode = options?.mode || 'append';
        const format = options?.format || 'json';

        const logDir = path.join(process.cwd(), 'data');
        const extension = format === 'md' ? 'md' : format === 'html' ? 'html' : 'json';
        const logFile = path.join(logDir, `${name}.${extension}`);

        // Ensure log directory exists
        if (!fs.existsSync(logDir)) {
            try {
                fs.mkdirSync(logDir, { recursive: true });
            } catch (err) {
                console.error('Failed to create log directory:', err);
                return;
            }
        }

        // Serialize writes using the queue
        this.writeQueue = this.writeQueue.then(async () => {
            try {
                if (format === 'json') {
                    if (mode === 'overwrite') {
                        // For overwrite (state capture), write only the message content if available
                        const content = (logData.message !== undefined) ? logData.message : logData;
                        const contentToWrite = JSON.stringify(content, null, 2);
                        await fs.promises.writeFile(logFile, contentToWrite);
                    } else {
                        // For append (logging), read existing, parse, append to array, write back
                        let records: any[] = [];

                        try {
                            if (fs.existsSync(logFile)) {
                                const fileContent = await fs.promises.readFile(logFile, 'utf-8');
                                if (fileContent.trim()) {
                                    try {
                                        const parsed = JSON.parse(fileContent);
                                        if (Array.isArray(parsed)) {
                                            records = parsed;
                                        } else {
                                            records = [parsed];
                                        }
                                    } catch (e) {
                                        // Attempt to parse as NDJSON (newline delimited JSON)
                                        records = fileContent.split('\n')
                                            .filter(line => line.trim())
                                            .map(line => {
                                                try { return JSON.parse(line); } catch { return null; }
                                            })
                                            .filter(item => item !== null);
                                    }
                                }
                            }
                        } catch (readErr) {
                            console.warn(`Failed to read log file ${logFile}, starting fresh.`, readErr);
                        }

                        const logEntry = {
                            timestamp: new Date().toISOString(),
                            ...logData
                        };
                        records.push(logEntry);

                        await fs.promises.writeFile(logFile, JSON.stringify(records, null, 2));
                    }
                } else {
                    // HTML or MD
                    const message = logData.message;
                    const content = typeof message === 'string' ? message : JSON.stringify(message);

                    if (mode === 'append') {
                        await fs.promises.appendFile(logFile, content + '\n');
                    } else {
                        await fs.promises.writeFile(logFile, content);
                    }
                }
            } catch (err) {
                console.error(`Failed to write log file ${logFile}:`, err);
            }
        });
    }
}
