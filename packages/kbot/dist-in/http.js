import * as path from 'node:path';
import * as fs from 'node:fs';
import axios from 'axios';
import TurndownService from 'turndown';
import { sync as dir } from '@polymech/fs/dir';
import { sync as exists } from '@polymech/fs/exists';
import { sync as write } from '@polymech/fs/write';
import { sync as read } from '@polymech/fs/read';
import { logger } from './index.js';
const turndown = new TurndownService();
const CACHE_DIR = './.cache/https';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
/**
 * Create cache key from URL
 */
function createCacheKey(url) {
    // Remove protocol and convert special characters to create a valid filename
    return url.replace(/^https?:\/\//, '').replace(/[\/\?=&]/g, '_');
}
/**
 * Check if cache is valid (exists and not expired)
 */
function isCacheValid(cacheFile) {
    if (!exists(cacheFile)) {
        return false;
    }
    try {
        const stats = fs.statSync(cacheFile);
        const ageMs = Date.now() - stats.mtimeMs;
        return ageMs < CACHE_EXPIRY;
    }
    catch (error) {
        logger.error(`Error checking cache validity for ${cacheFile}:`, error);
        return false;
    }
}
/**
 * Process HTML content into markdown
 */
export function processHtml(html) {
    // Configure turndown with more aggressive options
    turndown.addRule('removeScripts', {
        filter: ['script', 'style', 'iframe', 'noscript'],
        replacement: () => ''
    });
    // Configure image handling
    turndown.addRule('images', {
        filter: 'img',
        replacement: (content, node) => {
            // Cast node to HTMLElement for TypeScript compatibility
            const element = node;
            const alt = element.getAttribute('alt') || '';
            const src = element.getAttribute('src') || '';
            return src ? `![${alt}](${src})` : '';
        }
    });
    // Clean up common wiki elements
    const cleanedHtml = html
        .replace(/<sup[^>]*class="reference[^>]*>.*?<\/sup>/g, '') // Remove reference links
        .replace(/<span[^>]*class="[^"]*citation[^"]*"[^>]*>.*?<\/span>/g, '') // Remove citation spans
        .replace(/<span[^>]*class="mw-parser-output[^>]*>(.*?)<\/span>/g, '$1'); // Clean wiki parser output
    return turndown.turndown(cleanedHtml);
}
/**
 * Fetch web content with caching
 */
export async function fetchUrl(url) {
    // Ensure cache directory exists
    if (!exists(CACHE_DIR)) {
        dir(CACHE_DIR);
    }
    const cacheKey = createCacheKey(url);
    const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`);
    if (isCacheValid(cacheFile)) {
        try {
            const cached = read(cacheFile, 'json');
            if (cached && typeof cached === 'object' && 'content' in cached && 'contentType' in cached) {
                logger.debug(`Using cached content for ${url}`);
                return cached;
            }
        }
        catch (error) {
            logger.error(`Error reading cache for ${url}:`, error);
            // Continue to fetch fresh content if cache read fails
        }
    }
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; KBot/1.0)'
            },
            responseType: 'text'
        });
        const contentType = response.headers['content-type'] || 'text/html';
        let content = response.data;
        let isProcessed = false;
        // Always process HTML content into markdown before caching
        if (contentType.includes('html')) {
            content = processHtml(content);
            isProcessed = true;
            logger.debug(`Converted HTML to markdown for ${url}`);
        }
        const result = {
            content,
            contentType,
            isProcessed
        };
        // Cache the processed result
        write(cacheFile, JSON.stringify(result));
        return result;
    }
    catch (error) {
        logger.error(`Error fetching ${url}:`, error.message);
        throw new Error(`Failed to fetch ${url}: ${error.message}`);
    }
}
/**
 * Handle a web URL and return it in a format compatible with the get() function
 */
export async function handleWebUrl(url) {
    try {
        const { content, contentType, isProcessed } = await fetchUrl(url);
        if (contentType.includes('json')) {
            // Handle JSON response
            const jsonContent = typeof content === 'string' && !isProcessed ? JSON.parse(content) : content;
            return {
                content: isProcessed ? content : `\`\`\`json\n${JSON.stringify(jsonContent, null, 2)}\n\`\`\``,
                path: url,
                role: 'user',
                name: `web_${createCacheKey(url)}`
            };
        }
        else {
            // Handle HTML response - already processed into markdown
            return {
                content: content,
                path: url,
                role: 'user',
                name: `web_${createCacheKey(url)}`
            };
        }
    }
    catch (error) {
        logger.error(`Error handling web URL ${url}:`, error);
        return {
            content: `Error fetching URL: ${url} - ${error.message}`,
            path: url,
            role: 'user',
            name: `web_${createCacheKey(url)}_error`
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9odHRwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxJQUFJLE1BQU0sV0FBVyxDQUFBO0FBQ2pDLE9BQU8sS0FBSyxFQUFFLE1BQU0sU0FBUyxDQUFBO0FBQzdCLE9BQU8sS0FBSyxNQUFNLE9BQU8sQ0FBQTtBQUN6QixPQUFPLGVBQWUsTUFBTSxVQUFVLENBQUE7QUFDdEMsT0FBTyxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQTtBQUM5QyxPQUFPLEVBQUUsSUFBSSxJQUFJLE1BQU0sRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBQ3BELE9BQU8sRUFBRSxJQUFJLElBQUksS0FBSyxFQUFFLE1BQU0sb0JBQW9CLENBQUE7QUFDbEQsT0FBTyxFQUFFLElBQUksSUFBSSxJQUFJLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUNoRCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sWUFBWSxDQUFBO0FBR25DLE1BQU0sUUFBUSxHQUFHLElBQUksZUFBZSxFQUFFLENBQUE7QUFDdEMsTUFBTSxTQUFTLEdBQUcsZ0JBQWdCLENBQUE7QUFDbEMsTUFBTSxZQUFZLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQSxDQUFDLHlCQUF5QjtBQUV0RTs7R0FFRztBQUNILFNBQVMsY0FBYyxDQUFDLEdBQVc7SUFDakMsNEVBQTRFO0lBQzVFLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQTtBQUNsRSxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLFlBQVksQ0FBQyxTQUFpQjtJQUNyQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7UUFDdkIsT0FBTyxLQUFLLENBQUE7SUFD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