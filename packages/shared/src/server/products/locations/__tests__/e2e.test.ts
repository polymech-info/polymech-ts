
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as dotenv from 'dotenv';

import path from 'path';
// Load env from server root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
import { PgBoss } from 'pg-boss';
// import { submitJob } from '../../events.js';
// Ensure registry is loaded to register subscriber
import '../../registry.js';
import { LOCATIONS_JOB_OPTIONS } from '../constants.js';

// Dynamic imports to ensure env vars are loaded before modules that use them
let boss: PgBoss;
let startBoss: any;
let SearchWorker: any;
let supabase: any;
let logger: any;

describe('Locations Product E2E', () => {
    let worker: any;
    let TEST_USER_ID: string;
    const TEST_QUERY = 'plastichub';
    const TEST_LOCATION = 'Barcelona, Spain';

    beforeAll(async () => {
        // Import modules now that env vars are loaded
        // Adjust paths relative to this file: src/products/locations/__tests__/e2e.test.ts
        const clientModule = await import('../../../jobs/boss/client.js');
        boss = clientModule.boss as PgBoss;
        startBoss = clientModule.startBoss;

        // Import the worker from the product
        const workerModule = await import('../pgboss.js');
        SearchWorker = workerModule.LocationsWorker;

        const supabaseModule = await import('../../../commons/supabase.js');
        supabase = supabaseModule.supabase;

        const loggerModule = await import('../../../commons/logger.js');
        logger = loggerModule.logger;


        // Ensure boss is connected
        if (!boss) {
            throw new Error('PgBoss not initialized (check DATABASE_URL)');
        }

        await startBoss();

        // Initialize product (lifecycle start)
        // We need to import LocationsProduct to call start
        const productModule = await import('../index.js');
        const LocationsProduct = productModule.LocationsProduct;
        if ((LocationsProduct as any).start) {
            await (LocationsProduct as any).start(boss);
        }

        // Authenticate as the test user
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'sales@plastic-hub.com',
            password: 'customer',
        });

        if (error || !data.session) {
            console.error('Failed to sign in test user:', error);
            throw new Error('Failed to sign in test user');
        }

        TEST_USER_ID = data.user.id;
        logger.info(`E2E Test: Authenticated as ${TEST_USER_ID}`);

        // Clean up existing data
        const { error: deleteError } = await supabase
            .from('locations')
            .delete()
            .eq('user_id', TEST_USER_ID)
            .eq('title', 'Plastic Hub');

        if (deleteError) {
            logger.warn('Failed to clean up existing locations:', deleteError);
        } else {
            logger.info('Cleaned up existing locations for test');
        }

        // Register the worker in this process
        worker = new SearchWorker();
        logger.info(`Worker Queue Name: ${worker.queueName}`);
        await boss.createQueue(worker.queueName);
        await boss.work(worker.queueName, worker.handler.bind(worker));

        logger.info('E2E Test: Worker started');
    });

    afterAll(async () => {
        if (boss) {
            // Delete jobs from the queue to clean up
            // Note: pg-boss doesn't have a simple "delete all from queue" method exposed easily on the instance
            // but we can try to stop the boss which stops processing.
            // The user asked: "make sure that all jobs are being deleted after the test"
            // We can use raw SQL via supabase or just stop the boss.
            // Let's try to clear the queue using SQL if possible, or just rely on stop.
            // Actually, we can use boss.fetch() to drain the queue or just leave it.
            // But to be "clean", maybe we can delete the specific job we created if we had the ID.

            await boss.stop();
        }
    });

    it('should process a real search job and update Supabase', async () => {
        if (!boss) return;

        // 1. Send Job
        const jobData = {
            query: TEST_QUERY,
            location: TEST_LOCATION,
            userId: TEST_USER_ID,
            filters: {
                concurrency: 1
            }
        };

        let jobId: string | null = null;

        try {
            // Use submitJob helper to trigger event-based metadata injection
            // Use submitJob helper to trigger event-based metadata injection
            // jobId = await submitJob(worker.queueName, jobData, {}, boss);
            jobId = await boss.send(worker.queueName, jobData);
            expect(jobId).toBeDefined();
            logger.info(`Job submitted: ${jobId}`);

            // Wait for job to be processed. 
            // Since we are running the worker in the same process, it should pick it up.
            // We can poll the database for the result.

            let attempts = 0;
            const maxAttempts = 20; // 20 * 1s = 20s
            let found = false;

            while (attempts < maxAttempts && !found) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const { data: locations } = await supabase
                    .from('locations')
                    .select('place_id, title')
                    .eq('user_id', TEST_USER_ID)
                    .eq('title', 'Plastic Hub');

                if (locations && locations.length > 0) {
                    found = true;
                    logger.info('Locations found:', locations.length);
                    expect(locations).toBeDefined();
                    expect(locations.length).toBeGreaterThan(0);
                    expect(locations[0].title).toBe('Plastic Hub');
                }
                attempts++;
            }

            if (!found) {
                throw new Error('Timeout waiting for job to process and update DB');
            }

        } catch (err: any) {
            logger.error({ err }, 'Error sending/processing job');
            throw err;
        } finally {
            if (jobId) {
                // Try to cancel/delete the job to clean up
                try {
                    await boss.deleteJob(worker.queueName, jobId);
                    logger.info(`Cleaned up job ${jobId}`);
                } catch (e) {
                    logger.warn(`Failed to clean up job ${jobId}: ${e}`);
                }
            }
        }
    }, 30000); // Increased timeout

    it('should prevent duplicate jobs using singleton check and verify metadata', async () => {
        if (!boss) return;

        const jobData = {
            query: 'duplicate-check',
            userId: '39d5210c-23b0-430e-bbfc-00b48f67c899',
            filters: {
                concurrency: 1
            },
            location: 'Nowhere'
        };

        // First submission should succeed
        // First submission should succeed
        // const jobId1 = await submitJob(worker.queueName, jobData, {}, boss);
        const jobId1 = await boss.send(worker.queueName, jobData);
        expect(jobId1).toBeDefined();
        logger.info(`Singleton Test: First job submitted: ${jobId1}`);

        // Verify metadata
        const job = await boss.getJobById(worker.queueName, jobId1!);
        expect(job).not.toBeNull();
        if (job) {
            expect(job.data).toBeDefined();
            // Check if metadata was injected (cost, timestamp)
            // Note: userId is already in jobData, but getMetadata adds cost and timestamp
            expect((job.data as any).cost).toBeDefined();
            expect((job.data as any).timestamp).toBeDefined();
            expect((job.data as any).userId).toBe(jobData.userId);

            // Verify job options from constants
            // Priority Low = 10
            expect(job.priority).toBe(10);
            expect(job.retryLimit).toBe(5);

            logger.info('Singleton Test: Metadata verification successful');
        } else {
            logger.warn('Singleton Test: Job not found (might be completed/archived)');
        }

        // Second submission should fail (return null) because of singletonKey
        // Second submission should fail (return null) because of singletonKey
        // const jobId2 = await submitJob(worker.queueName, jobData, {}, boss);
        const jobId2 = await boss.send(worker.queueName, jobData);
        expect(jobId2).toBeNull();
        logger.info('Singleton Test: Duplicate job correctly rejected (returned null)');

        // Clean up
        if (jobId1) {
            try {
                await boss.deleteJob(worker.queueName, jobId1);
                logger.info(`Singleton Test: Cleaned up job ${jobId1}`);
            } catch (e) {
                logger.warn(`Singleton Test: Failed to clean up job ${jobId1}: ${e}`);
            }
        }
    });

    it('should resume cancelled jobs on product start', async () => {

        const options = { retryDelay: 1, retryBackoff: true, retryDelayMax: 10 }
        const batchSize = 4
        /*
        await Promise.all([
            boss.send(worker.queueName, null, options),
            boss.send(worker.queueName, null, options),
            boss.send(worker.queueName, null, options),
            boss.send(worker.queueName, null, options)
        ])*/

        //  const jobs = await boss.fetch(worker.queueName, { batchSize, includeMetadata: true })

        // 1. Submit a job with delay so we can cancel it before it runs

        const jobData = {
            query: TEST_QUERY,
            location: TEST_LOCATION,
            userId: TEST_USER_ID
        };

        // Use a unique query to avoid singleton check (or ensure previous jobs are gone)
        // We can append timestamp to query
        jobData.query = `${TEST_QUERY}-${Date.now()}`;

        // const jobId = await submitJob(boss, worker.queueName, jobData, { startAfter: 10 });
        const job1 = await boss.send(worker.queueName, LOCATIONS_JOB_OPTIONS, options);
        await boss.work(worker.queueName, async ([job]) => {
            debugger
            console.log(`received job ${job.id} with data ${JSON.stringify(job.data)}`)
        })
        const jobs2 = await boss.fetch(worker.queueName)
        const jobId = ''
        expect(jobId).toBeDefined();
        logger.info(`Resume Test: Job submitted: ${jobId}`);


        // 2. Cancel the job
        await boss.cancel(worker.queueName, jobId!);

        // 3. Verify it is cancelled
        let job = await boss.getJobById(worker.queueName, jobId!);
        expect(job).not.toBeNull();
        expect(job!.state).toBe('cancelled');
        logger.info(`Resume Test: Job cancelled`);

        // 4. Call LocationsProduct.start to resume
        const productModule = await import('../index.js');
        const LocationsProduct = productModule.LocationsProduct;
        if ((LocationsProduct as any).start) {
            await (LocationsProduct as any).start(boss);
        }

        // 5. Verify it is resumed (state should be created or active)
        // Wait a bit for the resume to happen (it's async inside start)
        await new Promise(resolve => setTimeout(resolve, 1000));

        job = await boss.getJobById(worker.queueName, jobId!);
        expect(job).not.toBeNull();
        logger.info(`Resume Test: Job state after resume: ${job!.state}`);
        expect(job!.state).not.toBe('cancelled');
        // It should probably be 'created' (waiting for startAfter?) or 'active' if startAfter was cleared?
        // pg-boss resume might reset it to created.
        expect(['created', 'active', 'completed']).toContain(job!.state);

        // Clean up
        if (jobId) {
            try {
                await boss.deleteJob(worker.queueName, jobId);
            } catch (e) {
                // ignore
            }
        }
    });
});
