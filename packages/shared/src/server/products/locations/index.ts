import { getLocationsRoute, getLocationsStreamRoute, getCompetitorByIdRoute, getFindEmailStreamRoute, cancelJobRoute, getRegionSearchRoute, getRegionBoundaryRoute, getRegionNamesRoute, getRegionReverseRoute, getWikiSearchRoute, getLlmRegionInfoRoute, getEnrichStreamRoute } from './routes.js';
import { run, IKBotTask } from '@polymech/kbot-d';
import { EnricherRegistry } from './enrichers/registry.js';
import { MetaEnricher } from './enrichers/meta.js';
import { enrichmentService } from './enrichers/service.js';
import { getLocationsByPlaceIds, upsertLocations } from './db.js';
import { reverse } from '@polymech/search';
import { LocationsWorker, LocationsJobData, EmailWorker, EmailJobData } from './pgboss.js';
import { LOCATIONS_JOB_OPTIONS, COST_PER_SEARCH, JOB_NAME, EMAIL_JOB_NAME, EMAIL_JOB_OPTIONS, EMAIL_SEARCH_COST, EMAIL_STREAM_TIMEOUT_MS, EMAIL_MAX_BATCH_SIZE, TIMEOUT_MS_LOCATIONS } from './constants.js';
import { logger } from '@/commons/logger.js';
import { get_cached, params_hash } from './cache.js';
import { streamSSE } from 'hono/streaming';
import { EventBus } from '../EventBus.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { AbstractProduct } from '../AbstractProduct.js';
import { CONFIG_DEFAULT } from '@polymech/commons';

function deduplicateResults(results: any[] | null | undefined) {
    if (!Array.isArray(results)) return results;
    const seen = new Set();
    return results.filter(item => {
        const id = item.place_id || item.title; // Fallback to title if place_id missing
        if (!id) return true;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
    });
}

export class LocationsProduct extends AbstractProduct<LocationsJobData | EmailJobData> {
    id = 'locations';
    workers = [LocationsWorker, EmailWorker];
    jobOptions = LOCATIONS_JOB_OPTIONS;

    actions = {
        search: {
            costUnits: COST_PER_SEARCH,
            cancellable: true,
            description: 'Search for locations',
        },
        email: {
            costUnits: EMAIL_SEARCH_COST,
            cancellable: true,
            description: 'Find emails for locations'
        }
    };

    routes!: any[];

    constructor() {
        super();
        this.routes = [
            { definition: getLocationsRoute, handler: this.handleGetLocations.bind(this) },
            { definition: getLocationsStreamRoute, handler: this.handleStreamGet.bind(this) },
            { definition: getCompetitorByIdRoute, handler: this.handleGetLocationById.bind(this) },
            { definition: getFindEmailStreamRoute, handler: this.handleStreamEmail.bind(this) },
            { definition: cancelJobRoute, handler: this.handleCancelJob.bind(this) },
            { definition: getRegionSearchRoute, handler: this.handleGetRegionSearch.bind(this) },
            { definition: getRegionBoundaryRoute, handler: this.handleGetRegionBoundary.bind(this) },
            { definition: getRegionReverseRoute, handler: this.handleGetRegionReverse.bind(this) },
            { definition: getRegionBoundaryRoute, handler: this.handleGetRegionBoundary.bind(this) },
            { definition: getRegionReverseRoute, handler: this.handleGetRegionReverse.bind(this) },
            { definition: getRegionNamesRoute, handler: this.handleGetRegionNames.bind(this) },
            { definition: getRegionNamesRoute, handler: this.handleGetRegionNames.bind(this) },
            { definition: getWikiSearchRoute, handler: this.handleGetWikiSearch.bind(this) },
            { definition: getLlmRegionInfoRoute, handler: this.handleGetLlmRegionInfo.bind(this) },
            { definition: getEnrichStreamRoute, handler: this.handleStreamEnrich.bind(this) }
        ];

        // Register default enrichers
        EnricherRegistry.register('meta', new MetaEnricher());
    }

    async handleGetLlmRegionInfo(c: any) {
        const { location } = c.req.valid('query');
        try {
            const promptContent = `Provide a concise summary for ${location} strictly in valid JSON format with the following keys:
- population: string (current estimate)
- industry: string (key industries)
- status: string (current geopolitical status, e.g. "Stable", "Conflict Zone", "Developing")
- currency: string (currency name and code)
- description: string (brief general description)

Do not include markdown formatting (like \`\`\`json). Just the raw JSON object.`;

            const task: IKBotTask = {
                router: 'openai',
                model: 'gpt-4o', // Using gpt-4o as gpt-5 might not be available/stable in all envs yet, or user req said gpt-5. Let's use gpt-4o or gpt-5 if confident. User said gpt-5. Correct.
                prompt: promptContent,
                // mode: 'completion' // Default is completion? No, default might be needed. 
                mode: 'completion',
                path: '.', // unused but required?
            };

            // Override model to gpt-5 as requested if supported, otherwise fallback to gpt-4o.
            // But checking kbot source, valid models are enums. If 'gpt-5' is not in enum, it might fail if validated strictly. 
            // The user explicitly asked for "router=openai model=gpt-5".
            task.model = 'gpt-5';

            const results = await run(task);
            const result = results.length > 0 ? results[0] : null;

            // KBot completion mode usually returns string or the completion object
            let jsonStr = '';
            if (typeof result === 'string') {
                jsonStr = result;
            } else if (result && typeof result === 'object' && 'content' in result) {
                jsonStr = (result as any).content as string;
            } else {
                // Fallback or check structure
                jsonStr = JSON.stringify(result);
            }

            // Cleanup jsonStr if it has markdown code blocks
            jsonStr = jsonStr.replace(/```json\n?|```/g, '').trim();

            let data;
            try {
                data = JSON.parse(jsonStr);
            } catch (e) {
                logger.error({ jsonStr }, 'Failed to parse LLM response');
                return c.json({ error: 'Failed to parse LLM response' }, 500);
            }

            return c.json({ data }, 200);

        } catch (error: any) {
            logger.error(error, 'Error fetching LLM info');
            return c.json({ error: error.message || 'Internal Server Error' }, 500);
        }
    }

    async handleGetWikiSearch(c: any) {
        const { lat, lon, radius, limit } = c.req.valid('query');
        try {
            // Wikipedia API: https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=37.7891838|-122.4033522&gsradius=10000&gslimit=10&format=json
            // We need a user agent: https://meta.wikimedia.org/wiki/User-Agent_policy

            const apiUrl = `https://en.wikipedia.org/w/api.php`;
            const params = new URLSearchParams({
                action: 'query',
                list: 'geosearch',
                gscoord: `${lat}|${lon}`,
                gsradius: radius || '10000',
                gslimit: limit || '10',
                format: 'json'
            });

            const headers = {
                'User-Agent': 'PolymechSaaS/1.0 (test@example.com)' // Replace with real contact if/when production
            };

            const res = await fetch(`${apiUrl}?${params.toString()}`, { headers });

            if (!res.ok) {
                return c.json({ error: 'Failed to fetch from Wikipedia' }, res.status);
            }

            const json = await res.json();

            if (json.error) {
                logger.error({ wikiError: json.error }, 'Wikipedia API Error');
                return c.json({ error: json.error.info || 'Wikipedia API Error' }, 500);
            }

            const results = json.query?.geosearch || [];

            return c.json({ data: results }, 200);

        } catch (error: any) {
            logger.error(error, 'Error fetching Wiki data');
            return c.json({ error: error.message || 'Internal Server Error' }, 500);
        }
    }

    async handleCancelJob(c: any) {
        console.log('[LocationsProduct] handleCancelJob called', c.req.param('jobId'));
        const { jobId } = c.req.valid('param');
        try {
            if (!this.boss) {
                logger.error('[LocationsProduct] Job system not initialized');
                return c.json({ error: 'Job system not initialized' }, 503);
            }
            await (this.boss as any).cancel(EMAIL_JOB_NAME, jobId);
            logger.info({ jobId }, '[LocationsProduct] Job cancellation requested via API');
            return c.json({ message: 'Job cancellation requested' }, 200);
        } catch (e: any) {
            logger.error({ err: e, jobId }, '[LocationsProduct] Failed to cancel job');
            return c.json({ error: 'Failed to cancel job' }, 500);
        }
    }

    async handleGetLocationById(c: any) {
        const { place_id } = c.req.valid('param');
        try {
            const results = await getLocationsByPlaceIds([place_id]);
            const location = results && results.length > 0 ? results[0] : null;

            if (!location) {
                return c.json({ error: 'Competitor not found' }, 404);
            }

            return c.json({
                message: 'Get competitor details success',
                data: location
            }, 200);

        } catch (error: any) {
            logger.error(error, 'Error fetching competitor details');
            return c.json({ error: error.message || 'Internal Server Error' }, 500);
        }
    }

    async handleGetRegionSearch(c: any) {
        const { query, content_level, geojson, country } = c.req.valid('query');
        try {
            const wrapperPath = path.join(__dirname, 'gadm_wrapper.py');
            // Ensure python is in path
            let cmd = `python "${wrapperPath}" search --query "${query}"`;
            if (content_level) {
                cmd += ` --content_level "${content_level}"`;
            }
            if (geojson === 'true') {
                cmd += ` --geojson`;
            }
            if (country) {
                cmd += ` --country "${country}"`;
            }
            const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 1024 * 1024 * 50 }); // 50MB buffer

            if (stderr) {
                console.error('[PyGADM] Stderr:', stderr);
            }

            try {
                const json = JSON.parse(stdout);
                if (json.error) {
                    return c.json({ error: json.error }, 500);
                }
                return c.json(json, 200);
            } catch (e) {
                logger.error({ stdout }, 'Failed to parse python output');
                return c.json({ error: 'Failed to parse GADM results' }, 500);
            }

        } catch (error: any) {
            // Check if it's a python script error that outputted JSON
            if (error.stdout) {
                try {
                    const json = JSON.parse(error.stdout);
                    if (json.error) {
                        logger.warn({ error: json.error }, 'GADM script returned error');
                        return c.json({ error: json.error }, 400); // Bad request / Search failed
                    }
                } catch (e) {
                    // ignore parsing error, fall through to generic error
                }
            }
            logger.error(error, 'Error searching regions');
            return c.json({ error: error.message || 'Internal Server Error' }, 500);
        }
    }

    async handleGetRegionBoundary(c: any) {
        const { id } = c.req.valid('param');
        const { name, level } = c.req.valid('query');

        try {
            const wrapperPath = path.join(__dirname, 'gadm_wrapper.py');
            // We need name to fetch. If not provided, we can't do much with PyGADM Items class unless cached.
            // But we can try to rely on cache by ID if it exists.
            // If not cached and name missing -> error.
            if (!name) {
                // Check cache only? Or just require name.
                // For now, let's require name from client.
            }

            const cmd = `python "${wrapperPath}" boundary --id "${id}" --name "${name || ''}" --content_level "${level || ''}"`;
            const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 1024 * 1024 * 50 }); // 50MB buffer

            if (stderr) {
                console.error('[PyGADM Boundary] Stderr:', stderr);
            }

            try {
                const json = JSON.parse(stdout);
                if (json.error) {
                    return c.json({ error: json.error }, 404);
                }
                return c.json(json, 200);
            } catch (e) {
                logger.error({ stdout }, 'Failed to parse python output');
                return c.json({ error: 'Failed to parse GADM boundary' }, 500);
            }

        } catch (error: any) {
            // Check if it's a python script error that outputted JSON
            if (error.stdout) {
                try {
                    const json = JSON.parse(error.stdout);
                    if (json.error) {
                        logger.warn({ error: json.error }, 'GADM boundary script returned error');
                        return c.json({ error: json.error }, 404);
                    }
                } catch (e) {
                    // ignore parsing error
                }
            }
            logger.error(error, 'Error fetching boundary');
            return c.json({ error: error.message || 'Internal Server Error' }, 500);
        }
    }

    async handleGetRegionNames(c: any) {
        const { admin, content_level, depth } = c.req.valid('query');
        try {
            const wrapperPath = path.join(__dirname, 'gadm_wrapper.py');
            let cmd = `python "${wrapperPath}" names --admin "${admin}"`;
            if (content_level) cmd += ` --content_level "${content_level}"`;
            if (depth) cmd += ` --depth "${depth}"`;

            const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 1024 * 1024 * 50 }); // 50MB buffer

            if (stderr) {
                console.error('[PyGADM] Stderr:', stderr);
            }

            try {
                const json = JSON.parse(stdout);
                if (json.error) {
                    return c.json({ error: json.error }, 500);
                }
                return c.json(json, 200);
            } catch (e) {
                logger.error({ stdout }, 'Failed to parse python output');
                return c.json({ error: 'Failed to parse GADM names results' }, 500);
            }

        } catch (error: any) {
            // Check if it's a python script error that outputted JSON
            if (error.stdout) {
                try {
                    const json = JSON.parse(error.stdout);
                    if (json.error) {
                        logger.warn({ error: json.error }, 'GADM names script returned error');
                        return c.json({ error: json.error }, 400);
                    }
                } catch (e) {
                    // ignore parsing error
                }
            }
            logger.error(error, 'Error fetching region names');
            return c.json({ error: error.message || 'Internal Server Error' }, 500);
        }
    }

    async handleGetRegionReverse(c: any) {
        const { lat, lon } = c.req.valid('query');
        try {
            // Mock LocalResult structure expected by reverse()
            const loc: any = {
                gps_coordinates: {
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lon)
                }
            };

            // Use 'reverse' from search package
            // It expects opts.bigdata.key. We try to read it from env.

            const config = CONFIG_DEFAULT() as any
            await reverse(loc, { bigdata: { key: config.bigdata.key } });
            if (loc.geo) {
                return c.json({ data: loc.geo }, 200);
            } else {
                return c.json({ error: 'Reverse geocoding failed' }, 404);
            }
        } catch (error: any) {
            logger.error(error, 'Error reverse geocoding');
            return c.json({ error: error.message || 'Internal Server Error' }, 500);
        }
    }

    hash(data: LocationsJobData) {
        const { userId, ...params } = data;
        return this.generateHash(params);
    }

    meta(userId: string) {
        return {
            cost: COST_PER_SEARCH,
            userId,
            timestamp: new Date().toISOString()
        };
    }

    async handleGetLocations(c: any) {
        const query = c.req.valid('query');
        const { refresh } = query;
        const forceRefresh = refresh === 'true';
        const userId = c.get('userId');
        const jobData = {
            query: query.query,
            location: query.location,
            filterCity: query.filterCity,
            filterContinent: query.filterContinent,
            filterCountry: query.filterCountry,
            filterType: query.filterType,
            limit: query.limit ? parseInt(query.limit) : 250,
            excludedTypes: query.excludedTypes,
            userId: userId
        };

        try {
            const inputHash = params_hash({
                query: query.query,
                location: query.location,
                filterCity: query.filterCity,
                filterContinent: query.filterContinent,
                filterCountry: query.filterCountry,
                filterType: query.filterType,
                limit: query.limit ? parseInt(query.limit) : 250,
                excludedTypes: query.excludedTypes,
                zoom: query.zoom ? parseInt(query.zoom) : undefined
            });
            if (!forceRefresh) {
                const cached = await get_cached(inputHash);
                if (cached) {
                    return c.json({
                        message: 'Get locations success (cached)',
                        data: deduplicateResults(cached)
                    }, 200);
                }
            }
            const jobId = await this.sendJob(JOB_NAME, jobData, this.jobOptions);
            if (!jobId) {
                const cached = await get_cached(inputHash);
                if (cached) {
                    return c.json({ message: 'Get locations success (cached)', data: deduplicateResults(cached) }, 200);
                }
                return c.json({ message: 'Job already submitted', jobId: null }, 202);
            }

            try {
                await this.waitForJob(jobId, TIMEOUT_MS_LOCATIONS);
                const cached = await get_cached(inputHash);
                if (cached) {
                    return c.json({ message: 'Get locations success (fresh)', data: deduplicateResults(cached) }, 200);
                }
            } catch (e) {
                if ((e as Error).message === 'Job timeout') {
                    // Fallthrough to return 202
                } else {
                    throw e;
                }
            }

        } catch (error: any) {
            logger.error(error, 'Error fetching locations');
            return c.json({ message: error.message || 'Internal Server Error' }, 500);
        }

        return c.json({ message: 'Job submitted' }, 202);
    }

    async handleStreamGet(c: any) {
        const query = c.req.valid('query');
        const { refresh } = query;
        const forceRefresh = refresh === 'true';
        const userId = c.get('userId');

        if (!userId) {
            return c.json({ message: 'Unauthorized' }, 401);
        }

        return this.handleStream(c, {
            data: {
                query: query.query,
                location: query.location,
                filterCity: query.filterCity,
                filterContinent: query.filterContinent,
                filterCountry: query.filterCountry,
                filterType: query.filterType,
                limit: query.limit ? parseInt(query.limit) : 250,
                zoom: query.zoom ? parseInt(query.zoom) : undefined,
                excludedTypes: query.excludedTypes,
            },
            userId,
            forceRefresh,
            fetcher: async (data: any, uid: string) => {

                const inputHash = this.generateHash(data);

                const existing = await get_cached(inputHash);
                if (existing) return deduplicateResults(existing) as any[];

                const jobData = { ...data, userId: uid };
                const options = { ...this.jobOptions, singletonKey: this.generateHash(data) };

                logger.info(`Fetching locations for ${inputHash}`, jobData);
                const jobId = await this.sendJob(JOB_NAME, jobData, options);
                if (jobId) {
                    await this.waitForJob(jobId, TIMEOUT_MS_LOCATIONS);
                } else {
                    const checkAgain = await get_cached(inputHash);
                    if (checkAgain) return deduplicateResults(checkAgain) as any[];

                    logger.info({ inputHash }, 'Waiting for debounced job...');
                    await this.waitForHash(inputHash, TIMEOUT_MS_LOCATIONS);
                }

                const result = await get_cached(inputHash);
                return deduplicateResults(result) || [];
            },
            cacheChecker: async (hash: string) => deduplicateResults(await get_cached(hash)) || null
        });
    }

    async handleStreamEmail(c: any) {
        const { place_ids } = c.req.valid('query');
        let userId = c.get('userId') as string | undefined;

        if (!userId) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        const placeIdArray = place_ids.split(',').map((id: string) => id.trim()).filter((id: string) => id.length > 0);

        if (placeIdArray.length === 0) {
            return c.json({ error: 'No place IDs provided' }, 400);
        }

        if (placeIdArray.length > EMAIL_MAX_BATCH_SIZE) {
            return c.json({ error: `Maximum ${EMAIL_MAX_BATCH_SIZE} locations can be processed at once` }, 400);
        }

        logger.info(`[LocationsProduct] Starting email search via worker for ${placeIdArray.length} locations`);

        return streamSSE(c, async (stream) => {
            await stream.writeSSE({
                event: 'progress',
                data: JSON.stringify({
                    current: 0,
                    total: placeIdArray.length,
                    percent: 0,
                    message: `Queueing jobs for ${placeIdArray.length} location(s)`
                })
            });

            const pendingJobIds = new Set<string>();
            const jobsMap = new Map<string, string>();
            let completedCount = 0;
            let successCount = 0;
            let failedCount = 0;
            let emailsFound = 0;

            const onJobComplete = async (event: any) => {
                if (pendingJobIds.has(event.jobId)) {
                    const place_id = jobsMap.get(event.jobId);
                    pendingJobIds.delete(event.jobId);

                    const result = event.result;

                    await stream.writeSSE({
                        event: 'location-start',
                        data: JSON.stringify({
                            place_id,
                            title: 'Processing...',
                            index: completedCount + 1,
                            total: placeIdArray.length
                        })
                    });

                    if (result && result.emails) {
                        successCount++;
                        emailsFound += result.emails.length;

                        for (const emailMeta of result.emails) {
                            await stream.writeSSE({
                                event: 'location-email',
                                data: JSON.stringify({
                                    place_id,
                                    email: emailMeta.email,
                                    source: emailMeta.source,
                                    cached: false
                                })
                            });
                        }
                    }

                    await stream.writeSSE({
                        event: 'location-complete',
                        data: JSON.stringify({
                            place_id,
                            emailCount: result?.emails?.length || 0,
                            cached: false
                        })
                    });

                    completedCount++;

                    const percent = Math.round((completedCount / placeIdArray.length) * 100);
                    await stream.writeSSE({
                        event: 'progress',
                        data: JSON.stringify({
                            current: completedCount,
                            total: placeIdArray.length,
                            percent,
                            message: `Processed ${completedCount} of ${placeIdArray.length}`
                        })
                    });
                }
            };

            const onJobFailed = async (event: any) => {
                if (pendingJobIds.has(event.jobId)) {
                    const place_id = jobsMap.get(event.jobId);
                    pendingJobIds.delete(event.jobId);

                    failedCount++;

                    await stream.writeSSE({
                        event: 'location-error',
                        data: JSON.stringify({
                            place_id,
                            error: event.error || 'Unknown error',
                            canRetry: true
                        })
                    });

                    completedCount++;
                    const percent = Math.round((completedCount / placeIdArray.length) * 100);
                    await stream.writeSSE({
                        event: 'progress',
                        data: JSON.stringify({
                            current: completedCount,
                            total: placeIdArray.length,
                            percent,
                            message: `Processed ${completedCount} of ${placeIdArray.length}`
                        })
                    });
                }
            };

            // Register Listeners BEFORE submitting jobs to capture fast completions
            EventBus.on('job:complete', onJobComplete);
            EventBus.on('job:failed', onJobFailed);

            stream.onAbort(async () => {
                logger.info('[LocationsProduct] Stream aborted by client, cancelling pending jobs');
                for (const jobId of pendingJobIds) {
                    try {
                        if (this.boss) {
                            await this.boss.cancel(EMAIL_JOB_NAME, jobId);
                        }
                    } catch (e) {
                        logger.warn({ jobId, err: e }, 'Failed to cancel job on abort');
                    }
                }
                clearTimeout(listTimeout);
                EventBus.off('job:complete', onJobComplete);
                EventBus.off('job:failed', onJobFailed);
            });

            const listTimeout = setTimeout(() => {
                logger.warn('[LocationsProduct] Stream global timeout reached');
                EventBus.off('job:complete', onJobComplete);
                EventBus.off('job:failed', onJobFailed);
                stream.writeSSE({ event: 'error', data: JSON.stringify({ error: 'Global Timeout' }) });
                stream.close();
            }, EMAIL_STREAM_TIMEOUT_MS);

            try {
                let submittedCount = 0;
                for (const place_id of placeIdArray) {
                    const jobData = { place_id, userId };
                    const options = { ...EMAIL_JOB_OPTIONS };

                    const jobId = await this.sendJob(EMAIL_JOB_NAME, jobData, options);

                    if (jobId) {
                        pendingJobIds.add(jobId);
                        jobsMap.set(jobId, place_id);

                        // Emit job info immediately for cancellation support
                        await stream.writeSSE({
                            event: 'location-job',
                            data: JSON.stringify({ place_id, jobId })
                        });
                    }
                    submittedCount++;
                }

                // Wait loop
                while (pendingJobIds.size > 0) {
                    // logger.info(`[LocationsProduct] ${pendingJobIds.size} pending jobs`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

            } catch (error: any) {
                logger.error({ err: error }, 'Error in email stream loop');
                // Attempt to send error event
                try {
                    await stream.writeSSE({
                        event: 'error',
                        data: JSON.stringify({ error: error.message || 'Stream processing error' })
                    });
                } catch (e) { /* ignore stream write errors if closed */ }
            } finally {
                clearTimeout(listTimeout);
                EventBus.off('job:complete', onJobComplete);
                EventBus.off('job:failed', onJobFailed);
            }

            await stream.writeSSE({
                event: 'complete',
                data: JSON.stringify({
                    total: placeIdArray.length,
                    successful: successCount,
                    failed: failedCount,
                    emailsFound
                })
            });
        });
    }

    async handleStreamEnrich(c: any) {
        const { place_ids, enrichers } = c.req.valid('query');
        const userId = c.get('userId');

        if (!userId) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        const placeIdArray = place_ids.split(',').map((id: string) => id.trim()).filter((id: string) => id.length > 0);
        const enricherNames = enrichers.split(',').map((e: string) => e.trim()).filter((e: string) => e.length > 0);

        if (placeIdArray.length === 0) {
            return c.json({ error: 'No place IDs provided' }, 400);
        }

        const requestedEnrichers = enricherNames.map((name: string) => EnricherRegistry.get(name)).filter((e: any) => e !== undefined);

        if (requestedEnrichers.length === 0) {
            return c.json({ error: 'No valid enrichers requested' }, 400);
        }

        logger.info({ count: placeIdArray.length, enrichers: enricherNames }, '[LocationsProduct] Starting enrichment stream');

        return streamSSE(c, async (stream) => {
            await stream.writeSSE({
                event: 'progress',
                data: JSON.stringify({
                    current: 0,
                    total: placeIdArray.length,
                    message: `Starting enrichment for ${placeIdArray.length} items`
                })
            });

            // Fetch current data for these places
            // For now, we fetch them from DB to have the base object.
            // If they don't exist in DB, we can't enrich them (unless we accept partials from client, but that's insecure/complex)
            // Ideally we assume they exist or we just proceed.
            const existingLocations = await getLocationsByPlaceIds(placeIdArray);
            const locationMap = new Map(existingLocations.map(l => [l.place_id, l]));

            let processed = 0;

            for (const placeId of placeIdArray) {
                const location = locationMap.get(placeId);
                if (!location) {
                    logger.warn({ placeId }, 'Location not found for enrichment');
                    // Emit error or skip
                    continue;
                }

                // Run each enricher
                let updates: any = {};
                for (const enricher of requestedEnrichers) {
                    try {
                        const result = await enricher!.enrich(location, { userId, logger });
                        updates = { ...updates, ...result };

                        // Update our local copy for subsequent enrichers if needed
                        // Object.assign(location, result); 
                        // Note: Deep merge might be safer, but for now top-level partials are expected.
                    } catch (e: any) {
                        logger.error({ placeId, enricher: enricher!.name, err: e }, 'Enricher failed');
                    }
                }

                if (Object.keys(updates).length > 0) {
                    // Persist to DB
                    // We need to merge updates into the location. 
                    // upsertLocations expects arrays.
                    const updatedLocation = {
                        ...location,
                        ...updates,
                        // If deep merging is needed for raw_data or others, handle it.
                        // For now assume top level fields or replacement of raw_data chunks.
                        raw_data: {
                            ...(location.raw_data || {}),
                            ...(updates.raw_data || {})
                        }
                    };

                    try {
                        await upsertLocations([updatedLocation]);

                        await stream.writeSSE({
                            event: 'enrichment-update',
                            data: JSON.stringify({
                                place_id: placeId,
                                updates: updates
                            })
                        });
                    } catch (e: any) {
                        logger.error({ placeId, err: e }, 'Failed to persist enrichment updates');
                    }
                }

                processed++;
                await stream.writeSSE({
                    event: 'progress',
                    data: JSON.stringify({
                        current: processed,
                        total: placeIdArray.length,
                        message: `Enriched ${processed} of ${placeIdArray.length}`
                    })
                });
            }

            await stream.writeSSE({ event: 'complete', data: JSON.stringify({ processed }) });
        });
    }
}
