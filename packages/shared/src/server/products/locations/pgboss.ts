import { Job, PgBoss } from 'pg-boss';
import { AbstractWorker } from '@/jobs/boss/AbstractWorker.js';
import { Worker } from '@/commons/decorators.js';
import { searchLocations, SearchParams } from './jobs-find.js';
import { JOB_NAME, EMAIL_JOB_NAME, COST_PER_SEARCH, EMAIL_SEARCH_COST, EMAIL_META_TIMEOUT_MS, EMAIL_SEARCH_TIMEOUT_MS, EMAIL_SEARCH_MAX_PAGES, EMAIL_SEARCH_PAGE_TIMEOUT_MS, EMAIL_SEARCH_PAGE_CONCURRENCY, EMAIL_MAX_CONCURRENT_JOBS } from './constants.js';
import { params_hash } from './cache.js';
import { findEmailEach, parseHtml, Page, Meta } from '@polymech/search';
import { getLocationByPlaceId } from '../../endpoints/competitors/getLocationByPlaceId.js';
import { supabase } from '../../commons/supabase.js';
import { logger } from '@/commons/logger.js';

export interface LocationsJobData extends SearchParams {
    userId: string;
}

export interface EmailJobData {
    place_id: string;
    userId: string;
}

@Worker(JOB_NAME)
export class LocationsWorker extends AbstractWorker<LocationsJobData> {
    readonly queueName = JOB_NAME;

    calculateCost(job: Job<LocationsJobData>, result: any): number {
        return COST_PER_SEARCH + (result?.length || 0) * 0.1;
    }
    protected async process(job: Job<LocationsJobData>) {
        const { userId, ...params } = job.data;
        const results = await searchLocations(params, userId);
        return { count: results.length, placeIds: results.map((r: any) => r.place_id) };
    }
}

@Worker(EMAIL_JOB_NAME)
export class EmailWorker extends AbstractWorker<EmailJobData> {
    readonly queueName = EMAIL_JOB_NAME;
    readonly teamSize = EMAIL_MAX_CONCURRENT_JOBS;

    calculateCost(job: Job<EmailJobData>, result: any): number {
        return EMAIL_SEARCH_COST;
    }

    protected async process(job: Job<EmailJobData>) {
        logger.info(`[EmailWorker] Processing job ${job.id} for place_id: ${job.data.place_id}`);

        const { place_id, userId } = job.data;

        // 1. Fetch location details
        const location = await getLocationByPlaceId(place_id);
        if (!location) {
            throw new Error('Location not found');
        }

        // 2. Check for existing emails (maybe skip this if forceRefresh is handled by caller? assuming always fresh search requested or caller handles cache)
        // For job simplicity, we always assume we want to enrich if we are here. 
        // But we should check if website exists
        if (!location.website) {
            throw new Error('No website available');
        }

        // 3. Ensure Meta Data
        if (!location.meta || !location.meta.pages) {
            logger.info(`[EmailWorker] Meta missing for ${place_id} : ${location}, fetching...`);
            const meta = await parseHtml(location.website, null, {
                headless: true,
                timeout: EMAIL_META_TIMEOUT_MS
            });
            if (meta) {
                location.meta = { ...location.meta, ...meta } as any;
                // Update DB with meta
                await supabase.from('locations').update({ meta: location.meta }).eq('place_id', place_id);
            }
        }

        // 4. Execute Email Scraping
        logger.info(`[EmailWorker] Starting email search for ${place_id} : ${location.title}`);

        let isCancelled = false;
        const checkCancelled = async () => {
            if (isCancelled) return true;
            if (!this.boss) return false;
            try {
                const currentJob = await this.boss.getJobById(job.name, job.id);
                const dbCancelled = !!(currentJob && (currentJob as any).state === 'cancelled');
                if (dbCancelled) isCancelled = true;
                return isCancelled;
            } catch (e) {
                return false;
            }
        };



        const searchPromise = findEmailEach(location, {
            headless: process.env.EMAIL_SEARCH_HEADLESS === 'false' ? false : true,
            searchFrom: 'api',
            abortAfter: 1,
            maxPages: EMAIL_SEARCH_MAX_PAGES,
            pageTimeout: EMAIL_SEARCH_PAGE_TIMEOUT_MS,
            concurrency: EMAIL_SEARCH_PAGE_CONCURRENCY,
            checkCancelled
        }, async (page: Page) => {
            logger.info(`[EmailWorker] Found email for ${place_id}`);
            if (await checkCancelled()) {
                logger.info(`[EmailWorker] Job cancelled for ${place_id}`);
                throw new Error('Cancelled');
            }
        });

        // We use a timeout wrapper similar to original code
        let emails: string[] = [];
        logger.info(`[EmailWorker] Starting search with timeout: ${EMAIL_SEARCH_TIMEOUT_MS}ms`);
        try {
            const result = await Promise.race([
                searchPromise,
                new Promise((_, reject) => setTimeout(() => {
                    logger.warn(`[EmailWorker] Timeout reached for ${place_id}, signalling cancellation...`);
                    isCancelled = true;
                    reject(new Error('Timeout'));
                }, EMAIL_SEARCH_TIMEOUT_MS))
            ]);
            if (result) emails = result as string[];
        } catch (e: any) {
            if (e.message === 'Timeout') {
                logger.warn(`[EmailWorker] Timeout searching emails for ${place_id}`);
                // Proceed with what we have (empty)
            } else if (e.message === 'Cancelled' || e.message === 'CancelledByUser') {
                logger.warn(`[EmailWorker] Job cancelled for ${place_id}`);
                // Proceed with what we have (likely empty or partial)
            } else {
                throw e;
            }
        }

        // Format emails
        const emailsWithMetadata = emails.map((email) => ({
            email,
            source: location.website || '',
            foundAt: new Date().toISOString(),
            tool: 'puppeteer'
        }));

        // Update location with emails
        if (emailsWithMetadata.length > 0) {
            logger.info(`[EmailWorker] Updating location ${place_id} with ${emailsWithMetadata.length} emails`);
            await supabase
                .from('locations')
                .update({
                    meta: {
                        ...location.meta,
                        emails: emailsWithMetadata // Replaces emails with fresh finding
                    },
                    updated_at: new Date().toISOString()
                })
                .eq('place_id', place_id);
        } else {
            logger.info(`[EmailWorker] Search finished for ${place_id}. No emails found.`);
        }

        return {
            place_id,
            emailsCount: emailsWithMetadata.length,
            emails: emailsWithMetadata
        };
    }
}
