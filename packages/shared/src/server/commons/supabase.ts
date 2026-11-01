import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

import { logger } from './logger.js'

if (!supabaseUrl || !supabaseKey) {
    logger.error({
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        env: process.env.NODE_ENV
    }, 'Missing Supabase environment variables');
    // process.exit(1) // Don't exit in test mode, throw instead
    if (process.env.NODE_ENV !== 'test') process.exit(1);
    throw new Error('Missing Supabase environment variables: URL or Key is undefined');
}

export const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Test Supabase connection by attempting a simple query
 */
export async function testSupabaseConnection(): Promise<boolean> {
    try {
        const { error } = await supabase.from('products').select('id').limit(1)
        return !error
    } catch {
        return false
    }
}
