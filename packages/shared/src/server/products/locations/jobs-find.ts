import { googleMaps, ResolveFlags } from '@polymech/search';
import { upsertLocations, storeSearch, getLocationsMeta } from './db.js';
import { supabase } from '../../commons/supabase.js';
import { params_hash } from './cache.js';
import { logger } from './logger.js';

export interface SearchParams {
    query: string;
    location: string;
    filterCity?: string;
    filterContinent?: string;
    filterCountry?: string;
    filterType?: string;
    concurrency?: number;
    limit?: number;
    zoom?: number;
    excludedTypes?: string[];
}

export const searchLocations = async (params: SearchParams, userId: string) => {
    logger.info({ params }, 'Fetching locations');

    const { query, location, filterCity, filterContinent, filterCountry, filterType, limit, zoom, excludedTypes } = params;

    // 1. Fetch from SerpApi
    const results = await googleMaps({
        query: query,
        searchFrom: location,
        resolve: [ResolveFlags.PHOTOS],
        filterCity,
        filterContinent,
        filterCountry,
        filterType,
        limit,
        zoom,
        excludedTypes
    });

    // Flatten results
    const flatResults = results ? results.flat(Infinity) : [];

    // 2. Map Results
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
            updated_at: new Date().toISOString(),
            user_id: userId
        }));

    // 2b. Update Known Types (Side Effect)
    if (userId) {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('settings')
                .eq('id', userId)
                .maybeSingle();

            const settings = profile?.settings || {};
            const knownTypes: string[] = Array.isArray(settings.known_types) ? settings.known_types : [];
            const newTypesSet = new Set(knownTypes);

            locationsToUpsert.forEach((l: any) => {
                if (l.types && Array.isArray(l.types)) {
                    l.types.forEach((t: string) => newTypesSet.add(t));
                }
            });

            if (newTypesSet.size > knownTypes.length) {
                const updatedKnownTypes = Array.from(newTypesSet).sort();
                await supabase
                    .from('profiles')
                    .update({
                        settings: { ...settings, known_types: updatedKnownTypes }
                    })
                    .eq('id', userId);
            }
        } catch (err) {
            logger.error(err, 'Error processing known types');
        }
    }

    // 3. Preserve Meta (Emails)
    // 2a. Deduplicate Locations (Fix 21000 error)
    const uniqueLocationsMap = new Map();
    locationsToUpsert.forEach((l: any) => {
        const pid = String(l.place_id).trim();
        // Ensure place_id is cleaned
        l.place_id = pid;

        if (!uniqueLocationsMap.has(pid)) {
            uniqueLocationsMap.set(pid, l);
        } else {
            logger.debug({ place_id: pid }, 'Duplicate place_id found in batch, skipping');
        }
    });
    const uniqueLocations = Array.from(uniqueLocationsMap.values());
    logger.info({
        total: locationsToUpsert.length,
        unique: uniqueLocations.length,
        diff: locationsToUpsert.length - uniqueLocations.length
    }, 'Deduplication stats');

    // 3. Preserve Meta (Emails)
    const placeIds = uniqueLocations.map((l: any) => l.place_id);
    if (placeIds.length > 0) {
        const existingLocations = await getLocationsMeta(placeIds);
        if (existingLocations) {
            const metaMap = new Map(existingLocations.map((l: any) => [l.place_id, l.meta]));
            uniqueLocations.forEach((l: any) => {
                const existingMeta = metaMap.get(l.place_id);
                if (existingMeta) {
                    l.raw_data.meta = {
                        ...(l.raw_data.meta || {}),
                        ...existingMeta
                    };
                }
            });
        }
    }

    // 4. Upsert Locations & Store Search
    try {
        // Attempt single batch upsert for performance
        logger.info({ count: uniqueLocations.length }, 'Attempting batch upsert');
        await upsertLocations(uniqueLocations);
        logger.info({ count: uniqueLocations.length }, 'Batch upsert successful');
    } catch (err: any) {
        // Fallback to serial processing if duplicates exist within batch (Postgres 21000)
        // or any other batch-level error that might be resolvable row-by-row
        logger.warn({ err }, 'Batch upsert failed, falling back to sequential upserts');

        // Execute upserts sequentially to safely handle "ON CONFLICT ... row a second time"
        // This effectively implements "Last Write Wins" for duplicates in the batch
        for (const loc of uniqueLocations) {
            try {
                await upsertLocations([loc]);
            } catch (innerErr) {
                logger.error({ place_id: loc.place_id, err: innerErr }, 'Failed to upsert individual location');
                // Continue processing others
            }
        }
    }

    await storeSearch(params_hash({
        query,
        location,
        filterCity,
        filterContinent,
        filterCountry,
        filterType,
        limit,
        zoom,
        excludedTypes
    }), { query, location }, placeIds);

    return uniqueLocations;
};
