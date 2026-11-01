import { Job } from 'pg-boss';
import { supabase } from '../../commons/supabase.js';
import { logger } from '../../commons/logger.js';
import EventEmitter from 'events';


export abstract class AbstractWorker<TData> {
    abstract readonly queueName: string;
    readonly queueOptions?: any; // pg-boss QueueOptions
    protected emitter?: EventEmitter;

    // Cost calculation can be static or dynamic based on results
    abstract calculateCost(job: Job<TData>, result?: any): number;

    // The core business logic
    protected abstract process(job: Job<TData>): Promise<any>;

    // Main entry point for pg-boss
    public async handler(jobOrJobs: Job<TData> | Job<TData>[]) {

        const job = Array.isArray(jobOrJobs) ? jobOrJobs[0] : jobOrJobs;

        // Safety check
        if (!job) {
            logger.error(`[${this.queueName}] Received null or empty job`);
            return;
        }

        const jobId = job.id;
        const usageId = (job.data as any)?.usageId;

        logger.info(`[${this.queueName}] Starting job ${jobId}`);

        try {
            // 2. Execute Business Logic
            const result = await this.process(job);

            // 3. Calculate Cost
            const cost = this.calculateCost(job, result);

            if (this.emitter) {
                this.emitter.emit('job:complete', {
                    jobId,
                    result
                });
            }


            return result;

        } catch (error: any) {

            logger.error({ err: error }, `[${this.queueName}] Job failed`);

            throw error; // Let pg-boss handle retry/failure
        }
    }
}
