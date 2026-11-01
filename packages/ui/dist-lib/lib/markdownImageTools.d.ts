/**
 * Markdown Image Tools
 * Tools for generating and embedding images in markdown content
 */
type LogFunction = (level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any) => void;
/**
 * Tool: Generate Markdown Image
 * Generates an image and returns markdown with embedded image
 */
export declare const generateMarkdownImageTool: (userId: string, addLog?: LogFunction) => import('openai/lib/RunnableFunction.mjs').RunnableToolFunctionWithParse<{
    model?: string;
    prompt?: string;
    caption?: string;
    altText?: string;
}>;
/**
 * Tool: Generate Text with Images
 * Generates markdown content that can include both text and embedded images
 */
export declare const generateTextWithImagesTool: (userId: string, addLog?: LogFunction) => import('openai/lib/RunnableFunction.mjs').RunnableToolFunctionWithParse<{
    content?: string;
    model?: string;
    imagePrompts?: {
        position?: "inline" | "top" | "middle" | "bottom";
        prompt?: string;
        caption?: string;
        altText?: string;
    }[];
}>;
/**
 * Create markdown-specific tool preset
 */
export declare const createMarkdownToolPreset: (userId: string, model?: string, apiKey?: string, addLog?: LogFunction) => {
    name: string;
    description: string;
    model: string;
    tools: (import('openai/lib/RunnableFunction.mjs').RunnableToolFunctionWithParse<{
        model?: string;
        prompt?: string;
        caption?: string;
        altText?: string;
    }> | import('openai/lib/RunnableFunction.mjs').RunnableToolFunctionWithParse<{
        content?: string;
        model?: string;
        imagePrompts?: {
            position?: "inline" | "top" | "middle" | "bottom";
            prompt?: string;
            caption?: string;
            altText?: string;
        }[];
    }>)[];
    systemPrompt: string;
};
export {};
