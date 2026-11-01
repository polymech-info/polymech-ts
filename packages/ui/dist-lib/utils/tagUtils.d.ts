import { z } from 'zod';
export declare const tagSchema: z.ZodString;
/**
 * Extract hashtags from text content
 * @param content - Text content to parse
 * @returns Array of unique tags (without # symbol)
 */
export declare function extractHashtags(content: string): string[];
/**
 * Parse content into segments with hashtag information
 * @param content - Text content with hashtags
 * @returns Array of segments with type and content
 */
export interface ContentSegment {
    type: 'text' | 'hashtag';
    content: string;
}
export declare function parseHashtagContent(content: string): ContentSegment[];
/**
 * Clean and normalize tag for URL usage
 */
export declare function normalizeTag(tag: string): string;
