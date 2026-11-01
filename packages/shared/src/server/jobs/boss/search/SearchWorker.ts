import { Job } from 'pg-boss';
import { AbstractWorker } from '../AbstractWorker.js';
import { googleMaps, ResolveFlags } from '@polymech/search';
import { supabase } from '../../../commons/supabase.js';
import { logger } from '../../../commons/logger.js';
import { Worker } from '../../../commons/decorators.js';
import { error } from 'console';

export interface SearchJobData {
    query: string;
    location: string;
    filters?: {
        filterCity?: string;
        filterContinent?: string;
        filterType?: string;
        concurrency?: number;
    };
    userId: string;
    usageId?: string;
}

@Worker('search-worker')
export class SearchWorker extends AbstractWorker<SearchJobData> {
    readonly queueName = 'search-worker';

    calculateCost(job: Job<SearchJobData>, result: any): number {
        // Example: 1 credit per search + 0.1 per result
        return 1 + (result?.length || 0) * 0.1;
    }

    protected async process(job: Job<SearchJobData>) {
        const { query, location, filters, userId } = job.data;

        // Call existing logic (refactored from endpoints/competitors/index.ts)
        const results = await googleMaps({
            query,
            searchFrom: location,
            resolve: [ResolveFlags.PHOTOS],
            filterCity: filters?.filterCity,
            filterContinent: filters?.filterContinent,
            filterType: filters?.filterType,
            concurrency: filters?.concurrency || 5
        });

        // Flatten results
        const flatResults = results ? results.flat(Infinity) : [];

        // Map and Upsert Locations
        const locationsToUpsert = flatResults
            .filter((r: any) => r.place_id)
            .map((r: any) => ({
                place_id: r.place_id,
                title: r.title,
                description: r.description,
                address: r.address,
                gps_coordinates: r.gps_coordinates,
                phone: r.phone,
                website: r.website,
                operating_hours: r.operating_hours,
                thumbnail: r.thumbnail,
                types: r.types,
                raw_data: r,
                continent: r.geo?.continent,
                country: r.geo?.countryName,
                city: r.geo?.city,
                updated_at: new Date().toISOString(), // Update timestamp
                user_id: userId
            }));

        // Fetch existing locations to preserve meta (emails)
        const placeIds = locationsToUpsert.map(l => l.place_id);
        if (placeIds.length > 0) {
            const { data: existingLocations } = await supabase
                .from('locations')
                .select('place_id, meta')
                .in('place_id', placeIds);

            if (existingLocations) {
                const metaMap = new Map(existingLocations.map(l => [l.place_id, l.meta]));
                locationsToUpsert.forEach(l => {
                    const existingMeta = metaMap.get(l.place_id);
                    if (existingMeta) {
                        // Merge existing meta into raw_data for the client
                        l.raw_data.meta = {
                            ...(l.raw_data.meta || {}),
                            ...existingMeta
                        };
                    }
                });
            }
        }

        if (locationsToUpsert.length > 0) {
            const { error: upsertError } = await supabase
                .from('locations')
                .upsert(locationsToUpsert, { onConflict: 'place_id' });

            if (upsertError) {
                logger.error(upsertError, 'Error upserting locations');
                throw upsertError;
            }
        }

        // Store Search (for caching)
        // Re-create hash logic from handler
        const { createHash } = await import('crypto');
        const inputParams = { query, location };
        const normalizedInput = JSON.stringify(inputParams, Object.keys(inputParams).sort());
        const inputHash = createHash('sha256').update(normalizedInput).digest('hex');

        const { error: searchStoreError } = await supabase
            .from('searches')
            .upsert({
                input_hash: inputHash,
                input_params: inputParams,
                result_place_ids: placeIds,
                created_at: new Date().toISOString()
            }, { onConflict: 'input_hash' });

        if (searchStoreError) {
            logger.error(searchStoreError, `Error storing search ${searchStoreError.message}`);
            // Don't fail the job just because caching failed
        }

        return { count: locationsToUpsert.length, placeIds };
    }
}
