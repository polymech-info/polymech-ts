# Templates System Database Schema

This document describes the database schema for the LLM templates and filters system.

## Database Schema (Mermaid ERD)

```mermaid
erDiagram
    auth_users {
        uuid id PK
    }
    
    user_filter_configs {
        uuid id PK
        uuid user_id FK
        text context
        text provider
        text model
        text_array default_templates
        jsonb custom_filters
        jsonb variables
        boolean is_default
        timestamptz created_at
        timestamptz updated_at
    }
    
    user_templates {
        uuid id PK
        uuid user_id FK
        text name
        text description
        text context
        text provider
        text model
        text prompt
        text_array filters
        text format
        boolean is_public
        integer usage_count
        timestamptz created_at
        timestamptz updated_at
    }
    
    filter_usage_logs {
        uuid id PK
        uuid user_id FK
        uuid template_id FK
        text context
        text provider
        text model
        integer input_length
        integer output_length
        integer processing_time_ms
        boolean success
        text error_message
        text_array filters_applied
        timestamptz created_at
    }
    
    provider_configs {
        uuid id PK
        text name
        text display_name
        text base_url
        jsonb models
        jsonb rate_limits
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }
    
    context_definitions {
        uuid id PK
        text name
        text display_name
        text description
        jsonb default_templates
        jsonb default_filters
        text icon
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    %% Relationships
    auth_users ||--o{ user_filter_configs : "owns"
    auth_users ||--o{ user_templates : "creates"
    auth_users ||--o{ filter_usage_logs : "generates"
    user_templates ||--o{ filter_usage_logs : "tracks_usage"
```

## Table Descriptions

### `user_filter_configs`
Stores user-specific filter configurations and preferences for different contexts.

**Key Fields:**
- `context`: One of 'maker-tutorials', 'marketplace', 'directory', 'commons'
- `provider`: AI service provider (default: 'openai')
- `model`: AI model to use (default: 'gpt-4o-mini')
- `default_templates`: Array of default template names
- `custom_filters`: JSONB object containing custom filter configurations
- `variables`: JSONB object for template variables

### `user_templates`
User-defined custom templates for various contexts.

**Key Fields:**
- `context`: The context this template applies to
- `prompt`: The actual LLM prompt text
- `filters`: Array of filter names to apply
- `format`: Output format ('text', 'json', 'markdown')
- `is_public`: Whether template is shared publicly
- `usage_count`: Tracking popularity

**Constraints:**
- Unique constraint on `(user_id, name, context)`

### `filter_usage_logs`
Analytics and performance tracking for filter usage.

**Key Fields:**
- `processing_time_ms`: Performance tracking
- `success`: Whether the operation succeeded
- `input_length`/`output_length`: Token usage tracking
- `filters_applied`: Which filters were used

### `provider_configs`
Configuration for different AI service providers.

**Key Fields:**
- `base_url`: API endpoint for the provider
- `models`: JSONB array of available models
- `rate_limits`: JSONB object with rate limiting info

**Initial Providers:**
- OpenAI (gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo)
- Anthropic (claude-3-5-sonnet, claude-3-haiku)
- Google (gemini-pro, gemini-pro-vision)
- OpenRouter (various models)

### `context_definitions`
Defines available contexts and their default configurations.

**Key Fields:**
- `default_templates`: JSONB array of default template names
- `default_filters`: JSONB object with default filter configurations
- `icon`: UI icon identifier

**Initial Contexts:**
- **maker-tutorials**: DIY and maker content
- **marketplace**: Product and commerce content  
- **directory**: Listing and categorization content
- **commons**: General-purpose templates

## Security

All tables use Row Level Security (RLS) with policies ensuring:
- Users can only access their own data
- Public templates are visible to all users
- Provider configs and context definitions are read-only for authenticated users

## Indexes

Performance indexes are created on:
- User foreign keys
- Context fields
- Public template flag
- Usage log timestamps
- Active provider/context flags


