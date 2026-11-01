import { CompetitorFull, LocationType } from '@polymech/shared'
import { supabase } from '../../commons/supabase.js'

/**
 * Shared utility to fetch location details by place_id
 * Used by both competitor details and find email endpoints
 */
export async function getLocationByPlaceId(place_id: string): Promise<LocationType | null> {

    const { data: location, error } = await supabase
        .from('locations')
        .select('*')
        .eq('place_id', place_id)
        .single()

    if (error || !location) {
        return null
    }

    return location
}
