import pino from 'pino';
import path from 'path';
import { mkdirSync } from 'fs';

// Ensure logs directory exists
try {
    mkdirSync(path.join(process.cwd(), 'logs'), { recursive: true });
} catch (err) {
    // Directory already exists
}

const fileTransport = pino.transport({
    target: 'pino/file',
    options: { destination: path.join(process.cwd(), 'app.log') },
});

const consoleTransport = pino.transport({
    target: 'pino-pretty',
    options: {
        colorize: true,
        ignore: 'pid,hostname',
        destination: 1,
    },
});

export const logger = pino(
    {
        level: process.env.PINO_LOG_LEVEL || 'info',
        formatters: {
            level: (label) => {
                return { level: label.toUpperCase() };
            },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
    },
    pino.multistream([
        { stream: fileTransport, level: 'info' },
        { stream: consoleTransport, level: 'info' },
    ])
);

// Security logger - writes to logs/security.json
const securityFileTransport = pino.transport({
    target: 'pino/file',
    options: {
        destination: path.join(process.cwd(), 'logs', 'security.json'),
        mkdir: true
    },
});

const securityConsoleTransport = pino.transport({
    target: 'pino-pretty',
    options: {
        colorize: true,
        ignore: 'pid,hostname',
        destination: 1,
    },
});

export const securityLogger = pino(
    {
        level: process.env.PINO_LOG_LEVEL || 'info',
        formatters: {
            level: (label) => {
                return { level: label.toUpperCase() };
            },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        base: {
            logger: 'security'
        }
    },
    pino.multistream([
        { stream: securityFileTransport, level: 'info' },
        { stream: securityConsoleTransport, level: 'info' },
    ])
);

export default logger;
