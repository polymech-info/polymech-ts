/**
 * Formats a date string to a relative time (e.g. "5m ago", "2h ago", "3d ago")
 * if less than 7 days, otherwise returns a short date (e.g. "Oct 24").
 */
export declare const formatDate: (dateStr?: string) => string;
/**
 * Checks if a title string looks like a filename.
 * Used to hide titles that aren't meaningful user descriptions.
 */
export declare const isLikelyFilename: (title: string) => boolean;
