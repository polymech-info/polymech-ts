export interface IKBotOptions {
    /** Target directory */
    path?: string;
    /** The prompt. Supports file paths and environment variables. */
    prompt?: string | undefined;
    /** Optional output path for modified files (Tool mode only) */
    output?: string | undefined;
    /** Optional destination path for the result, will substitute ${MODEL_NAME} and ${ROUTER} in the path. Optional, used for "completion" mode */
    dst?: string | undefined;
    /** How to handle output if --dst file already exists: "concat" (append) or "merge" (try to merge structures if possible, otherwise append). Only used if --dst is specified. */
    append?: ("concat" | "merge" | "replace") | undefined;
    /** Specify how to wrap the output, "meta (file name, absolute path, cwd)" or "none". */
    wrap?: "meta" | "none";
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
    /** Comma separated glob patterns or paths, eg --exclude=src/*.tsx,src/*.ts --exclude=package.json */
    exclude?: string[] | undefined;
    /** Specify a glob extension behavior. Available presets: match-cpp. Also accepts a custom glob pattern with variables like ${SRC_DIR}, ${SRC_NAME}, ${SRC_EXT}. E.g., "match-cpp" or "${SRC_DIR}/${SRC_NAME}*.cpp" */
    globExtension?: (("match-cpp") | string) | undefined;
    /** Explicit API key to use */
    api_key?: string | undefined;
    /** AI model to use for processing. Available models:
    [35m[1m[22m[39m
    [35m[1m OpenRouter models:[22m[39m
    [35m[1m[22m[39m
    ai21/jamba-large-1.7 | paid
    aion-labs/aion-1.0 | paid
    aion-labs/aion-1.0-mini | paid
    aion-labs/aion-2.0 | paid
    aion-labs/aion-rp-llama-3.1-8b | paid
    alfredpros/codellama-7b-instruct-solidity | paid
    allenai/molmo-2-8b | paid
    allenai/olmo-2-0325-32b-instruct | paid
    allenai/olmo-3-32b-think | paid
    allenai/olmo-3-7b-instruct | paid
    allenai/olmo-3-7b-think | paid
    allenai/olmo-3.1-32b-instruct | paid
    allenai/olmo-3.1-32b-think | paid
    amazon/nova-2-lite-v1 | paid
    amazon/nova-lite-v1 | paid
    amazon/nova-micro-v1 | paid
    amazon/nova-premier-v1 | paid
    amazon/nova-pro-v1 | paid
    anthropic/claude-3-haiku | paid
    anthropic/claude-3.5-haiku | paid
    anthropic/claude-3.5-sonnet | paid
    anthropic/claude-3.7-sonnet | paid
    anthropic/claude-3.7-sonnet:thinking | paid
    anthropic/claude-haiku-4.5 | paid
    anthropic/claude-opus-4 | paid
    anthropic/claude-opus-4.1 | paid
    anthropic/claude-opus-4.5 | paid
    anthropic/claude-opus-4.6 | paid
    anthropic/claude-sonnet-4 | paid
    anthropic/claude-sonnet-4.5 | paid
    anthropic/claude-sonnet-4.6 | paid
    arcee-ai/coder-large | paid
    arcee-ai/maestro-reasoning | paid
    arcee-ai/spotlight | paid
    arcee-ai/trinity-large-preview:free | free
    arcee-ai/trinity-mini | paid
    arcee-ai/trinity-mini:free | free
    arcee-ai/virtuoso-large | paid
    openrouter/auto | paid
    baidu/ernie-4.5-21b-a3b | paid
    baidu/ernie-4.5-21b-a3b-thinking | paid
    baidu/ernie-4.5-300b-a47b | paid
    baidu/ernie-4.5-vl-28b-a3b | paid
    baidu/ernie-4.5-vl-424b-a47b | paid
    openrouter/bodybuilder | paid
    bytedance-seed/seed-1.6 | paid
    bytedance-seed/seed-1.6-flash | paid
    bytedance-seed/seed-2.0-lite | paid
    bytedance-seed/seed-2.0-mini | paid
    bytedance/ui-tars-1.5-7b | paid
    cohere/command-a | paid
    cohere/command-r-08-2024 | paid
    cohere/command-r-plus-08-2024 | paid
    cohere/command-r7b-12-2024 | paid
    deepcogito/cogito-v2.1-671b | paid
    deepseek/deepseek-chat | paid
    deepseek/deepseek-chat-v3-0324 | paid
    deepseek/deepseek-chat-v3.1 | paid
    deepseek/deepseek-v3.1-terminus | paid
    deepseek/deepseek-v3.2 | paid
    deepseek/deepseek-v3.2-exp | paid
    deepseek/deepseek-v3.2-speciale | paid
    deepseek/deepseek-r1 | paid
    deepseek/deepseek-r1-0528 | paid
    deepseek/deepseek-r1-distill-llama-70b | paid
    deepseek/deepseek-r1-distill-qwen-32b | paid
    eleutherai/llemma_7b | paid
    essentialai/rnj-1-instruct | paid
    openrouter/free | paid
    alpindale/goliath-120b | paid
    google/gemini-2.0-flash-001 | paid
    google/gemini-2.0-flash-lite-001 | paid
    google/gemini-2.5-flash | paid
    google/gemini-2.5-flash-lite | paid
    google/gemini-2.5-flash-lite-preview-09-2025 | paid
    google/gemini-2.5-pro | paid
    google/gemini-2.5-pro-preview-05-06 | paid
    google/gemini-2.5-pro-preview | paid
    google/gemini-3-flash-preview | paid
    google/gemini-3-pro-preview | paid
    google/gemini-3.1-flash-lite-preview | paid
    google/gemini-3.1-pro-preview | paid
    google/gemini-3.1-pro-preview-customtools | paid
    google/gemma-2-27b-it | paid
    google/gemma-2-9b-it | paid
    google/gemma-3-12b-it | paid
    google/gemma-3-12b-it:free | free
    google/gemma-3-27b-it | paid
    google/gemma-3-27b-it:free | free
    google/gemma-3-4b-it | paid
    google/gemma-3-4b-it:free | free
    google/gemma-3n-e2b-it:free | free
    google/gemma-3n-e4b-it | paid
    google/gemma-3n-e4b-it:free | free
    google/gemini-2.5-flash-image | paid
    google/gemini-3.1-flash-image-preview | paid
    google/gemini-3-pro-image-preview | paid
    ibm-granite/granite-4.0-h-micro | paid
    inception/mercury | paid
    inception/mercury-2 | paid
    inception/mercury-coder | paid
    inflection/inflection-3-pi | paid
    inflection/inflection-3-productivity | paid
    kwaipilot/kat-coder-pro | paid
    liquid/lfm-2.2-6b | paid
    liquid/lfm-2-24b-a2b | paid
    liquid/lfm2-8b-a1b | paid
    liquid/lfm-2.5-1.2b-instruct:free | free
    liquid/lfm-2.5-1.2b-thinking:free | free
    meta-llama/llama-guard-3-8b | paid
    anthracite-org/magnum-v4-72b | paid
    mancer/weaver | paid
    meituan/longcat-flash-chat | paid
    meta-llama/llama-3-70b-instruct | paid
    meta-llama/llama-3-8b-instruct | paid
    meta-llama/llama-3.1-405b | paid
    meta-llama/llama-3.1-70b-instruct | paid
    meta-llama/llama-3.1-8b-instruct | paid
    meta-llama/llama-3.2-11b-vision-instruct | paid
    meta-llama/llama-3.2-1b-instruct | paid
    meta-llama/llama-3.2-3b-instruct | paid
    meta-llama/llama-3.2-3b-instruct:free | free
    meta-llama/llama-3.3-70b-instruct | paid
    meta-llama/llama-3.3-70b-instruct:free | free
    meta-llama/llama-4-maverick | paid
    meta-llama/llama-4-scout | paid
    meta-llama/llama-guard-4-12b | paid
    microsoft/phi-4 | paid
    minimax/minimax-m1 | paid
    minimax/minimax-m2 | paid
    minimax/minimax-m2-her | paid
    minimax/minimax-m2.1 | paid
    minimax/minimax-m2.5 | paid
    minimax/minimax-m2.5:free | free
    minimax/minimax-m2.7 | paid
    minimax/minimax-01 | paid
    mistralai/mistral-large | paid
    mistralai/mistral-large-2407 | paid
    mistralai/mistral-large-2411 | paid
    mistralai/codestral-2508 | paid
    mistralai/devstral-2512 | paid
    mistralai/devstral-medium | paid
    mistralai/devstral-small | paid
    mistralai/ministral-14b-2512 | paid
    mistralai/ministral-3b-2512 | paid
    mistralai/ministral-8b-2512 | paid
    mistralai/mistral-7b-instruct-v0.1 | paid
    mistralai/mistral-large-2512 | paid
    mistralai/mistral-medium-3 | paid
    mistralai/mistral-medium-3.1 | paid
    mistralai/mistral-nemo | paid
    mistralai/mistral-small-24b-instruct-2501 | paid
    mistralai/mistral-small-3.1-24b-instruct | paid
    mistralai/mistral-small-3.1-24b-instruct:free | free
    mistralai/mistral-small-3.2-24b-instruct | paid
    mistralai/mistral-small-2603 | paid
    mistralai/mistral-small-creative | paid
    mistralai/mixtral-8x22b-instruct | paid
    mistralai/mixtral-8x7b-instruct | paid
    mistralai/pixtral-large-2411 | paid
    mistralai/mistral-saba | paid
    mistralai/voxtral-small-24b-2507 | paid
    moonshotai/kimi-k2 | paid
    moonshotai/kimi-k2-0905 | paid
    moonshotai/kimi-k2-thinking | paid
    moonshotai/kimi-k2.5 | paid
    morph/morph-v3-fast | paid
    morph/morph-v3-large | paid
    gryphe/mythomax-l2-13b | paid
    nex-agi/deepseek-v3.1-nex-n1 | paid
    nousresearch/hermes-3-llama-3.1-405b | paid
    nousresearch/hermes-3-llama-3.1-405b:free | free
    nousresearch/hermes-3-llama-3.1-70b | paid
    nousresearch/hermes-4-405b | paid
    nousresearch/hermes-4-70b | paid
    nousresearch/hermes-2-pro-llama-3-8b | paid
    nvidia/llama-3.1-nemotron-70b-instruct | paid
    nvidia/llama-3.3-nemotron-super-49b-v1.5 | paid
    nvidia/nemotron-3-nano-30b-a3b | paid
    nvidia/nemotron-3-nano-30b-a3b:free | free
    nvidia/nemotron-3-super-120b-a12b | paid
    nvidia/nemotron-3-super-120b-a12b:free | free
    nvidia/nemotron-nano-12b-v2-vl | paid
    nvidia/nemotron-nano-12b-v2-vl:free | free
    nvidia/nemotron-nano-9b-v2 | paid
    nvidia/nemotron-nano-9b-v2:free | free
    openai/gpt-audio | paid
    openai/gpt-audio-mini | paid
    openai/gpt-3.5-turbo | paid
    openai/gpt-3.5-turbo-0613 | paid
    openai/gpt-3.5-turbo-16k | paid
    openai/gpt-3.5-turbo-instruct | paid
    openai/gpt-4 | paid
    openai/gpt-4-0314 | paid
    openai/gpt-4-turbo | paid
    openai/gpt-4-1106-preview | paid
    openai/gpt-4-turbo-preview | paid
    openai/gpt-4.1 | paid
    openai/gpt-4.1-mini | paid
    openai/gpt-4.1-nano | paid
    openai/gpt-4o | paid
    openai/gpt-4o-2024-05-13 | paid
    openai/gpt-4o-2024-08-06 | paid
    openai/gpt-4o-2024-11-20 | paid
    openai/gpt-4o:extended | paid
    openai/gpt-4o-audio-preview | paid
    openai/gpt-4o-search-preview | paid
    openai/gpt-4o-mini | paid
    openai/gpt-4o-mini-2024-07-18 | paid
    openai/gpt-4o-mini-search-preview | paid
    openai/gpt-5 | paid
    openai/gpt-5-chat | paid
    openai/gpt-5-codex | paid
    openai/gpt-5-image | paid
    openai/gpt-5-image-mini | paid
    openai/gpt-5-mini | paid
    openai/gpt-5-nano | paid
    openai/gpt-5-pro | paid
    openai/gpt-5.1 | paid
    openai/gpt-5.1-chat | paid
    openai/gpt-5.1-codex | paid
    openai/gpt-5.1-codex-max | paid
    openai/gpt-5.1-codex-mini | paid
    openai/gpt-5.2 | paid
    openai/gpt-5.2-chat | paid
    openai/gpt-5.2-pro | paid
    openai/gpt-5.2-codex | paid
    openai/gpt-5.3-chat | paid
    openai/gpt-5.3-codex | paid
    openai/gpt-5.4 | paid
    openai/gpt-5.4-mini | paid
    openai/gpt-5.4-nano | paid
    openai/gpt-5.4-pro | paid
    openai/gpt-oss-120b | paid
    openai/gpt-oss-120b:free | free
    openai/gpt-oss-20b | paid
    openai/gpt-oss-20b:free | free
    openai/gpt-oss-safeguard-20b | paid
    openai/o1 | paid
    openai/o1-pro | paid
    openai/o3 | paid
    openai/o3-deep-research | paid
    openai/o3-mini | paid
    openai/o3-mini-high | paid
    openai/o3-pro | paid
    openai/o4-mini | paid
    openai/o4-mini-deep-research | paid
    openai/o4-mini-high | paid
    perplexity/sonar | paid
    perplexity/sonar-deep-research | paid
    perplexity/sonar-pro | paid
    perplexity/sonar-pro-search | paid
    perplexity/sonar-reasoning-pro | paid
    prime-intellect/intellect-3 | paid
    qwen/qwen-plus-2025-07-28 | paid
    qwen/qwen-plus-2025-07-28:thinking | paid
    qwen/qwen-vl-max | paid
    qwen/qwen-vl-plus | paid
    qwen/qwen-max | paid
    qwen/qwen-plus | paid
    qwen/qwen-turbo | paid
    qwen/qwen-2.5-7b-instruct | paid
    qwen/qwen2.5-coder-7b-instruct | paid
    qwen/qwen2.5-vl-32b-instruct | paid
    qwen/qwen2.5-vl-72b-instruct | paid
    qwen/qwen-2.5-vl-7b-instruct | paid
    qwen/qwen3-14b | paid
    qwen/qwen3-235b-a22b | paid
    qwen/qwen3-235b-a22b-2507 | paid
    qwen/qwen3-235b-a22b-thinking-2507 | paid
    qwen/qwen3-30b-a3b | paid
    qwen/qwen3-30b-a3b-instruct-2507 | paid
    qwen/qwen3-30b-a3b-thinking-2507 | paid
    qwen/qwen3-32b | paid
    qwen/qwen3-4b:free | free
    qwen/qwen3-8b | paid
    qwen/qwen3-coder-30b-a3b-instruct | paid
    qwen/qwen3-coder | paid
    qwen/qwen3-coder:free | free
    qwen/qwen3-coder-flash | paid
    qwen/qwen3-coder-next | paid
    qwen/qwen3-coder-plus | paid
    qwen/qwen3-max | paid
    qwen/qwen3-max-thinking | paid
    qwen/qwen3-next-80b-a3b-instruct | paid
    qwen/qwen3-next-80b-a3b-instruct:free | free
    qwen/qwen3-next-80b-a3b-thinking | paid
    qwen/qwen3-vl-235b-a22b-instruct | paid
    qwen/qwen3-vl-235b-a22b-thinking | paid
    qwen/qwen3-vl-30b-a3b-instruct | paid
    qwen/qwen3-vl-30b-a3b-thinking | paid
    qwen/qwen3-vl-32b-instruct | paid
    qwen/qwen3-vl-8b-instruct | paid
    qwen/qwen3-vl-8b-thinking | paid
    qwen/qwen3.5-397b-a17b | paid
    qwen/qwen3.5-plus-02-15 | paid
    qwen/qwen3.5-122b-a10b | paid
    qwen/qwen3.5-27b | paid
    qwen/qwen3.5-35b-a3b | paid
    qwen/qwen3.5-9b | paid
    qwen/qwen3.5-flash-02-23 | paid
    qwen/qwq-32b | paid
    qwen/qwen-2.5-72b-instruct | paid
    qwen/qwen-2.5-coder-32b-instruct | paid
    relace/relace-apply-3 | paid
    relace/relace-search | paid
    undi95/remm-slerp-l2-13b | paid
    sao10k/l3-lunaris-8b | paid
    sao10k/l3-euryale-70b | paid
    sao10k/l3.1-70b-hanami-x1 | paid
    sao10k/l3.1-euryale-70b | paid
    sao10k/l3.3-euryale-70b | paid
    stepfun/step-3.5-flash | paid
    stepfun/step-3.5-flash:free | free
    switchpoint/router | paid
    tencent/hunyuan-a13b-instruct | paid
    thedrummer/cydonia-24b-v4.1 | paid
    thedrummer/rocinante-12b | paid
    thedrummer/skyfall-36b-v2 | paid
    thedrummer/unslopnemo-12b | paid
    tngtech/deepseek-r1t2-chimera | paid
    alibaba/tongyi-deepresearch-30b-a3b | paid
    upstage/solar-pro-3 | paid
    cognitivecomputations/dolphin-mistral-24b-venice-edition:free | free
    microsoft/wizardlm-2-8x22b | paid
    writer/palmyra-x5 | paid
    x-ai/grok-3 | paid
    x-ai/grok-3-beta | paid
    x-ai/grok-3-mini | paid
    x-ai/grok-3-mini-beta | paid
    x-ai/grok-4 | paid
    x-ai/grok-4-fast | paid
    x-ai/grok-4.1-fast | paid
    x-ai/grok-4.20-beta | paid
    x-ai/grok-4.20-multi-agent-beta | paid
    x-ai/grok-code-fast-1 | paid
    xiaomi/mimo-v2-flash | paid
    xiaomi/mimo-v2-omni | paid
    xiaomi/mimo-v2-pro | paid
    z-ai/glm-4-32b | paid
    z-ai/glm-4.5 | paid
    z-ai/glm-4.5-air | paid
    z-ai/glm-4.5-air:free | free
    z-ai/glm-4.5v | paid
    z-ai/glm-4.6 | paid
    z-ai/glm-4.6v | paid
    z-ai/glm-4.7 | paid
    z-ai/glm-4.7-flash | paid
    z-ai/glm-5 | paid
    z-ai/glm-5-turbo | paid
    [35m[1m[22m[39m
    [35m[1m OpenAI models:[22m[39m
    [35m[1m[22m[39m
    babbage-002
    chatgpt-image-latest
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
    gpt-4.1
    gpt-4.1-2025-04-14
    gpt-4.1-mini
    gpt-4.1-mini-2025-04-14
    gpt-4.1-nano
    gpt-4.1-nano-2025-04-14
    gpt-4o
    gpt-4o-2024-05-13
    gpt-4o-2024-08-06
    gpt-4o-2024-11-20
    gpt-4o-audio-preview
    gpt-4o-audio-preview-2024-12-17
    gpt-4o-audio-preview-2025-06-03
    gpt-4o-mini
    gpt-4o-mini-2024-07-18
    gpt-4o-mini-audio-preview
    gpt-4o-mini-audio-preview-2024-12-17
    gpt-4o-mini-realtime-preview
    gpt-4o-mini-realtime-preview-2024-12-17
    gpt-4o-mini-search-preview
    gpt-4o-mini-search-preview-2025-03-11
    gpt-4o-mini-transcribe
    gpt-4o-mini-transcribe-2025-03-20
    gpt-4o-mini-transcribe-2025-12-15
    gpt-4o-mini-tts
    gpt-4o-mini-tts-2025-03-20
    gpt-4o-mini-tts-2025-12-15
    gpt-4o-realtime-preview
    gpt-4o-realtime-preview-2024-12-17
    gpt-4o-realtime-preview-2025-06-03
    gpt-4o-search-preview
    gpt-4o-search-preview-2025-03-11
    gpt-4o-transcribe
    gpt-4o-transcribe-diarize
    gpt-5
    gpt-5-2025-08-07
    gpt-5-chat-latest
    gpt-5-codex
    gpt-5-mini
    gpt-5-mini-2025-08-07
    gpt-5-nano
    gpt-5-nano-2025-08-07
    gpt-5-pro
    gpt-5-pro-2025-10-06
    gpt-5-search-api
    gpt-5-search-api-2025-10-14
    gpt-5.1
    gpt-5.1-2025-11-13
    gpt-5.1-chat-latest
    gpt-5.1-codex
    gpt-5.1-codex-max
    gpt-5.1-codex-mini
    gpt-5.2
    gpt-5.2-2025-12-11
    gpt-5.2-chat-latest
    gpt-5.2-codex
    gpt-5.2-pro
    gpt-5.2-pro-2025-12-11
    gpt-5.3-chat-latest
    gpt-5.3-codex
    gpt-5.4
    gpt-5.4-2026-03-05
    gpt-5.4-mini
    gpt-5.4-mini-2026-03-17
    gpt-5.4-nano
    gpt-5.4-nano-2026-03-17
    gpt-5.4-pro
    gpt-5.4-pro-2026-03-05
    gpt-audio
    gpt-audio-1.5
    gpt-audio-2025-08-28
    gpt-audio-mini
    gpt-audio-mini-2025-10-06
    gpt-audio-mini-2025-12-15
    gpt-image-1
    gpt-image-1-mini
    gpt-image-1.5
    gpt-realtime
    gpt-realtime-1.5
    gpt-realtime-2025-08-28
    gpt-realtime-mini
    gpt-realtime-mini-2025-10-06
    gpt-realtime-mini-2025-12-15
    o1
    o1-2024-12-17
    o1-pro
    o1-pro-2025-03-19
    o3
    o3-2025-04-16
    o3-mini
    o3-mini-2025-01-31
    o4-mini
    o4-mini-2025-04-16
    o4-mini-deep-research
    o4-mini-deep-research-2025-06-26
    omni-moderation-2024-09-26
    omni-moderation-latest
    sora-2
    sora-2-pro
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
              [32m[1mresponses[22m[39m: allows for responses to be used, eg 'save to ./output.md'. Not all models support this mode.
              [32m[1massistant[22m[39m: : allows documents (PDF, DOCX, ...) to be added but dont support tools. Use --dst to save the output. Supported files :
              [32m[1mcustom[22m[39m: custom mode
           */
    mode?: "completion" | "tools" | "assistant" | "responses" | "custom";
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
    /** Enable streaming (verbose LLM output) */
    stream?: boolean;
    /** Use alternate tokenizer & instead of $ */
    alt?: boolean;
    /** Environment (in profile) */
    env?: string;
    variables?: {
        [x: string]: string;
    };
    /** List of filters to apply to the output.
             Used only in completion mode and a given output file specified with --dst.
             It unwraps by default any code or data in Markdown.
             Choices:
        JSON,JSONUnescape,JSONPretty,AlphaSort,code,JSONParse,trim,markdown
     */
    filters?: (string | ("JSON" | "JSONUnescape" | "JSONPretty" | "AlphaSort" | "code" | "JSONParse" | "trim" | "markdown")[] | string[] | ((...args_0: unknown[]) => unknown)[]);
    /** JSONPath query to be used to transform input objects */
    query?: (string | null);
    /** Dry run - only write out parameters without making API calls */
    dry?: (boolean | string);
    /** Format for structured outputs. Can be a Zod schema, a Zod schema string, a JSON schema string, or a path to a JSON file. */
    format?: (string | any) | undefined;
}