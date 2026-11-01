/**
 * Base filter functions for common content transformations
 * These are reusable filters that can be applied to any content
 */

/**
 * Base filter function type
 */
export type BaseFilter = (content: string) => string;

/**
 * Spell check and grammar correction
 */
export const spellCheck: BaseFilter = (content: string): string => {
  // Simple spell check implementation
  // TODO: Integrate with a proper spell checking service
  return content
    .replace(/\bteh\b/gi, 'the')
    .replace(/\badn\b/gi, 'and')
    .replace(/\byou\s+can\s+do\s+it\b/gi, 'you can do it')
    .replace(/\bwont\b/gi, "won't")
    .replace(/\bcant\b/gi, "can't")
    .replace(/\bdont\b/gi, "don't")
    .replace(/\bdoesnt\b/gi, "doesn't")
    .replace(/\bisnt\b/gi, "isn't")
    .replace(/\barent\b/gi, "aren't")
    .replace(/\bwasnt\b/gi, "wasn't")
    .replace(/\bwerent\b/gi, "weren't")
    .replace(/\bhavent\b/gi, "haven't")
    .replace(/\bhasnt\b/gi, "hasn't")
    .replace(/\bhadnt\b/gi, "hadn't")
    .replace(/\bwouldnt\b/gi, "wouldn't")
    .replace(/\bcouldnt\b/gi, "couldn't")
    .replace(/\bshouldnt\b/gi, "shouldn't")
    .replace(/\bwont\b/gi, "won't")
    .replace(/\bive\b/gi, "I've")
    .replace(/\byouve\b/gi, "you've")
    .replace(/\bweve\b/gi, "we've")
    .replace(/\btheyve\b/gi, "they've")
    .replace(/\bim\b/gi, "I'm")
    .replace(/\byoure\b/gi, "you're")
    .replace(/\bwere\b/gi, "we're")
    .replace(/\btheyre\b/gi, "they're");
};

/**
 * Remove emojis from content
 */
export const removeEmojis: BaseFilter = (content: string): string => {
  // Remove common emojis and emoji-like characters
  return content
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Regional indicator symbols
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Miscellaneous symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols and Pictographs
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
    .trim();
};

/**
 * Convert units to standard format
 */
export const convertUnits: BaseFilter = (content: string): string => {
  return content
    // Temperature conversions
    .replace(/\b(\d+(?:\.\d+)?)\s*°[fF]\b/g, (match, temp) => {
      const celsius = ((parseFloat(temp) - 32) * 5 / 9).toFixed(1);
      return `${celsius}°C (${temp}°F)`;
    })
    // Length conversions
    .replace(/\b(\d+(?:\.\d+)?)\s*inches?\b/gi, (match, inches) => {
      const cm = (parseFloat(inches) * 2.54).toFixed(1);
      return `${cm}cm (${inches}")`;
    })
    .replace(/\b(\d+(?:\.\d+)?)\s*feet?\b/gi, (match, feet) => {
      const meters = (parseFloat(feet) * 0.3048).toFixed(2);
      return `${meters}m (${feet}ft)`;
    })
    // Weight conversions
    .replace(/\b(\d+(?:\.\d+)?)\s*lbs?\b/gi, (match, lbs) => {
      const kg = (parseFloat(lbs) * 0.453592).toFixed(2);
      return `${kg}kg (${lbs}lbs)`;
    });
};

/**
 * Remove links from content
 */
export const removeLinks: BaseFilter = (content: string): string => {
  return content
    .replace(/https?:\/\/[^\s]+/g, '[link]')
    .replace(/www\.[^\s]+/g, '[link]')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Markdown links
};

/**
 * Shorten content to specified length
 */
export const shorten = (maxLength: number = 100): BaseFilter => {
  return (content: string): string => {
    if (content.length <= maxLength) {
      return content;
    }
    
    // Find the last complete sentence within the limit
    const truncated = content.substring(0, maxLength);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?')
    );
    
    if (lastSentenceEnd > maxLength * 0.7) {
      return truncated.substring(0, lastSentenceEnd + 1);
    }
    
    // If no good sentence break, just truncate and add ellipsis
    return truncated.trim() + '...';
  };
};

/**
 * Format content as structured data
 */
export const formatStructured: BaseFilter = (content: string): string => {
  // Convert to markdown-like structure
  return content
    .replace(/^(\d+\.\s)/gm, '### $1') // Numbered lists to headers
    .replace(/^([A-Z][^.!?]*[.!?])/gm, '**$1**') // Sentences to bold
    .replace(/\n\s*\n/g, '\n\n'); // Clean up spacing
};

/**
 * Mafia filter - removes suspicious content patterns
 */
export const mafiaFilter: BaseFilter = (content: string): string => {
  const suspiciousPatterns = [
    /make\s+your\s+own\s+money/gi,
    /get\s+rich\s+quick/gi,
    /work\s+from\s+home\s+scam/gi,
    /pyramid\s+scheme/gi,
    /mlm\s+opportunity/gi,
    /no\s+experience\s+needed/gi,
    /earn\s+\$\d+/gi,
    /guaranteed\s+income/gi
  ];
  
  let filtered = content;
  suspiciousPatterns.forEach(pattern => {
    filtered = filtered.replace(pattern, '[content filtered]');
  });
  
  return filtered;
};

/**
 * Deprogramming filter - removes cult-like language
 */
export const deprogramming: BaseFilter = (content: string): string => {
  const cultPatterns = [
    /join\s+our\s+community/gi,
    /exclusive\s+access/gi,
    /secret\s+knowledge/gi,
    /life\s+changing/gi,
    /breakthrough/gi,
    /revolutionary/gi,
    /miracle/gi,
    /guaranteed\s+results/gi,
    /limited\s+time\s+offer/gi,
    /act\s+now/gi
  ];
  
  let filtered = content;
  cultPatterns.forEach(pattern => {
    filtered = filtered.replace(pattern, '[marketing language removed]');
  });
  
  return filtered;
};

/**
 * Registry of all available base filters
 */
export const BASE_FILTERS: Record<string, BaseFilter> = {
  spellCheck,
  removeEmojis,
  convertUnits,
  removeLinks,
  formatStructured,
  mafiaFilter,
  deprogramming
};

/**
 * Registry of parameterized filters
 */
export const PARAMETERIZED_FILTERS: Record<string, (param: any) => BaseFilter> = {
  shorten
};

/**
 * Apply a single filter to content
 */
export const applyFilter = (content: string, filterName: string, param?: any): string => {
  // Check parameterized filters first
  if (PARAMETERIZED_FILTERS[filterName]) {
    const filter = PARAMETERIZED_FILTERS[filterName](param);
    return filter(content);
  }
  
  // Check base filters
  if (BASE_FILTERS[filterName]) {
    return BASE_FILTERS[filterName](content);
  }
  
  console.warn(`Unknown filter: ${filterName}`);
  return content;
};

/**
 * Apply multiple filters to content in sequence
 */
export const applyFilters = (content: string, filterNames: string[], params?: Record<string, any>): string => {
  let result = content;
  
  for (const filterName of filterNames) {
    const param = params?.[filterName];
    result = applyFilter(result, filterName, param);
  }
  
  return result;
};

/**
 * Get available filter names
 */
export const getAvailableFilters = (): string[] => {
  return [
    ...Object.keys(BASE_FILTERS),
    ...Object.keys(PARAMETERIZED_FILTERS)
  ];
};
