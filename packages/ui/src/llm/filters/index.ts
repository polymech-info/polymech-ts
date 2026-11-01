/**
 * Main filter API interface
 * Provides a simple, clean API for the context-aware filter system
 */

import { TemplateContext, FilterOptions, FilterResult } from './types';
import { getContextDefinition, getContextDefaultFilters } from './contexts';
import { routeProvider, validateProvider } from './providers';
import { buildPrompt, getTemplateProvider, getTemplateModel, getTemplateFilters } from './templates';
import { applyFilters } from './base-filters';

/**
 * Main filter function - the primary API for the filter system
 * 
 * @param content - The content to filter
 * @param template - The template name to use (default: 'howto')
 * @param options - Filter options including context, provider, etc.
 * @returns Promise<string> - The filtered content
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const result = await filter("Some content to process", "keywords");
 * 
 * // With context and options
 * const result = await filter("Content", "brief", {
 *   context: TemplateContext.MAKER_TUTORIALS,
 *   provider: "openai",
 *   customFilters: [{ category: "content", flag: "spellCheck", enabled: true }]
 * });
 * ```
 */
export const filter = async (
  content: string,
  template: string = 'howto',
  options: FilterOptions = {}
): Promise<string> => {
  const startTime = Date.now();
  
  try {
    // Set defaults
    const context = options.context || TemplateContext.COMMONS;
    const provider = options.provider || 'openai';
    const model = options.model || 'gpt-4o-mini';
    
    // Validate inputs
    if (!content || content.trim().length === 0) {
      throw new Error('Content cannot be empty');
    }
    
    // Get template configuration
    const templateProvider = getTemplateProvider(context, template);
    const templateModel = getTemplateModel(context, template);
    const templateFilters = getTemplateFilters(context, template);
    
    // Use template provider/model if not specified in options
    const finalProvider = provider === 'openai' ? templateProvider : provider;
    const finalModel = model === 'gpt-4o-mini' ? templateModel : model;
    
    // Validate provider configuration
    if (!validateProvider(finalProvider, finalModel)) {
      throw new Error(`Invalid provider/model combination: ${finalProvider}/${finalModel}`);
    }
    
    // Build prompt with content, variables, and enabled instruction flags
    const prompt = buildPrompt(context, template, content, options.variables, options.customFilters);
    
    // Apply base filters first (if any)
    let processedContent = content;
    if (templateFilters.length > 0) {
      processedContent = applyFilters(content, templateFilters);
    }
    
    // Generate AI response
    const aiResponse = await routeProvider(finalProvider, finalModel, prompt, options.apiKey);
    
    if (!aiResponse) {
      throw new Error('AI generation failed');
    }
    
    // Apply custom filters to the AI response
    let finalContent = aiResponse;
    if (options.customFilters && options.customFilters.length > 0) {
      const enabledFilters = options.customFilters
        .filter(f => f.enabled)
        .map(f => f.flag);
      
      if (enabledFilters.length > 0) {
        finalContent = applyFilters(finalContent, enabledFilters);
      }
    }
    
    // Apply context default filters
    const contextDefaults = getContextDefaultFilters(context);
    const defaultFilterList = Object.values(contextDefaults).flat();
    if (defaultFilterList.length > 0) {
      finalContent = applyFilters(finalContent, defaultFilterList);
    }
    
    const processingTime = Date.now() - startTime;
    console.debug(`Filter processing completed in ${processingTime}ms`);
    
    return finalContent;
    
  } catch (error: any) {
    console.error('Filter processing failed:', error);
    throw error;
  }
};

/**
 * Filter with detailed result information
 */
export const filterWithResult = async (
  content: string,
  template: string = 'howto',
  options: FilterOptions = {}
): Promise<FilterResult> => {
  const startTime = Date.now();
  
  try {
    const result = await filter(content, template, options);
    const processingTime = Date.now() - startTime;
    
    return {
      success: true,
      content: result,
      processingTime,
      filtersApplied: [
        ...getTemplateFilters(options.context || TemplateContext.COMMONS, template),
        ...(options.customFilters?.filter(f => f.enabled).map(f => f.flag) || [])
      ]
    };
    
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    return {
      success: false,
      error: error.message,
      processingTime
    };
  }
};

/**
 * Batch filter multiple content pieces
 */
export const batchFilter = async (
  contentItems: Array<{ content: string; template?: string; options?: FilterOptions }>,
  globalOptions: FilterOptions = {}
): Promise<Array<{ success: boolean; content?: string; error?: string }>> => {
  const results = await Promise.allSettled(
    contentItems.map(item =>
      filter(
        item.content,
        item.template || 'howto',
        { ...globalOptions, ...item.options }
      )
    )
  );
  
  return results.map(result => {
    if (result.status === 'fulfilled') {
      return { success: true, content: result.value };
    } else {
      return { success: false, error: result.reason?.message || 'Unknown error' };
    }
  });
};

/**
 * Preview filter without applying AI generation
 * Useful for testing base filters and prompt construction
 */
export const previewFilter = (
  content: string,
  template: string = 'howto',
  options: FilterOptions = {}
): { prompt: string; baseFilters: string[]; customFilters: string[]; instructionFlags: string[] } => {
  const context = options.context || TemplateContext.COMMONS;
  
  // Build prompt with instruction flags
  const prompt = buildPrompt(context, template, content, options.variables, options.customFilters);
  
  // Get base filters
  const templateFilters = getTemplateFilters(context, template);
  
  // Get custom filters
  const customFilters = options.customFilters
    ?.filter(f => f.enabled)
    .map(f => f.flag) || [];
  
  // Get instruction flags that are enabled
  const instructionFlags = options.customFilters
    ?.filter(f => f.enabled)
    .map(f => `${f.category}:${f.flag}`) || [];
  
  return {
    prompt,
    baseFilters: templateFilters,
    customFilters,
    instructionFlags
  };
};

/**
 * Validate filter configuration
 */
export const validateFilterConfig = (
  template: string,
  options: FilterOptions = {}
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const context = options.context || TemplateContext.COMMONS;
  
  // Check if template exists for context
  try {
    const templateProvider = getTemplateProvider(context, template);
    const templateModel = getTemplateModel(context, template);
    
    if (!templateProvider) {
      errors.push(`Template '${template}' not found for context '${context}'`);
    }
    
    // Validate provider/model combination
    if (options.provider && options.model) {
      if (!validateProvider(options.provider, options.model)) {
        errors.push(`Invalid provider/model combination: ${options.provider}/${options.model}`);
      }
    }
    
  } catch (error: any) {
    errors.push(`Template validation failed: ${error.message}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Re-export types and utilities for convenience
export * from './types';
export * from './contexts';
export * from './providers';
export * from './templates';
export * from './base-filters';
export * from './instructions';

// Re-export provider-specific utilities
export type { OpenRouterModel, ModelInfo } from './providers/openrouter';
export type { OpenAIModelInfo } from './providers/openai';
export { groupModelsByCompany } from './providers/openrouter';
export { groupOpenAIModelsByType } from './providers/openai';

// Default export
export default filter;
