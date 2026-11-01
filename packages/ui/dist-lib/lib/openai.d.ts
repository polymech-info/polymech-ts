import { default as OpenAI } from 'openai';
import { z } from 'zod';
import { RunnableToolFunctionWithParse } from 'openai/lib/RunnableFunction';
type LogFunction = (level: string, message: string, data?: any) => void;
/**
 * SIMPLE TOOL PRESET MAPPING
 *
 * This mapping defines common tool combinations:
 * - generate-only:      [generate]
 * - generate-metadata:  [generate, metadata]
 * - generate-publish:   [generate, metadata, publish]
 * - metadata-only:      [metadata]
 * - optimize-generate:  [optimize, generate, metadata]
 *
 * Use these to avoid calling unwanted tools (e.g., publish when user wants manual control)
 */
export type PresetType = 'generate-only' | 'generate-metadata' | 'generate-publish' | 'metadata-only' | 'optimize-generate';
export declare const createOpenAIClient: (apiKey?: string) => Promise<OpenAI | null>;
export declare const isOpenAIAvailable: (apiKey?: string) => Promise<boolean>;
export declare const withOpenAI: <T>(operation: (client: OpenAI) => Promise<T>, fallback?: T, apiKey?: string) => Promise<T | null>;
export declare const generateText: (input: string, model?: string, apiKey?: string, signal?: AbortSignal, onChunk?: (chunk: string) => void, webSearch?: boolean) => Promise<string | null>;
export declare const generateResponse: (input: string, model?: string, apiKey?: string) => Promise<string | null>;
export declare const analyzeImages: (imageFiles: File[], prompt?: string, model?: string, apiKey?: string) => Promise<{
    description: string;
    title: string;
} | null>;
export declare const generateImageMetadata: (imageFiles: File[], apiKey?: string) => Promise<{
    description: string;
    title: string;
} | null>;
export declare const transcribeAudio: (audioFile: File, model?: string, apiKey?: string) => Promise<string | null>;
export declare const optimizePrompt: (userPrompt: string, model?: string, apiKey?: string) => Promise<string | null>;
/**
 * Helper function to create Zod-validated OpenAI tools
 * Based on ref/tools/index.ts
 */
export declare const zodFunction: <T extends object>({ function: fn, schema, description, name, }: {
    function: (args: T) => Promise<object>;
    schema: z.ZodSchema<T>;
    description?: string;
    name?: string;
}) => RunnableToolFunctionWithParse<T>;
/**
 * Tool: Generate Image
 * Creates a new image from a text prompt using the specified AI model
 */
export declare const generateImageTool: (apiKey?: string) => RunnableToolFunctionWithParse<{
    model?: string;
    prompt?: string;
    count?: number;
}>;
/**
 * Tool: Transcribe Audio
 * Converts speech/audio to text using OpenAI Whisper
 */
export declare const transcribeAudioTool: (apiKey?: string) => RunnableToolFunctionWithParse<{
    model?: string;
    audioFile?: any;
}>;
/**
 * Tool: Optimize Prompt
 * Enhances a user's prompt to produce better image generation results
 */
export declare const optimizePromptTool: (apiKey?: string) => RunnableToolFunctionWithParse<{
    model?: string;
    prompt?: string;
}>;
/**
 * Tool: Generate Text
 * Generates text completion using GPT models
 */
export declare const generateTextTool: (apiKey?: string) => RunnableToolFunctionWithParse<{
    model?: string;
    input?: string;
}>;
/**
 * Tool: Generate Image Metadata
 * Generates title and description for an image based on the prompt or image content
 */
export declare const generateImageMetadataTool: (apiKey?: string) => RunnableToolFunctionWithParse<{
    style?: string;
    prompt?: string;
}>;
/**
 * Tool: Publish Image to Gallery
 * Publishes a generated image to the user's gallery with title and description
 */
export declare const publishImageTool: () => RunnableToolFunctionWithParse<{
    title?: string;
    description?: string;
    tags?: string[];
    prompt?: string;
    imageUrl?: string;
}>;
export interface ToolPreset {
    name: string;
    description: string;
    model: string;
    tools: RunnableToolFunctionWithParse<any>[];
    systemPrompt?: string;
}
/**
 * Create a simple custom preset using the preset type mapping
 */
export declare const createSimplePreset: (type: PresetType, systemPrompt: string, apiKey?: string) => ToolPreset;
/**
 * Create tool presets with API key
 */
export declare const createToolPresets: (apiKey?: string, userId?: string, addLog?: LogFunction) => Record<string, ToolPreset>;
export interface RunToolsOptions {
    prompt: string;
    preset?: string | ToolPreset;
    apiKey?: string;
    onMessage?: (message: any) => void;
    onToolCall?: (toolCall: any) => void;
    onContent?: (content: string) => void;
    model?: string;
    maxIterations?: number;
    userId?: string;
    images?: string[];
    addLog?: LogFunction;
}
export interface RunToolsResult {
    success: boolean;
    content?: string;
    messages: any[];
    toolCalls: any[];
    error?: string;
}
/**
 * Run OpenAI with tools - main orchestration function
 * Based on ref/run-tools.ts
 *
 * @example
 * // Use preset
 * const result = await runTools({
 *   prompt: "Create a beautiful sunset over mountains",
 *   preset: "image-wizard"
 * });
 *
 * @example
 * // Custom tools
 * const result = await runTools({
 *   prompt: "Generate an image of a cat",
 *   preset: {
 *     name: "custom",
 *     model: "gpt-4o-mini",
 *     tools: [generateImageTool()],
 *     systemPrompt: "You are a helpful assistant"
 *   }
 * });
 */
export declare const runTools: (options: RunToolsOptions) => Promise<RunToolsResult>;
export {};
