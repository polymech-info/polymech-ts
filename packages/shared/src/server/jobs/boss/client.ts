import { PgBoss } from 'pg-boss';
import { logger } from '../../commons/logger.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    logger.warn('DATABASE_URL not found, PgBoss will not be initialized');
}

export const boss = connectionString ? new PgBoss({
    connectionString,
    __test__enableSpies: true
} as any) : null;
export let bossInitError: Error | null = null;

export async function startBoss() {
    if (!boss) return;

    boss.on('error', (error: Error) => logger.error({ error }, 'PgBoss error'));

    try {
        await boss.start();
        logger.info('PgBoss started');
        return boss;
    } catch (error: any) {
        bossInitError = error;
        logger.error({ error }, 'Failed to start PgBoss');
        const fs = await import('fs');
        fs.writeFileSync('debug_pgboss_error.txt', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }
}

export async function stopBoss() {
    if (!boss) {
        console.info('PgBoss not initialized, skipping stop.')
        return
    }
    try {
        await boss.stop({ timeout: 5000 }); // 5s timeout
        console.info('PgBoss stopped');
    } catch (error) {
        console.error({ error }, 'Failed to stop PgBoss');
    }
}