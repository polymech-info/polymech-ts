import { Context, Next } from 'hono';
import { supabase } from '../commons/supabase.js';
import { logger } from '../commons/logger.js';
import { FunctionRegistry } from '../commons/registry.js';

export interface UsageData {
    userId: string;
    endpoint: string;
    method: string;
    product: string;
    action: string;
    responseStatus?: number;
    responseTimeMs?: number;
    costUnits: number;
    cancellable: boolean;
    metadata?: Record<string, any>;
    apiKeyId?: string;
    jobId?: string;
}

/**
 * Middleware to track API usage for billing and monitoring
 * Tracks request start and updates with completion status
 */
export async function usageTrackingMiddleware(c: Context, next: Next) {
    const startTime = Date.now();

    // Extract user ID from context (set by auth middleware)
    const userId = c.get('userId');
    // Skip tracking for unauthenticated requests
    if (!userId) {
        logger.trace('[UsageTracking] Skipping - No userId');
        await next();
        return;
    }

    // Determine product and action
    const path = c.req.path;
    const method = c.req.method;

    // Use Registry to find config
    const config = FunctionRegistry.findByRoute(path, method);
    const product = config?.productId;
    const action = config?.actionId;

    logger.trace(`[UsageTracking] Identified: product=${product}, action=${action}`);

    // Skip if not a tracked endpoint
    if (!product || !action || !config) {
        logger.info('[UsageTracking] Skipping - Not a tracked endpoint');
        await next();
        return;
    }

    // Generate a job ID for this request
    const jobId = `${product}_${action}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create initial usage record with 'processing' status
    let usageId: string | null = null;
    try {
        const { data, error } = await supabase
            .from('api_usage')
            .insert({
                user_id: userId,
                endpoint: path,
                method,
                product,
                action,
                status: 'processing',
                job_id: jobId,
                cancellable: config.cancellable || false,
                cost_units: config.costUnits,
                metadata: {
                    query: c.req.query(),
                    userAgent: c.req.header('user-agent'),
                    ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
                },
            })
            .select('id')
            .single();

        if (error) {
            logger.error({ err: error }, '[UsageTracking] Error creating usage record');
        } else if (data) {
            logger.trace(`[UsageTracking] Created usage record: ${data.id}`);
            usageId = data.id;
            // Store usage ID in context for potential use in handlers
            c.set('usageId', usageId);
            c.set('jobId', jobId);
        } else {
            logger.trace('[UsageTracking] No data returned from insert');
        }
    } catch (err) {
        logger.error({ err }, 'Failed to create usage record');
    }

    // Execute the request
    let requestError: Error | null = null;
    try {
        await next();
    } catch (err) {
        requestError = err as Error;
        throw err;  // Re-throw to let error handler deal with it
    } finally {
        // Update usage record with completion status
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        if (usageId) {
            // Check if handler requested to skip status update (e.g. for background jobs)
            const skipUpdate = c.get('skipUsageStatusUpdate');

            if (!skipUpdate) {
                updateUsageRecord({
                    usageId,
                    responseStatus: c.res.status,
                    responseTimeMs: responseTime,
                    error: requestError,
                }).catch(err => {
                    logger.error({ err }, 'Failed to update usage record');
                });
            }
        }
    }
}

/**
 * Update usage record with completion status
 */
export async function updateUsageRecord(data: {
    usageId: string;
    responseStatus: number;
    responseTimeMs: number;
    error?: Error | null;
}) {
    const status = data.error
        ? 'failed'
        : (data.responseStatus >= 200 && data.responseStatus < 300)
            ? 'completed'
            : 'failed';

    const updateData: any = {
        status,
        response_status: data.responseStatus,
        response_time_ms: data.responseTimeMs,
    };

    if (data.error) {
        updateData.error_message = data.error.message;
    }

    const { error } = await supabase
        .from('api_usage')
        .update(updateData)
        .eq('id', data.usageId);

    if (error) {
        logger.error({ err: error }, 'Error updating usage record');
    }
}

/**
 * Helper function to manually track usage (for non-middleware scenarios)
 */
export async function trackUsage(data: UsageData): Promise<string | null> {
    try {
        const { data: record, error } = await supabase
            .from('api_usage')
            .insert({
                user_id: data.userId,
                endpoint: data.endpoint,
                method: data.method,
                product: data.product,
                action: data.action,
                status: data.responseStatus ? 'completed' : 'processing',
                job_id: data.jobId,
                cancellable: data.cancellable,
                response_status: data.responseStatus,
                response_time_ms: data.responseTimeMs,
                cost_units: data.costUnits,
                metadata: data.metadata,
                api_key_id: data.apiKeyId,
            })
            .select('id')
            .single();

        if (error) {
            logger.error({ err: error }, 'Error tracking usage');
            return null;
        }

        return record?.id || null;
    } catch (err) {
        logger.error({ err }, 'Failed to track usage');
        return null;
    }
}
/**
 * Cancel a job by job ID
 */
export async function cancelJob(userId: string, jobId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('api_usage')
            .update({
                status: 'cancelled',
            })
            .eq('user_id', userId)
            .eq('job_id', jobId)
            .eq('cancellable', true)
            .in('status', ['pending', 'processing'])
            .select('id');

        if (error) {
            logger.error({ err: error }, 'Error cancelling job');
            return false;
        }

        return !!data && data.length > 0;
    } catch (err) {
        logger.error({ err }, 'Failed to cancel job');
        return false;
    }
}

/**
 * Get active (cancellable) jobs for a user
 */
export async function getActiveJobs(userId: string) {
    try {
        const { data, error } = await supabase
            .from('api_usage')
            .select('id, job_id, product, action, status, created_at, metadata')
            .eq('user_id', userId)
            .eq('cancellable', true)
            .in('status', ['pending', 'processing'])
            .order('created_at', { ascending: false });

        if (error) {
            logger.error({ err: error }, 'Error fetching active jobs');
            return [];
        }

        return data || [];
    } catch (err) {
        logger.error({ err }, 'Failed to fetch active jobs');
        return [];
    }
}

/**
 * Pause a job by job ID
 */
export async function pauseJob(userId: string, jobId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('api_usage')
            .update({
                status: 'paused',
            })
            .eq('user_id', userId)
            .eq('job_id', jobId)
            .eq('cancellable', true)
            .eq('status', 'processing') // Only processing jobs can be paused
            .select('id');

        if (error) {
            logger.error({ err: error }, 'Error pausing job');
            return false;
        }

        return !!data && data.length > 0;
    } catch (err) {
        logger.error({ err }, 'Failed to pause job');
        return false;
    }
}

/**
 * Resume a paused job by job ID
 */
export async function resumeJob(userId: string, jobId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('api_usage')
            .update({
                status: 'processing',
            })
            .eq('user_id', userId)
            .eq('job_id', jobId)
            .eq('cancellable', true)
            .eq('status', 'paused') // Only paused jobs can be resumed
            .select('id');

        if (error) {
            logger.error({ err: error }, 'Error resuming job');
            return false;
        }

        return !!data && data.length > 0;
    } catch (err) {
        logger.error({ err }, 'Failed to resume job');
        return false;
    }
}
