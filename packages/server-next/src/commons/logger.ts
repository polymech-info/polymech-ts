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

export const campaignsLogger = pino(
    {
        level: process.env.PINO_LOG_LEVEL || 'info',
        formatters: {
            level: (label) => {
                return { level: label.toUpperCase() };
            },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        base: {
            logger: 'campaigns'
        }
    },
    pino.multistream([
        {
            stream: pino.transport({
                target: 'pino/file',
                options: {
                    destination: path.join(process.cwd(), 'logs', 'campaigns.json'),
                    mkdir: true
                },
            }),
            level: 'info'
        },
        {
            stream: pino.transport({
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    ignore: 'pid,hostname',
                    destination: 1,
                },
            }),
            level: 'info'
        },
    ])
);

export const contactsLogger = pino(
    {
        level: process.env.PINO_LOG_LEVEL || 'info',
        formatters: {
            level: (label) => {
                return { level: label.toUpperCase() };
            },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        base: {
            logger: 'contacts'
        }
    },
    pino.multistream([
        {
            stream: pino.transport({
                target: 'pino/file',
                options: {
                    destination: path.join(process.cwd(), 'logs', 'contacts.json'),
                    mkdir: true
                },
            }),
            level: 'info'
        },
        {
            stream: pino.transport({
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    ignore: 'pid,hostname',
                    destination: 1,
                },
            }),
            level: 'info'
        },
    ])
);

// Agent logger - writes to logs/agents.json
export const agentLogger = pino(
    {
        level: process.env.PINO_LOG_LEVEL || 'info',
        formatters: {
            level: (label) => {
                return { level: label.toUpperCase() };
            },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        base: {
            logger: 'agent'
        }
    },
    pino.multistream([
        {
            stream: pino.transport({
                target: 'pino/file',
                options: {
                    destination: path.join(process.cwd(), 'logs', 'agents.json'),
                    mkdir: true
                },
            }),
            level: 'info'
        },
        {
            stream: pino.transport({
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    ignore: 'pid,hostname',
                    destination: 1,
                },
            }),
            level: 'info'
        },
    ])
);

// VFS logger - writes to logs/vfs.json
export const vfsLogger = pino(
    {
        level: process.env.PINO_LOG_LEVEL || 'info',
        formatters: {
            level: (label) => {
                return { level: label.toUpperCase() };
            },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        base: {
            logger: 'vfs'
        }
    },
    pino.multistream([
        {
            stream: pino.transport({
                target: 'pino/file',
                options: {
                    destination: path.join(process.cwd(), 'logs', 'vfs.json'),
                    mkdir: true
                },
            }),
            level: 'info'
        },
        {
            stream: pino.transport({
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    ignore: 'pid,hostname',
                    destination: 1,
                },
            }),
            level: 'info'
        },
    ])
);


export const createLogger = (name: string) => pino(
    {
        level: process.env.PINO_LOG_LEVEL || 'info',
        formatters: {
            level: (label) => {
                return { level: label.toUpperCase() };
            },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        base: {
            logger: name
        }
    },
    pino.multistream([
        {
            stream: pino.transport({
                target: 'pino/file',
                options: {
                    destination: path.join(process.cwd(), 'logs', `${name}.json`),
                    mkdir: true
                },
            }),
            level: 'info'
        },
        {
            stream: pino.transport({
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    ignore: 'pid,hostname',
                    destination: 1,
                },
            }),
            level: 'info'
        },
    ])
);

export default logger;
