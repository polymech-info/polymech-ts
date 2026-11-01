import pino from 'pino';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

try {
    mkdirSync(path.join(process.cwd(), 'logs'), { recursive: true });
} catch { /* already exists */ }

const LEVEL = process.env.KBOT_LOG_LEVEL ?? process.env.PINO_LOG_LEVEL ?? 'debug';

const pinoOpts = (base?: Record<string, unknown>) => ({
    level: LEVEL,
    formatters: {
        level: (label: string) => ({ level: label.toUpperCase() }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    ...(base ? { base } : {}),
});

function makeFileTransport(dest: string) {
    return pino.transport({ target: 'pino/file', options: { destination: dest, mkdir: true } });
}

const prettyTransport = pino.transport({
    target: 'pino-pretty',
    options: { colorize: true, ignore: 'pid,hostname', destination: 1 },
});

/**
 * Factory: creates a named pino logger writing to logs/<name>.json.
 * When running inside pm-pics server (same cwd), the file is discoverable
 * by the admin log viewer at /api/admin/logs.
 */
export function createKbotLogger(name: string, filename = name) {
    return pino(
        pinoOpts({ logger: name }),
        pino.multistream([
            { stream: makeFileTransport(path.join(process.cwd(), 'logs', `${filename}.json`)), level: LEVEL },
            { stream: prettyTransport, level: LEVEL },
        ]),
    );
}

/** Default kbot logger — writes to logs/kbot.json */
export const kbotLogger = createKbotLogger('kbot', 'kbot');

export default kbotLogger;
