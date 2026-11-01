interface OpenAIModel {
    id: string;
    created: number;
    owned_by: string;
    root?: string;
    parent?: string | null;
}
export interface CachedModels {
    timestamp: number;
    models: OpenAIModel[];
}
export declare const CACHE_PATH: string;
export declare function fetchOpenAIModels(apiKey: string, cachePath?: string): Promise<OpenAIModel[]>;
export declare function listModelsAsStrings(models: OpenAIModel[]): string[];
export {};
