export interface IKBotOptions {
    /** Path to the project directory */
    path?: string;
    /** Description of the modifications to make to the project. Supports file paths. */
    query?: string;
    /** Optional output path for modified files */
    output?: string | undefined;
    /** Optional destination path for the result, will substitute ${MODEL} and ${ROUTER} in the path */
    dst?: string | undefined;
    /** Template (typescript) or path to use for processing, see https://git.polymech.io/polymech/ai-template-typescript */
    template?: (("typescript") | string) | undefined;
    /** Template root directory. When specified, templates are loaded with a prefix, eg: ${POLYMECH-ROOT}/ai-template-${options.template} */
    templateRoot?: string;
    /** List of template parts to disable. Addionally, tools categories can be disabled, eg: --disable=fs,git,interact,terminal,search,web,email,user */
    disable?: string[];
    /** List of specific tools to disable */
    disableTools?: string[];
    /** Glob patterns to match files for processing, comma separated, eg: src/*.tsx,src/*.ts */
    glob?: string[] | undefined;
    /** AI model to use for processing. Available models:
    [35m[1m[22m[39m
    [35m[1m OpenRouter models:[22m[39m
    [35m[1m[22m[39m
    google/gemini-pro-1.5-exp | paid
    meta-llama/llama-3.2-11b-vision-instruct:free | free
    google/gemini-flash-1.5-exp | paid
    google/gemini-flash-1.5-8b-exp | paid
    microsoft/phi-3-medium-128k-instruct:free | free
    microsoft/phi-3-mini-128k-instruct:free | free
    google/gemini-2.0-flash-thinking-exp:free | free
    google/gemini-2.0-flash-exp:free | free
    meta-llama/llama-3.2-1b-instruct | paid
    meta-llama/llama-3.2-3b-instruct | paid
    meta-llama/llama-3.1-8b-instruct | paid
    mistralai/mistral-7b-instruct | paid
    mistralai/mistral-7b-instruct-v0.3 | paid
    meta-llama/llama-3-8b-instruct | paid
    amazon/nova-micro-v1 | paid
    google/gemini-flash-1.5-8b | paid
    mistralai/ministral-3b | paid
    meta-llama/llama-3.2-11b-vision-instruct | paid
    amazon/nova-lite-v1 | paid
    google/gemini-flash-1.5 | paid
    mistralai/ministral-8b | paid
    microsoft/phi-3-mini-128k-instruct | paid
    microsoft/phi-3.5-mini-128k-instruct | paid
    meta-llama/llama-3.1-70b-instruct | paid
    nvidia/llama-3.1-nemotron-70b-instruct | paid
    deepseek/deepseek-chat | paid
    cohere/command-r-08-2024 | paid
    mistralai/mistral-nemo | paid
    mistralai/pixtral-12b | paid
    openai/gpt-4o-mini | paid
    openai/gpt-4o-mini-2024-07-18 | paid
    mistralai/mistral-7b-instruct-v0.1 | paid
    ai21/jamba-1-5-mini | paid
    mistralai/mistral-small | paid
    qwen/qwen-2.5-72b-instruct | paid
    meta-llama/llama-3-70b-instruct | paid
    mistralai/mixtral-8x7b-instruct | paid
    mistralai/mistral-tiny | paid
    mistralai/codestral-mamba | paid
    anthropic/claude-3-haiku:beta | paid
    anthropic/claude-3-haiku | paid
    nousresearch/hermes-3-llama-3.1-70b | paid
    cohere/command-r-03-2024 | paid
    cohere/command-r | paid
    openai/gpt-3.5-turbo-0125 | paid
    google/gemini-pro | paid
    openai/gpt-3.5-turbo | paid
    mistralai/mixtral-8x7b-instruct:nitro | paid
    meta-llama/llama-3.1-405b-instruct | paid
    amazon/nova-pro-v1 | paid
    anthropic/claude-3.5-haiku:beta | paid
    anthropic/claude-3.5-haiku | paid
    anthropic/claude-3.5-haiku-20241022:beta | paid
    anthropic/claude-3.5-haiku-20241022 | paid
    microsoft/phi-3-medium-128k-instruct | paid
    openai/gpt-3.5-turbo-1106 | paid
    openai/gpt-3.5-turbo-0613 | paid
    meta-llama/llama-3.2-90b-vision-instruct | paid
    google/gemini-pro-1.5 | paid
    mistralai/mixtral-8x22b-instruct | paid
    mistralai/mistral-large | paid
    mistralai/mistral-large-2407 | paid
    mistralai/mistral-large-2411 | paid
    mistralai/pixtral-large-2411 | paid
    ai21/jamba-1-5-large | paid
    x-ai/grok-2-1212 | paid
    cohere/command-r-plus-08-2024 | paid
    openai/gpt-4o | paid
    openai/gpt-4o-2024-08-06 | paid
    openai/gpt-4o-2024-11-20 | paid
    mistralai/mistral-medium | paid
    cohere/command-r-plus | paid
    cohere/command-r-plus-04-2024 | paid
    openai/gpt-3.5-turbo-16k | paid
    anthropic/claude-3.5-sonnet:beta | paid
    anthropic/claude-3.5-sonnet | paid
    anthropic/claude-3-sonnet:beta | paid
    anthropic/claude-3-sonnet | paid
    anthropic/claude-3.5-sonnet-20240620:beta | paid
    anthropic/claude-3.5-sonnet-20240620 | paid
    openai/gpt-4o-2024-05-13 | paid
    x-ai/grok-beta | paid
    x-ai/grok-vision-beta | paid
    openai/gpt-4o:extended | paid
    openai/gpt-4-turbo | paid
    openai/gpt-4-1106-preview | paid
    openai/gpt-4-turbo-preview | paid
    openai/o1 | paid
    anthropic/claude-3-opus:beta | paid
    anthropic/claude-3-opus | paid
    openai/gpt-4 | paid
    openai/gpt-4-0314 | paid
    openai/gpt-4-32k-0314 | paid
    openai/gpt-4-32k | paid
    [35m[1m[22m[39m
    [35m[1m OpenAI models:[22m[39m
    [35m[1m[22m[39m
    gpt-4o-audio-preview-2024-10-01
    gpt-4o-realtime-preview
    gpt-4o-realtime-preview-2024-10-01
    o1-mini-2024-09-12
    dall-e-2
    gpt-4-turbo
    gpt-4-1106-preview
    gpt-3.5-turbo
    gpt-3.5-turbo-0125
    gpt-3.5-turbo-instruct
    gpt-4-1106-vision-preview
    babbage-002
    davinci-002
    whisper-1
    dall-e-3
    gpt-4o-mini-2024-07-18
    text-embedding-3-small
    gpt-4o-mini
    gpt-3.5-turbo-16k
    gpt-4-0125-preview
    gpt-4-turbo-preview
    omni-moderation-latest
    gpt-4o-2024-05-13
    omni-moderation-2024-09-26
    tts-1-hd-1106
    chatgpt-4o-latest
    gpt-4
    gpt-4-0613
    o1-mini
    o1-preview
    o1-preview-2024-09-12
    tts-1-hd
    gpt-4-vision-preview
    text-embedding-ada-002
    gpt-3.5-turbo-1106
    gpt-4o-audio-preview
    tts-1
    tts-1-1106
    gpt-3.5-turbo-instruct-0914
    text-embedding-3-large
    gpt-4o-realtime-preview-2024-12-17
    gpt-4o-mini-realtime-preview
    gpt-4o-mini-realtime-preview-2024-12-17
    gpt-4o-2024-11-20
    gpt-4o-audio-preview-2024-12-17
    gpt-4o-mini-audio-preview
    gpt-4o-2024-08-06
    gpt-4o-mini-audio-preview-2024-12-17
    gpt-4o
    gpt-4-turbo-2024-04-09
    -----
     */
    model?: string;
    /** Router to use: openai or openrouter */
    router?: string;
    /** Chat completion type - completion (without tools) or tools (with function calling) */
    type?: "completion" | "tools";
    /** Logging level for the application */
    logLevel?: unknown;
    /** Profile for constants */
    profile?: string;
    /** Environment (in profile) */
    env?: string;
    /** Configuration as JSON string or path to JSON file, eg: {"openrouter":{"key":"your-key"}} or path/to/config.json */
    config?: string | undefined;
    /** Write out as script */
    dump?: string | undefined;
    /** Path to preferences file */
    preferences?: string;
    /** Logging directory */
    logs?: string;
}
