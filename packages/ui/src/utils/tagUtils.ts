import { z } from 'zod';

// Tag validation schema
export const tagSchema = z.string()
  .min(1, 'Tag cannot be empty')
  .max(50, 'Tag must be less than 50 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Tag can only contain letters, numbers, and underscores');

/**
 * Extract hashtags from text content
 * @param content - Text content to parse
 * @returns Array of unique tags (without # symbol)
 */
export function extractHashtags(content: string): string[] {
  if (!content) return [];
  
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const matches = content.match(hashtagRegex) || [];
  
  // Remove # symbol and deduplicate
  const tags = matches
    .map(tag => tag.substring(1))
    .filter(tag => {
      try {
        tagSchema.parse(tag);
        return true;
      } catch {
        return false;
      }
    });
  
  return [...new Set(tags)];
}

/**
 * Parse content into segments with hashtag information
 * @param content - Text content with hashtags
 * @returns Array of segments with type and content
 */
export interface ContentSegment {
  type: 'text' | 'hashtag';
  content: string;
}

export function parseHashtagContent(content: string): ContentSegment[] {
  if (!content) return [{ type: 'text', content: '' }];
  
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const parts = content.split(hashtagRegex);
  
  return parts.map((part, index) => {
    // Even indices are regular text, odd indices are hashtag content
    if (index % 2 === 0) {
      return { type: 'text', content: part };
    }
    
    // This is a hashtag - validate it
    try {
      tagSchema.parse(part);
      return { type: 'hashtag', content: part };
    } catch {
      // Invalid hashtag, render as regular text
      return { type: 'text', content: `#${part}` };
    }
  });
}

/**
 * Clean and normalize tag for URL usage
 */
export function normalizeTag(tag: string): string {
  return tag.toLowerCase().replace(/[^a-z0-9_]/g, '');
}