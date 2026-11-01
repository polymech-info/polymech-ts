// Locations Constants
export const COST_PER_SEARCH = parseInt(process.env.LOCATIONS_COST || '1');
export const TIMEOUT_MS_LOCATIONS = parseInt(process.env.LOCATIONS_TIMEOUT_MS || '300000');
export const MAX_CONCURRENCY_LOCATIONS = 1; // Kept hardcoded as it wasn't requested to be moved, but could be.

export const LOCATIONS_JOB_OPTIONS = {
    expireInSeconds: parseInt(process.env.LOCATIONS_JOB_EXPIRE_SECONDS || '600'),
    retryBackoff: true,
    retryDelayMax: parseInt(process.env.LOCATIONS_JOB_RETRY_DELAY_MAX || '1000')
};

// Email Constants
export const EMAIL_SEARCH_COST = parseInt(process.env.EMAIL_SEARCH_COST || '5');
export const EMAIL_MAX_BATCH_SIZE = parseInt(process.env.MAX_PLACES_PER_REQUEST || '100');

export const EMAIL_META_TIMEOUT_MS = parseInt(process.env.EMAIL_META_TIMEOUT_SECONDS || '30') * 1000;
export const EMAIL_SEARCH_TIMEOUT_MS = parseInt(process.env.EMAIL_SEARCH_TIMEOUT_SECONDS || '60') * 1000;
export const EMAIL_SEARCH_PAGE_TIMEOUT_MS = parseInt(process.env.EMAIL_SEARCH_PAGE_TIMEOUT_SECONDS || '10') * 1000;
export const EMAIL_SEARCH_MAX_PAGES = parseInt(process.env.EMAIL_SEARCH_MAX_PAGES || '15');
export const EMAIL_SEARCH_PAGE_CONCURRENCY = parseInt(process.env.EMAIL_SEARCH_PAGE_CONCURRENCY || '2');
export const EMAIL_STREAM_TIMEOUT_MS = parseInt(process.env.EMAIL_STREAM_TIMEOUT_SECONDS || '300') * 1000;
export const EMAIL_MAX_CONCURRENT_JOBS = parseInt(process.env.EMAIL_MAX_CONCURRENT_JOBS || '5');

export const JOB_NAME = 'locations-find';
export const EMAIL_JOB_NAME = 'email-find';

export enum JobPriority {
    Low = 10,
    Medium = 20,
    High = 30
}

export const EMAIL_JOB_OPTIONS = {
    priority: JobPriority.Medium,
    retryLimit: parseInt(process.env.EMAIL_JOB_RETRY_LIMIT || '1'),
    expireInSeconds: parseInt(process.env.EMAIL_JOB_EXPIRE_SECONDS || '60'),
};
