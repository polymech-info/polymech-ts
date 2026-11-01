import { Env } from 'hono'

export interface HonoEnv extends Env {
    Variables: {
        jobId?: string;
        userId?: string;
        usageId?: string;
        skipUsageStatusUpdate?: boolean;
    }
}
