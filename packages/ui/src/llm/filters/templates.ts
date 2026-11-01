/**
 * Template management system for the filter system
 * Based on the reference implementation in ./ref/
 */

import { TemplateContext, TemplateConfig, KbotTemplate, KbotContext, FilterFlag, FilterFormat } from './types';
import { buildInstructionsPrompt } from './instructions';

// Template configurations based on reference implementation
const TEMPLATE_CONFIGS: Record<TemplateContext, Record<string, KbotTemplate>> = {
  [TemplateContext.MAKER_TUTORIALS]: {
    keywords: {
      router: 'openai',
      model: 'gpt-4o',
      preferences: 'none',
      mode: 'completion',
      prompt: 'Return a list of max. 10 keywords that can be used for SEO purposes, separated by commas (dont comment, just the list) : '
    },
    brief: {
      router: 'openai',
      model: 'gpt-4o',
      preferences: 'none',
      mode: 'completion',
      prompt: 'Create a concise description for SEO meta (around 150-160 characters) from the text below. \n  Disregard any links or image references. \n Return only the final meta description, no extra commentary.'
    },
    references: {
      model: 'perplexity/sonar-deep-research',
      preferences: 'none',
      mode: 'completion',
      prompt: 'Return a list of useful references, as Markdown, grouped : Articles, Books, Papers, Youtube, Software, Opensource Designs, ... Dont comment!',
      filters: 'code'
    },
    tools: {
      model: 'perplexity/sonar-deep-research',
      preferences: 'none',
      mode: 'completion',
      prompt: 'Extract the required tools: software, hardware from the following tutorial. Return as Markdown chapters (H3) with very short bullet points (not bold), max. 5 per category .'
    },
    skills: {
      router: 'openai',
      model: 'gpt-4o',
      preferences: 'none',
      mode: 'completion',
      prompt: 'Analyze the following tutorial and identify all the skills that a person would need in order to complete the project. Return as JSON with this structure:\n\n{\n  "skills": [\n    {\n      "name": "Skill name", \n      "level": "Beginner, Intermediate, or Advanced", \n      "description": "Brief description of where/how this skill is needed"\n    }\n  ],\n  "prerequisiteKnowledge": [\n    "Background knowledge or familiarity with concepts"\n  ],\n  "safetyConsiderations": [\n    "Any safety considerations or precautions needed"\n  ]\n}\n\nReturn only the JSON. No introductions or explanations.',
      filters: 'code'
    },
    local: {
      model: 'perplexity/sonar-deep-research',
      preferences: 'none',
      mode: 'completion',
      prompt: 'Markdown chapter (h4) with a list of local resources, services & suppliers, max. 5, with links,group by category. dont comment, just the list',
      filters: 'code'
    }
  },
  [TemplateContext.MARKETPLACE]: {
    productDescription: {
      router: 'openai',
      model: 'gpt-4o',
      preferences: 'none',
      mode: 'completion',
      prompt: 'Write a clear and concise product description that highlights the key features and benefits. Include technical specifications where relevant.',
      filters: 'code'
    },
    pricingAnalysis: {
      router: 'openai',
      model: 'gpt-4o',
      preferences: 'none',
      mode: 'completion',
      prompt: 'Analyze the market value and suggest a competitive price range for this product. Consider materials, manufacturing costs, and market positioning.',
      filters: 'code'
    },
    marketResearch: {
      model: 'perplexity/sonar-deep-research',
      preferences: 'none',
      mode: 'completion',
      prompt: 'Provide market research insights including target audience, competitors, and market trends. Format as Markdown sections.',
      filters: 'code'
    }
  },
  [TemplateContext.DIRECTORY]: {
    categoryList: {
      router: 'openai',
      model: 'gpt-4o',
      preferences: 'none',
      mode: 'completion',
      prompt: 'Create a well-organized category list with clear hierarchies and descriptions. Include relevant subcategories where appropriate.',
      filters: 'code'
    },
    itemDetails: {
      router: 'openai',
      model: 'gpt-4o',
      preferences: 'none',
      mode: 'completion',
      prompt: 'Generate detailed item information including specifications, features, and relevant metadata. Format as structured data.',
      filters: 'code'
    },
    searchSuggestions: {
      router: 'openai',
      model: 'gpt-4o',
      preferences: 'none',
      mode: 'completion',
      prompt: 'Provide relevant search suggestions and related terms based on the content. Include synonyms and alternative phrasings.',
      filters: 'code'
    }
  },
  [TemplateContext.COMMONS]: {
    simple: {
      router: 'openai',
      model: 'gpt-4o-mini',
      preferences: 'none',
      mode: 'completion',
      prompt: 'Simplify and clarify the following text while maintaining its core meaning. Make it more accessible and easier to understand.',
      filters: 'code'
    },
    research: {
      router: 'openai',
      model: 'gpt-4o',
      preferences: 'none',
      mode: 'completion',
      prompt: 'Provide a comprehensive research summary with key findings, methodology, and conclusions. Include relevant citations and references.',
      filters: 'code'
    }
  }
};

/**
 * Get template configuration for a context and template name
 */
export const getTemplateConfig = (context: TemplateContext, templateName: string): KbotTemplate | null => {
  const contextTemplates = TEMPLATE_CONFIGS[context];
  return contextTemplates?.[templateName] || null;
};

/**
 * Get all available templates for a context
 */
export const getContextTemplates = (context: TemplateContext): string[] => {
  return Object.keys(TEMPLATE_CONFIGS[context] || {});
};

/**
 * Check if a template exists for a context
 */
export const hasTemplate = (context: TemplateContext, templateName: string): boolean => {
  return getTemplateConfig(context, templateName) !== null;
};

/**
 * Get template prompt for a context and template name
 */
export const getTemplatePrompt = (context: TemplateContext, templateName: string): string => {
  const config = getTemplateConfig(context, templateName);
  return config?.prompt || '';
};

/**
 * Get template provider for a context and template name
 */
export const getTemplateProvider = (context: TemplateContext, templateName: string): string => {
  const config = getTemplateConfig(context, templateName);
  return config?.router || 'openai';
};

/**
 * Get template model for a context and template name
 */
export const getTemplateModel = (context: TemplateContext, templateName: string): string => {
  const config = getTemplateConfig(context, templateName);
  return config?.model || 'gpt-4o-mini';
};

/**
 * Get template filters for a context and template name
 */
export const getTemplateFilters = (context: TemplateContext, templateName: string): string[] => {
  const config = getTemplateConfig(context, templateName);
  if (!config?.filters) return [];
  
  // Parse filters string (e.g., "code" or "spellCheck,removeEmojis")
  return config.filters.split(',').map(f => f.trim()).filter(f => f);
};

/**
 * Convert KbotTemplate to TemplateConfig
 */
export const toTemplateConfig = (
  context: TemplateContext,
  templateName: string,
  kbotTemplate: KbotTemplate
): TemplateConfig => {
  return {
    name: templateName,
    description: `Template for ${templateName} in ${context} context`,
    context,
    provider: kbotTemplate.router || 'openai',
    model: kbotTemplate.model,
    prompt: kbotTemplate.prompt,
    filters: kbotTemplate.filters ? kbotTemplate.filters.split(',').map(f => f.trim()) : [],
    format: kbotTemplate.filters === 'code' ? FilterFormat.MARKDOWN : FilterFormat.TEXT,
    editable: true
  };
};

/**
 * Get all template configurations for a context
 */
export const getContextTemplateConfigs = (context: TemplateContext): TemplateConfig[] => {
  const contextTemplates = TEMPLATE_CONFIGS[context];
  if (!contextTemplates) return [];
  
  return Object.entries(contextTemplates).map(([name, kbotTemplate]) =>
    toTemplateConfig(context, name, kbotTemplate)
  );
};

/**
 * Build complete prompt with content, variables, and instruction flags
 */
export const buildPrompt = (
  context: TemplateContext,
  templateName: string,
  content: string,
  variables: Record<string, string> = {},
  enabledFlags?: FilterFlag[]
): string => {
  const basePrompt = getTemplatePrompt(context, templateName);
  
  // Build instructions from enabled flags
  let instructionsText = '';
  if (enabledFlags && enabledFlags.length > 0) {
    const flagsByCategory: Record<string, string[]> = {};
    enabledFlags.forEach(filter => {
      if (filter.enabled) {
        if (!flagsByCategory[filter.category]) {
          flagsByCategory[filter.category] = [];
        }
        flagsByCategory[filter.category].push(filter.flag);
      }
    });
    instructionsText = buildInstructionsPrompt(flagsByCategory);
  }
  
  // Replace variables in prompt
  let finalPrompt = basePrompt;
  Object.entries(variables).forEach(([key, value]) => {
    finalPrompt = finalPrompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  });
  
  // Build final prompt structure
  let result = '';
  
  // Add instructions first if any
  if (instructionsText) {
    result += instructionsText + '\n\n';
  }
  
  // Add template prompt
  result += finalPrompt;
  
  // Append content if not already included
  if (!result.includes(content)) {
    result += `\n\nContent:\n${content}`;
  }
  
  return result;
};

/**
 * Get template metadata
 */
export const getTemplateMetadata = (context: TemplateContext, templateName: string) => {
  const config = getTemplateConfig(context, templateName);
  if (!config) return null;
  
  return {
    name: templateName,
    context,
    provider: config.router || 'openai',
    model: config.model,
    mode: config.mode,
    filters: config.filters,
    preferences: config.preferences
  };
};

/**
 * Validate template configuration
 */
export const validateTemplate = (context: TemplateContext, templateName: string): boolean => {
  const config = getTemplateConfig(context, templateName);
  return config !== null && config.prompt.length > 0;
};

/**
 * Get all available templates across all contexts
 */
export const getAllTemplates = (): Array<{ context: TemplateContext; template: string }> => {
  const allTemplates: Array<{ context: TemplateContext; template: string }> = [];
  
  Object.entries(TEMPLATE_CONFIGS).forEach(([context, templates]) => {
    Object.keys(templates).forEach(template => {
      allTemplates.push({
        context: context as TemplateContext,
        template
      });
    });
  });
  
  return allTemplates;
};
