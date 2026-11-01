import pino from 'pino';
import path from 'path';

const logFile = path.join(process.cwd(), 'logs', 'serving.json');

const fileTransport = pino.transport({
    target: 'pino/file',
    options: { destination: logFile, mkdir: true }
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
        base: { product: 'serving' },
        timestamp: pino.stdTimeFunctions.isoTime,
    },
    pino.multistream([
        { stream: fileTransport, level: 'info' },
        { stream: consoleTransport, level: 'info' },
    ])
);
