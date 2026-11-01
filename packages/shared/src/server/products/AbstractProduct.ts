import EventEmitter from 'events';
import { createHash } from 'crypto';
import { streamSSE } from 'hono/streaming';
import { EventBus } from './EventBus.js';
import { ProductErrorCode } from './enums.js';
import { ProductError } from './errors.js';
import { logger } from '../commons/logger.js';

export interface JobCreationEvent {
    queue: string;
    data: any;
    options: any;
}

export interface StreamOptions<TData = any> {
    data: TData;
    userId: string;
    forceRefresh?: boolean;
    fetcher: (data: TData, userId: string) => Promise<any[]>;
    cacheChecker?: (hash: string) => Promise<any[] | null>;
}

export abstract class AbstractProduct<TJobData = any> extends EventEmitter {
    abstract readonly id: string;
    abstract readonly jobOptions: any;
    abstract readonly actions: Record<string, any>;
    abstract readonly workers: any[];
    abstract readonly routes: any[];

    async start(boss?: any) {
        try {
            await this.onStart(boss);
        } catch (error: any) {
            throw new ProductError(ProductErrorCode.START_FAILED, {
                message: `Failed to start product ${this.id}: ${error.message}`,
                originalError: error
            });
        }
    }

    protected async onStart(boss?: any) {
        // Optional hook for subclasses
    }

    async stop() {
        try {
            await this.onStop();
        } catch (error: any) {
            throw new ProductError(ProductErrorCode.STOP_FAILED, {
                message: `Failed to stop product ${this.id}: ${error.message}`,
                originalError: error
            });
        }
    }

    protected async onStop() {
        // Optional hook
    }

    async pause() {
        // No-op for now as we removed pgboss
    }

    async resume() {
        // No-op for now as we removed pgboss
    }

    protected async handleStream(c: any, options: StreamOptions) {
        const { data, userId, forceRefresh, fetcher, cacheChecker } = options;

        const inputHash = this.generateHash(data);

        return streamSSE(c, async (stream) => {
            try {
                await stream.writeSSE({
                    event: 'progress',
                    data: JSON.stringify({ stage: 'starting', percent: 0 })
                });

                if (!forceRefresh && cacheChecker) {
                    await stream.writeSSE({
                        event: 'progress',
                        data: JSON.stringify({ stage: 'checking_cache', percent: 10 })
                    });

                    const cached = await cacheChecker(inputHash);
                    if (cached) {
                        for (let i = 0; i < cached.length; i++) {
                            await stream.writeSSE({
                                event: 'result',
                                data: JSON.stringify(cached[i])
                            });
                        }
                        await stream.writeSSE({
                            event: 'complete',
                            data: JSON.stringify({ total: cached.length, cached: true })
                        });
                        return;
                    }
                }

                await stream.writeSSE({
                    event: 'progress',
                    data: JSON.stringify({ stage: 'fetching_from_api', percent: 20 })
                });

                const results = await fetcher(data, userId);

                for (let i = 0; i < results.length; i++) {
                    await stream.writeSSE({
                        event: 'result',
                        data: JSON.stringify(results[i])
                    });
                }

                await stream.writeSSE({
                    event: 'complete',
                    data: JSON.stringify({ total: results.length, cached: false })
                });

            } catch (error: any) {
                logger.error(error, `[${this.id}] Stream error`);
                await stream.writeSSE({
                    event: 'error',
                    data: JSON.stringify({ error: error.message || 'Internal Server Error' })
                });
            }
        });
    }

    // Helper for hashing
    protected generateHash(params: any) {
        const normalizedInput = JSON.stringify(params, Object.keys(params).sort());
        return createHash('sha256').update(normalizedInput).digest('hex');
    }

    abstract hash(data: TJobData): string;
    abstract meta(userId: string): any;
}
