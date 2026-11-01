import { supabase } from '@/commons/supabase.js';
import { logger } from './logger.js';


export const getSearchByHash = async (inputHash: string) => {
    const { data, error } = await supabase
        .from('searches')
        .select('result_place_ids')
        .eq('input_hash', inputHash)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
        logger.error({ err: error }, 'Error fetching search by hash');
    }
    return data;
};

export const getLocationsByPlaceIds = async (placeIds: string[]) => {
    if (placeIds.length === 0) return [];
    const { data, error } = await supabase
        .from('locations')
        .select('*')
        .in('place_id', placeIds);

    if (error) {
        logger.error({ err: error }, 'Error fetching locations');
        throw error;
    }
    return data;
};

export const getLocationsMeta = async (placeIds: string[]) => {
    if (placeIds.length === 0) return [];
    const { data, error } = await supabase
        .from('locations')
        .select('place_id, meta')
        .in('place_id', placeIds);

    if (error) {
        logger.error({ err: error }, 'Error fetching locations meta');
        return [];
    }
    return data;
}

export const upsertLocations = async (locations: any[]) => {
    if (locations.length === 0) return;
    const { error } = await supabase
        .from('locations')
        .upsert(locations, { onConflict: 'place_id' });

    if (error) {
        logger.error({ err: error }, 'Error upserting locations ');
        throw error;
    }
};

export const storeSearch = async (inputHash: string, inputParams: any, placeIds: string[]) => {
    const { error } = await supabase
        .from('searches')
        .upsert({
            input_hash: inputHash,
            input_params: inputParams,
            result_place_ids: placeIds,
            created_at: new Date().toISOString()
        }, { onConflict: 'input_hash' });

    if (error) {
        logger.error({ err: error }, 'Error storing search');
    }
};
