import { boss } from './client.js';
import { getAllWorkers } from '@/products/registry.js';
import { logger } from '@/commons/logger.js';

export const QUEUE_MOCK_JOB = 'mock-job';

interface MockJobData {
    subtasks: number;
    delayMs: number;
    shouldFail: boolean;
}

export async function registerMockWorkers() {
    if (!boss) return;

    // Product workers are now registered by the products themselves in AbstractProduct.start()

    await boss.createQueue(QUEUE_MOCK_JOB);
    await boss.work<MockJobData>(QUEUE_MOCK_JOB, async (jobs: any) => {
        // PgBoss might pass an array of jobs or a single job depending on config/version
        const job = Array.isArray(jobs) ? jobs[0] : jobs;

        const data = job.data || {};
        const { delayMs = 100, shouldFail = false } = data;
        const jobId = job.id;

        logger.info({ jobId, data }, 'Processing PgBoss mock job');

        await new Promise(resolve => setTimeout(resolve, delayMs));

        if (shouldFail) {
            throw new Error('Simulated PgBoss job failure');
        }

        logger.info({ jobId }, 'PgBoss mock job completed');
        return { success: true };
    });

    logger.info('PgBoss workers registered');
}
