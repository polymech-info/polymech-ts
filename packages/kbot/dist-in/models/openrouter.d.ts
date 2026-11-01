interface ModelPricing {
    prompt: number;
    completion: number;
    image: number;
}
export type SupportedParameter = 'max_tokens' | 'temperature' | 'top_p' | 'tools' | 'tool_choice' | 'reasoning' | 'include_reasoning' | 'stop' | 'frequency_penalty' | 'presence_penalty' | 'seed' | 'top_k' | 'min_p' | 'repetition_penalty' | 'logprobs' | 'logit_bias' | 'top_logprobs' | 'response_format';
interface ModelContext {
    max_tokens: number;
    supported_parameters: SupportedParameter[];
}
interface TopProvider {
    context_length: number;
    max_completion_tokens: number | null;
    is_moderated: boolean;
    supports_functions?: boolean;
    supports_function_calling?: boolean;
    supports_tools?: boolean;
}
export interface OpenRouterModel {
    id: string;
    name: string;
    description: string;
    pricing: ModelPricing;
    context: ModelContext;
    created: number;
    top_provider?: TopProvider;
}
export interface CachedModels {
    timestamp: number;
    models: OpenRouterModel[];
}
export declare const CACHE_PATH: string;
export declare const readFromCache: (cachePath?: string) => Promise<OpenRouterModel[] | null>;
export declare const fetchOpenRouterModels: (cachePath?: string) => Promise<OpenRouterModel[]>;
export declare function findFreeModels(models: OpenRouterModel[]): OpenRouterModel[];
export declare function findFreePromptModels(models: OpenRouterModel[]): OpenRouterModel[];
export declare function findFreeCompletionModels(models: OpenRouterModel[]): OpenRouterModel[];
export declare function findFreeImageModels(models: OpenRouterModel[]): OpenRouterModel[];
export declare function listModelsAsStrings(models: OpenRouterModel[]): string[];
export {};
