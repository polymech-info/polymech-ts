export interface IKBotOptions {
    /** Target directory */
    path?: string;
    /** The prompt. Supports file paths and environment variables. */
    prompt?: string;
    /** Optional output path for modified files (Tool mode only) */
    output?: string | undefined;
    /** Optional destination path for the result, will substitute ${MODEL_NAME} and ${ROUTER} in the path. Optional, used for "completion" mode */
    dst?: string | undefined;
    /** Iterate over items, supported: GLOB | Path to JSON File | array of strings (comma separated). To test different models, use --each="gpt-3.5-turbo,gpt-4o", the actual string will exposed as variable `ITEM`, eg: --dst="${ITEM}-output.md" */
    each?: string | undefined;
    /** Disable tools categories, eg: --disable=fs,git,interact,terminal,search,web,email,user */
    disable?: string[];
    /** List of specific tools to disable */
    disableTools?: string[];
    /** List of tools to use. Can be built-in tool names or paths to custom tool files. Default: fs,git,interact,terminal,search,web,email,user */
    tools?: (string[] | string);
    /** Comma separated glob patterns or paths, eg --include=src/*.tsx,src/*.ts --include=package.json */
    include?: string[] | undefined;
    /** Explicit API key to use */
    api_key?: string | undefined;
    /** AI model to use for processing. Available models:
    [35m[1m[22m[39m
    [35m[1m OpenRouter models:[22m[39m
    [35m[1m[22m[39m
    01-ai/yi-large | paid
    aetherwiing/mn-starcannon-12b | paid
    ai21/jamba-1-5-large | paid
    ai21/jamba-1-5-mini | paid
    ai21/jamba-instruct | paid
    aion-labs/aion-1.0 | paid
    aion-labs/aion-1.0-mini | paid
    aion-labs/aion-rp-llama-3.1-8b | paid
    amazon/nova-lite-v1 | paid
    amazon/nova-micro-v1 | paid
    amazon/nova-pro-v1 | paid
    anthropic/claude-3-haiku | paid
    anthropic/claude-3-haiku:beta | paid
    anthropic/claude-3-opus | paid
    anthropic/claude-3-opus:beta | paid
    anthropic/claude-3-sonnet | paid
    anthropic/claude-3-sonnet:beta | paid
    anthropic/claude-3.5-haiku | paid
    anthropic/claude-3.5-haiku-20241022 | paid
    anthropic/claude-3.5-haiku-20241022:beta | paid
    anthropic/claude-3.5-haiku:beta | paid
    anthropic/claude-3.5-sonnet | paid
    anthropic/claude-3.5-sonnet-20240620 | paid
    anthropic/claude-3.5-sonnet-20240620:beta | paid
    anthropic/claude-3.5-sonnet:beta | paid
    anthropic/claude-2 | paid
    anthropic/claude-2:beta | paid
    anthropic/claude-2.0 | paid
    anthropic/claude-2.0:beta | paid
    anthropic/claude-2.1 | paid
    anthropic/claude-2.1:beta | paid
    openrouter/auto | paid
    cohere/command | paid
    cohere/command-r | paid
    cohere/command-r-03-2024 | paid
    cohere/command-r-08-2024 | paid
    cohere/command-r-plus | paid
    cohere/command-r-plus-04-2024 | paid
    cohere/command-r-plus-08-2024 | paid
    cohere/command-r7b-12-2024 | paid
    databricks/dbrx-instruct | paid
    deepseek/deepseek-chat-v2.5 | paid
    deepseek/deepseek-chat | paid
    deepseek/deepseek-chat:free | free
    deepseek/deepseek-r1 | paid
    deepseek/deepseek-r1:free | free
    deepseek/deepseek-r1-distill-llama-70b | paid
    deepseek/deepseek-r1-distill-llama-70b:free | free
    deepseek/deepseek-r1-distill-qwen-1.5b | paid
    deepseek/deepseek-r1-distill-qwen-14b | paid
    deepseek/deepseek-r1-distill-qwen-32b | paid
    cognitivecomputations/dolphin-mixtral-8x7b | paid
    cognitivecomputations/dolphin3.0-mistral-24b:free | free
    cognitivecomputations/dolphin3.0-r1-mistral-24b:free | free
    eva-unit-01/eva-llama-3.33-70b | paid
    eva-unit-01/eva-qwen-2.5-32b | paid
    eva-unit-01/eva-qwen-2.5-72b | paid
    sao10k/fimbulvetr-11b-v2 | paid
    alpindale/goliath-120b | paid
    google/gemini-2.0-flash-thinking-exp-1219:free | free
    google/gemini-2.0-flash-thinking-exp:free | free
    google/gemini-exp-1206:free | free
    google/gemini-flash-1.5 | paid
    google/gemini-flash-1.5-8b | paid
    google/gemini-flash-1.5-8b-exp | paid
    google/gemini-2.0-flash-001 | paid
    google/gemini-2.0-flash-exp:free | free
    google/gemini-2.0-flash-lite-preview-02-05:free | free
    google/gemini-pro | paid
    google/gemini-pro-1.5 | paid
    google/gemini-2.0-pro-exp-02-05:free | free
    google/gemini-pro-vision | paid
    google/gemma-2-27b-it | paid
    google/gemma-2-9b-it | paid
    google/gemma-2-9b-it:free | free
    google/gemma-7b-it | paid
    google/learnlm-1.5-pro-experimental:free | free
    google/palm-2-chat-bison | paid
    google/palm-2-chat-bison-32k | paid
    google/palm-2-codechat-bison | paid
    google/palm-2-codechat-bison-32k | paid
    huggingfaceh4/zephyr-7b-beta:free | free
    infermatic/mn-inferor-12b | paid
    inflection/inflection-3-pi | paid
    inflection/inflection-3-productivity | paid
    liquid/lfm-3b | paid
    liquid/lfm-40b | paid
    liquid/lfm-7b | paid
    allenai/llama-3.1-tulu-3-405b | paid
    meta-llama/llama-guard-3-8b | paid
    alpindale/magnum-72b | paid
    anthracite-org/magnum-v2-72b | paid
    anthracite-org/magnum-v4-72b | paid
    mancer/weaver | paid
    meta-llama/llama-2-13b-chat | paid
    meta-llama/llama-2-70b-chat | paid
    meta-llama/llama-3-70b-instruct | paid
    meta-llama/llama-3-8b-instruct | paid
    meta-llama/llama-3-8b-instruct:free | free
    meta-llama/llama-3.1-405b | paid
    meta-llama/llama-3.1-405b-instruct | paid
    meta-llama/llama-3.1-70b-instruct | paid
    meta-llama/llama-3.1-8b-instruct | paid
    meta-llama/llama-3.2-11b-vision-instruct | paid
    meta-llama/llama-3.2-11b-vision-instruct:free | free
    meta-llama/llama-3.2-1b-instruct | paid
    meta-llama/llama-3.2-3b-instruct | paid
    meta-llama/llama-3.2-90b-vision-instruct | paid
    meta-llama/llama-3.3-70b-instruct | paid
    meta-llama/llama-3.3-70b-instruct:free | free
    meta-llama/llama-guard-2-8b | paid
    microsoft/phi-4 | paid
    microsoft/phi-3-medium-128k-instruct | paid
    microsoft/phi-3-medium-128k-instruct:free | free
    microsoft/phi-3-mini-128k-instruct | paid
    microsoft/phi-3-mini-128k-instruct:free | free
    microsoft/phi-3.5-mini-128k-instruct | paid
    minimax/minimax-01 | paid
    mistralai/mistral-large | paid
    mistralai/mistral-large-2407 | paid
    mistralai/mistral-large-2411 | paid
    mistralai/mistral-medium | paid
    nothingiisreal/mn-celeste-12b | paid
    mistralai/mistral-small | paid
    mistralai/mistral-tiny | paid
    mistralai/codestral-2501 | paid
    mistralai/codestral-mamba | paid
    mistralai/ministral-3b | paid
    mistralai/ministral-8b | paid
    mistralai/mistral-7b-instruct | paid
    mistralai/mistral-7b-instruct:free | free
    mistralai/mistral-7b-instruct-v0.1 | paid
    mistralai/mistral-7b-instruct-v0.3 | paid
    mistralai/mistral-nemo | paid
    mistralai/mistral-nemo:free | free
    mistralai/mistral-small-24b-instruct-2501 | paid
    mistralai/mistral-small-24b-instruct-2501:free | free
    mistralai/mixtral-8x22b-instruct | paid
    mistralai/mixtral-8x7b | paid
    mistralai/mixtral-8x7b-instruct | paid
    mistralai/pixtral-12b | paid
    mistralai/pixtral-large-2411 | paid
    mistralai/mistral-saba | paid
    gryphe/mythomax-l2-13b | paid
    gryphe/mythomax-l2-13b:free | free
    neversleep/llama-3-lumimaid-70b | paid
    neversleep/llama-3-lumimaid-8b | paid
    neversleep/llama-3-lumimaid-8b:extended | paid
    neversleep/llama-3.1-lumimaid-70b | paid
    neversleep/llama-3.1-lumimaid-8b | paid
    neversleep/noromaid-20b | paid
    nousresearch/nous-hermes-llama2-13b | paid
    nousresearch/nous-hermes-2-mixtral-8x7b-dpo | paid
    nousresearch/hermes-3-llama-3.1-405b | paid
    nousresearch/hermes-3-llama-3.1-70b | paid
    nousresearch/hermes-2-pro-llama-3-8b | paid
    nvidia/llama-3.1-nemotron-70b-instruct | paid
    nvidia/llama-3.1-nemotron-70b-instruct:free | free
    openai/chatgpt-4o-latest | paid
    openai/gpt-3.5-turbo | paid
    openai/gpt-3.5-turbo-0613 | paid
    openai/gpt-3.5-turbo-16k | paid
    openai/gpt-3.5-turbo-0125 | paid
    openai/gpt-3.5-turbo-1106 | paid
    openai/gpt-3.5-turbo-instruct | paid
    openai/gpt-4 | paid
    openai/gpt-4-0314 | paid
    openai/gpt-4-32k | paid
    openai/gpt-4-32k-0314 | paid
    openai/gpt-4-turbo | paid
    openai/gpt-4-1106-preview | paid
    openai/gpt-4-turbo-preview | paid
    openai/gpt-4o | paid
    openai/gpt-4o-2024-05-13 | paid
    openai/gpt-4o-2024-08-06 | paid
    openai/gpt-4o-2024-11-20 | paid
    openai/gpt-4o:extended | paid
    openai/gpt-4o-mini | paid
    openai/gpt-4o-mini-2024-07-18 | paid
    openai/o1 | paid
    openai/o1-mini | paid
    openai/o1-mini-2024-09-12 | paid
    openai/o1-preview | paid
    openai/o1-preview-2024-09-12 | paid
    openai/o3-mini | paid
    openai/o3-mini-high | paid
    openchat/openchat-7b | paid
    openchat/openchat-7b:free | free
    perplexity/llama-3.1-sonar-huge-128k-online | paid
    perplexity/llama-3.1-sonar-large-128k-chat | paid
    perplexity/llama-3.1-sonar-large-128k-online | paid
    perplexity/llama-3.1-sonar-small-128k-chat | paid
    perplexity/llama-3.1-sonar-small-128k-online | paid
    perplexity/sonar | paid
    perplexity/sonar-reasoning | paid
    pygmalionai/mythalion-13b | paid
    qwen/qwen-2-72b-instruct | paid
    qwen/qvq-72b-preview | paid
    qwen/qwen-vl-plus:free | free
    qwen/qwen-max | paid
    qwen/qwen-plus | paid
    qwen/qwen-turbo | paid
    qwen/qwen2.5-vl-72b-instruct:free | free
    qwen/qwq-32b-preview | paid
    qwen/qwen-2-vl-72b-instruct | paid
    qwen/qwen-2-vl-7b-instruct | paid
    qwen/qwen-2.5-72b-instruct | paid
    qwen/qwen-2.5-7b-instruct | paid
    qwen/qwen-2.5-coder-32b-instruct | paid
    undi95/remm-slerp-l2-13b | paid
    thedrummer/rocinante-12b | paid
    sophosympatheia/rogue-rose-103b-v0.2:free | free
    sao10k/l3-lunaris-8b | paid
    sao10k/l3-euryale-70b | paid
    sao10k/l3.1-70b-hanami-x1 | paid
    sao10k/l3.1-euryale-70b | paid
    sao10k/l3.3-euryale-70b | paid
    raifle/sorcererlm-8x22b | paid
    undi95/toppy-m-7b | paid
    undi95/toppy-m-7b:free | free
    thedrummer/unslopnemo-12b | paid
    microsoft/wizardlm-2-7b | paid
    microsoft/wizardlm-2-8x22b | paid
    x-ai/grok-2-1212 | paid
    x-ai/grok-2-vision-1212 | paid
    x-ai/grok-beta | paid
    x-ai/grok-vision-beta | paid
    xwin-lm/xwin-lm-70b | paid
    [35m[1m[22m[39m
    [35m[1m OpenAI models:[22m[39m
    [35m[1m[22m[39m
    babbage-002
    chatgpt-4o-latest
    dall-e-2
    dall-e-3
    davinci-002
    gpt-3.5-turbo
    gpt-3.5-turbo-0125
    gpt-3.5-turbo-1106
    gpt-3.5-turbo-16k
    gpt-3.5-turbo-instruct
    gpt-3.5-turbo-instruct-0914
    gpt-4
    gpt-4-0125-preview
    gpt-4-0613
    gpt-4-1106-preview
    gpt-4-turbo
    gpt-4-turbo-2024-04-09
    gpt-4-turbo-preview
    gpt-4o
    gpt-4o-2024-05-13
    gpt-4o-2024-08-06
    gpt-4o-2024-11-20
    gpt-4o-audio-preview
    gpt-4o-audio-preview-2024-10-01
    gpt-4o-audio-preview-2024-12-17
    gpt-4o-mini
    gpt-4o-mini-2024-07-18
    gpt-4o-mini-audio-preview
    gpt-4o-mini-audio-preview-2024-12-17
    gpt-4o-mini-realtime-preview
    gpt-4o-mini-realtime-preview-2024-12-17
    gpt-4o-realtime-preview
    gpt-4o-realtime-preview-2024-10-01
    gpt-4o-realtime-preview-2024-12-17
    o1-mini
    o1-mini-2024-09-12
    o1-preview
    o1-preview-2024-09-12
    omni-moderation-2024-09-26
    omni-moderation-latest
    text-embedding-3-large
    text-embedding-3-small
    text-embedding-ada-002
    tts-1
    tts-1-1106
    tts-1-hd
    tts-1-hd-1106
    whisper-1
    -----
    
    [35m[1m[22m[39m
    [35m[1m Deepseek models:[22m[39m
    [35m[1m[22m[39m
    deepseek-chat
    deepseek-reasoner
    -----
     */
    model?: string | undefined;
    /** Router to use: openai, openrouter or deepseek */
    router?: string;
    /** Chat completion mode:
         completion, tools, assistant.
              [32m[1mcompletion[22m[39m: no support for tools, please use --dst parameter to save the output.
              [32m[1mtools[22m[39m: allows for tools to be used, eg 'save to ./output.md'. Not all models support this mode.
              [32m[1massistant[22m[39m: : allows documents (PDF, DOCX, ...) to be added but dont support tools. Use --dst to save the output. Supported files :
              [32m[1mcustom[22m[39m: custom mode
           */
    mode?: "completion" | "tools" | "assistant" | "custom";
    /** Logging level for the application */
    logLevel?: number;
    /** Path to profile for variables. Supports environment variables. */
    profile?: string | undefined;
    /** Base URL for the API, set via --router or directly */
    baseURL?: string | undefined;
    /** Path to JSON configuration file (API keys). Supports environment variables. */
    config?: string | undefined;
    /** Create a script */
    dump?: string | undefined;
    /** Path to preferences file, eg: location, your email address, gender, etc. Supports environment variables. */
    preferences?: string;
    /** Logging directory */
    logs?: string;
    /** Environment (in profile) */
    env?: string;
    variables?: {
        [x: string]: string;
    };
    /** List of filters to apply to the output.
             Used only in completion mode and a given output file specified with --dst.
             It unwraps by default any code or data in Markdown.
             Choices:
        JSON,JSONUnescape,JSONPretty,AlphaSort,code,JSONParse,trim
     */
    filters?: (string | ("JSON" | "JSONUnescape" | "JSONPretty" | "AlphaSort" | "code" | "JSONParse" | "trim")[] | string[] | ((...args_0: unknown[]) => unknown)[]);
    /** Dry run - only write out parameters without making API calls */
    dry?: (boolean | string);
}
