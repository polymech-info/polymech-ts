
/**
 * Formats a date string to a relative time (e.g. "5m ago", "2h ago", "3d ago")
 * if less than 7 days, otherwise returns a short date (e.g. "Oct 24").
 */
export const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 7) {
        if (days === 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours === 0) {
                const minutes = Math.floor(diff / (1000 * 60));
                return `${minutes}m ago`;
            }
            return `${hours}h ago`;
        }
        return `${days}d ago`;
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/**
 * Checks if a title string looks like a filename.
 * Used to hide titles that aren't meaningful user descriptions.
 */
export const isLikelyFilename = (title: string) => {
    if (!title) return false;

    // Check for common file extensions
    // Expanded list to catch more cases
    if (/\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|mkv|webm|heic|tiff|bmp|svg)$/i.test(title)) return true;

    // Check for date-like filenames (e.g. 2023-10-24, IMG_2023...)
    if (/^[\d_-]+$/.test(title)) return true; // Only numbers, dashes, underscores
    if (/^(IMG|VID|DSC|P|MOV)[\d_-]+/i.test(title)) return true; // Camera prefixes
    if (/^\d{4}[-_]\d{2}[-_]\d{2}/.test(title)) return true; // Date start

    // Check for screenshot patterns
    if (/^Screenshot_/.test(title)) return true;
    if (/^Screen\s?Shot/.test(title)) return true;

    return false;
};
