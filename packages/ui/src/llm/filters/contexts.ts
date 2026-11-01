/**
 * Context definitions and management for the filter system
 * Based on the reference implementation in ./ref/kbot/
 */

import { ContextDefinition, TemplateContext, KbotContext } from './types';

// Default context definitions
export const CONTEXT_DEFINITIONS: Record<TemplateContext, ContextDefinition> = {
  [TemplateContext.MAKER_TUTORIALS]: {
    name: TemplateContext.MAKER_TUTORIALS,
    displayName: 'Maker Tutorials',
    description: 'Templates for DIY and maker content',
    defaultTemplates: ['keywords', 'brief', 'references', 'tools', 'skills', 'local'],
    defaultFilters: {
      tone: ['formal'],
      content: ['spellCheck', 'removeEmojis', 'units'],
      moderation: ['mafiaFilter', 'deprogramming']
    },
    icon: 'wrench'
  },
  [TemplateContext.MARKETPLACE]: {
    name: TemplateContext.MARKETPLACE,
    displayName: 'Marketplace',
    description: 'Templates for product and commerce content',
    defaultTemplates: ['productDescription', 'pricingAnalysis', 'marketResearch'],
    defaultFilters: {
      tone: ['formal'],
      content: ['spellCheck', 'removeEmojis'],
      moderation: ['mafiaFilter']
    },
    icon: 'shopping-cart'
  },
  [TemplateContext.DIRECTORY]: {
    name: TemplateContext.DIRECTORY,
    displayName: 'Directory',
    description: 'Templates for listing and categorization content',
    defaultTemplates: ['categoryList', 'itemDetails', 'searchSuggestions'],
    defaultFilters: {
      tone: ['formal'],
      content: ['spellCheck'],
      format: ['structured']
    },
    icon: 'list'
  },
  [TemplateContext.COMMONS]: {
    name: TemplateContext.COMMONS,
    displayName: 'General Purpose',
    description: 'General-purpose templates for any content',
    defaultTemplates: ['simple', 'research'],
    defaultFilters: {
      tone: ['formal'],
      content: ['spellCheck', 'removeEmojis', 'shorten'],
      moderation: ['mafiaFilter', 'deprogramming']
    },
    icon: 'file-text'
  }
};

/**
 * Get context definition by name
 */
export const getContextDefinition = (context: TemplateContext): ContextDefinition => {
  return CONTEXT_DEFINITIONS[context];
};

/**
 * Get all available contexts
 */
export const getAllContexts = (): ContextDefinition[] => {
  return Object.values(CONTEXT_DEFINITIONS);
};

/**
 * Get context display name
 */
export const getContextDisplayName = (context: TemplateContext): string => {
  return CONTEXT_DEFINITIONS[context]?.displayName || context;
};

/**
 * Get context icon
 */
export const getContextIcon = (context: TemplateContext): string => {
  return CONTEXT_DEFINITIONS[context]?.icon || 'file-text';
};

/**
 * Get default templates for a context
 */
export const getContextDefaultTemplates = (context: TemplateContext): string[] => {
  return CONTEXT_DEFINITIONS[context]?.defaultTemplates || [];
};

/**
 * Get default filters for a context
 */
export const getContextDefaultFilters = (context: TemplateContext): Record<string, string[]> => {
  return CONTEXT_DEFINITIONS[context]?.defaultFilters || {};
};

/**
 * Check if a template is valid for a context
 */
export const isValidTemplateForContext = (context: TemplateContext, template: string): boolean => {
  const defaultTemplates = getContextDefaultTemplates(context);
  return defaultTemplates.includes(template);
};

/**
 * Convert context definition to reference format (for compatibility with ./ref/kbot)
 */
export const toKbotContext = (context: TemplateContext): KbotContext => {
  const definition = getContextDefinition(context);
  
  return {
    options: {}, // Will be populated by template engine
    instructions: {
      context: Object.entries(definition.defaultFilters).map(([category, filters]) => ({
        flag: category,
        text: `${category} filters: ${filters.join(', ')}`
      })),
      format: []
    },
    defaults: {
      context: Object.keys(definition.defaultFilters),
      format: []
    }
  };
};
