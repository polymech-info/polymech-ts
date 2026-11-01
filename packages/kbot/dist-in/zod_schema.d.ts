import { z } from 'zod';
export declare const get_var: (key?: string) => string;
export declare const HOME: (sub?: string) => string;
export declare const PREFERENCES_DEFAULT: (key?: string) => string;
export declare const E_Filters: z.ZodEnum<{
    [x: string]: any;
}>;
export declare const E_RouterTypeSchema: z.ZodEnum<{
    openrouter: "openrouter";
    openai: "openai";
    deepseek: "deepseek";
    huggingface: "huggingface";
    ollama: "ollama";
    fireworks: "fireworks";
    gemini: "gemini";
    xai: "xai";
}>;
export type E_RouterType = z.infer<typeof E_RouterTypeSchema>;
export declare const E_Mode: {
    readonly COMPLETION: "completion";
    readonly TOOLS: "tools";
    readonly ASSISTANT: "assistant";
    readonly RESPONSES: "responses";
    readonly CUSTOM: "custom";
};
export declare const EType: z.ZodEnum<{
    completion: "completion";
    tools: "tools";
    assistant: "assistant";
    responses: "responses";
    custom: "custom";
}>;
export declare const E_AppendMode: z.ZodEnum<{
    concat: "concat";
    merge: "merge";
    replace: "replace";
}>;
export type E_AppendModeType = z.infer<typeof E_AppendMode>;
export declare const E_WrapMode: z.ZodEnum<{
    meta: "meta";
    none: "none";
}>;
export type E_WrapModeType = z.infer<typeof E_WrapMode>;
export declare const E_GlobExtension: z.ZodEnum<{
    "match-cpp": "match-cpp";
}>;
export type E_GlobExtensionType = z.infer<typeof E_GlobExtension>;
export type OptionsSchemaMeta = Record<string, unknown>;
export { fetchOpenRouterModels, listModelsAsStrings as listOpenRouterModelsAsStrings } from './models/openrouter.js';
export { fetchOpenAIModels, listModelsAsStrings as listOpenAIModelsAsStrings } from './models/openai.js';
export declare const OptionsSchema: (opts?: any) => any;
export declare const types: () => void;
export declare const schemas: () => void;
