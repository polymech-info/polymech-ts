import pino from 'pino';
/**
 * Factory: creates a named pino logger writing to logs/<name>.json.
 * When running inside pm-pics server (same cwd), the file is discoverable
 * by the admin log viewer at /api/admin/logs.
 */
export declare function createKbotLogger(name: string, filename?: string): pino.Logger<never, boolean>;
/** Default kbot logger — writes to logs/kbot.json */
export declare const kbotLogger: pino.Logger<never, boolean>;
export default kbotLogger;
