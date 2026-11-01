/**
 * Core types for the LLM filter system
 */

export enum TemplateContext {
  MAKER_TUTORIALS = 'maker-tutorials',
  MARKETPLACE = 'marketplace',
  DIRECTORY = 'directory',
  COMMONS = 'commons'
}

export enum FilterFormat {
  TEXT = 'text',
  JSON = 'json',
  MARKDOWN = 'markdown'
}

export enum FilterCategory {
  TONE = 'tone',
  CONTENT = 'content',
  MODERATION = 'moderation',
  FORMAT = 'format'
}

export interface FilterFlag {
  category: FilterCategory;
  flag: string;
  enabled: boolean;
}

export interface FilterOptions {
  context?: TemplateContext;
  provider?: string;
  model?: string;
  selection?: 'entire' | 'selected';
  customFilters?: FilterFlag[];
  variables?: Record<string, string>;
  apiKey?: string;
}

export interface TemplateConfig {
  name: string;
  description: string;
  context: TemplateContext;
  provider: string;
  model: string;
  prompt: string;
  filters: string[];
  format: FilterFormat;
  editable: boolean;
}

export interface ContextDefinition {
  name: TemplateContext;
  displayName: string;
  description: string;
  defaultTemplates: string[];
  defaultFilters: Record<string, string[]>;
  icon: string;
}

export interface ProviderConfig {
  name: string;
  displayName: string;
  baseUrl: string;
  models: string[];
  rateLimits: Record<string, number>;
  isActive: boolean;
  settings?: Record<string, any>;
}

export interface FilterResult {
  success: boolean;
  content?: string;
  error?: string;
  processingTime?: number;
  filtersApplied?: string[];
}

// Database types (matching the Supabase schema)
export interface UserFilterConfig {
  id: string;
  user_id: string;
  context: TemplateContext;
  provider: string;
  model: string;
  default_templates: string[];
  custom_filters: Record<string, any>;
  variables: Record<string, string>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  context: TemplateContext;
  provider: string;
  model: string;
  prompt: string;
  filters: string[];
  format: FilterFormat;
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface FilterUsageLog {
  id: string;
  user_id: string;
  template_id?: string;
  context: TemplateContext;
  provider: string;
  model: string;
  input_length: number;
  output_length: number;
  processing_time_ms: number;
  success: boolean;
  error_message?: string;
  filters_applied: string[];
  created_at: string;
}

// Reference implementation types (from ./ref/kbot)
export interface KbotTemplate {
  router?: string;
  model: string;
  preferences?: string;
  mode: 'completion' | 'chat';
  prompt: string;
  filters?: string;
}

export interface KbotContext {
  options: Record<string, KbotTemplate>;
  instructions: {
    context?: Array<{ flag: string; text: string }>;
    format?: Array<{ flag: string; text: string }>;
  };
  defaults: {
    context?: string[];
    format?: string[];
  };
}

export interface KbotConfig {
  templates: Record<string, KbotTemplate>;
}
