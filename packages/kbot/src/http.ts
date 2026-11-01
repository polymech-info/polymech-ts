import * as path from 'node:path'
import * as fs from 'node:fs'
import axios from 'axios'
import TurndownService from 'turndown'
import { sync as dir } from '@polymech/fs/dir'
import { sync as exists } from '@polymech/fs/exists'
import { sync as write } from '@polymech/fs/write'
import { sync as read } from '@polymech/fs/read'
import { logger } from './index.js'
import { IHandlerResult } from './mime-handlers.js'

const turndown = new TurndownService()
const CACHE_DIR = './.cache/https'
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 1 week in milliseconds

/**
 * Create cache key from URL
 */
function createCacheKey(url: string): string {
  // Remove protocol and convert special characters to create a valid filename
  return url.replace(/^https?:\/\//, '').replace(/[\/\?=&]/g, '_')
}

/**
 * Check if cache is valid (exists and not expired)
 */
function isCacheValid(cacheFile: string): boolean {
  if (!exists(cacheFile)) {
    return false
  }
  
  try {
    const stats = fs.statSync(cacheFile)
    const ageMs = Date.now() - stats.mtimeMs
    return ageMs < CACHE_EXPIRY
  } catch (error) {
    logger.error(`Error checking cache validity for ${cacheFile}:`, error)
    return false
  }
}

/**
 * Process HTML content into markdown
 */
export function processHtml(html: string): string {
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
      const element = node as HTMLElement;
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
export async function fetchUrl(url: string): Promise<{ content: string, contentType: string, isProcessed: boolean }> {
  // Ensure cache directory exists
  if (!exists(CACHE_DIR)) {
    dir(CACHE_DIR)
  }
  
  const cacheKey = createCacheKey(url)
  const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`)
  
  if (isCacheValid(cacheFile)) {
    try {
      const cached = read(cacheFile, 'json') as { content: string, contentType: string, isProcessed: boolean }
      if (cached && typeof cached === 'object' && 'content' in cached && 'contentType' in cached) {
        logger.debug(`Using cached content for ${url}`)
        return cached
      }
    } catch (error) {
      logger.error(`Error reading cache for ${url}:`, error)
      // Continue to fetch fresh content if cache read fails
    }
  }
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KBot/1.0)'
      },
      responseType: 'text'
    })
    
    const contentType = response.headers['content-type'] || 'text/html'
    let content = response.data
    let isProcessed = false
    
    // Always process HTML content into markdown before caching
    if (contentType.includes('html')) {
      content = processHtml(content)
      isProcessed = true
      logger.debug(`Converted HTML to markdown for ${url}`)
    }
    
    const result = {
      content,
      contentType,
      isProcessed
    }
    
    // Cache the processed result
    write(cacheFile, JSON.stringify(result))
    
    return result
  } catch (error) {
    logger.error(`Error fetching ${url}:`, error.message)
    throw new Error(`Failed to fetch ${url}: ${error.message}`)
  }
}

/**
 * Handle a web URL and return it in a format compatible with the get() function
 */
export async function handleWebUrl(url: string): Promise<IHandlerResult> {
  try {
    const { content, contentType, isProcessed } = await fetchUrl(url)
    
    if (contentType.includes('json')) {
      // Handle JSON response
      const jsonContent = typeof content === 'string' && !isProcessed ? JSON.parse(content) : content
      return {
        content: isProcessed ? content : `\`\`\`json\n${JSON.stringify(jsonContent, null, 2)}\n\`\`\``,
        path: url,
        role: 'user',
        name: `web_${createCacheKey(url)}`
      }
    } else {
      // Handle HTML response - already processed into markdown
      return {
        content: content,
        path: url,
        role: 'user',
        name: `web_${createCacheKey(url)}`
      }
    }
  } catch (error) {
    logger.error(`Error handling web URL ${url}:`, error)
    return {
      content: `Error fetching URL: ${url} - ${error.message}`,
      path: url,
      role: 'user',
      name: `web_${createCacheKey(url)}_error`
    }
  }
} 