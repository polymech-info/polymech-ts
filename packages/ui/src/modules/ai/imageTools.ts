/**
 * Image Tools for Chat Playground
 *
 * Provides generate_image tool that the AI can invoke to create images
 * and embed them as markdown in its responses.
 * Uses the same manual tool definition pattern as searchTools.ts.
 */

import { z } from 'zod';
import { createImage as createImageRouter } from '@/lib/image-router';
import { uploadGeneratedImageData } from '@/lib/uploadUtils';
import type { RunnableToolFunctionWithParse } from 'openai/lib/RunnableFunction';

type LogFunction = (level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any) => void;
const defaultLog: LogFunction = (level, message, data) => console.log(`[IMAGE-TOOLS][${level}] ${message}`, data ?? '');

// ── Upload helper ────────────────────────────────────────────────────────

const uploadGeneratedImage = async (
    imageData: ArrayBuffer,
    prompt: string,
    userId: string,
    addLog: LogFunction,
): Promise<string | null> => {
    try {
        const { publicUrl } = await uploadGeneratedImageData(imageData, prompt, userId);
        addLog('info', 'Image uploaded via VFS flow', { publicUrl });
        return publicUrl;
    } catch (err) {
        addLog('error', 'VFS upload failed', err);
        return null;
    }
};

// ── Zod schemas ──────────────────────────────────────────────────────────

const generateImageSchema = z.object({
    prompt: z.string(),
    altText: z.string().optional(),
    caption: z.string().optional(),
});
type GenerateImageArgs = z.infer<typeof generateImageSchema>;

// ── Tool: generate_image ─────────────────────────────────────────────────

export const createImageTool = (
    userId: string,
    addLog: LogFunction = defaultLog,
    modelString?: string,
): RunnableToolFunctionWithParse<GenerateImageArgs> => ({
    type: 'function',
    function: {
        name: 'generate_image',
        description:
            'Generate an image from a text prompt. The image is uploaded to configured storage and ' +
            'returned as a markdown image tag you can embed in your response. ' +
            'Use descriptive, detailed prompts for best results.',
        parameters: {
            type: 'object',
            properties: {
                prompt: {
                    type: 'string',
                    description: 'Detailed prompt describing the image to generate.',
                },
                altText: {
                    type: 'string',
                    description: 'Alt text for the image (defaults to prompt).',
                },
                caption: {
                    type: 'string',
                    description: 'Optional caption to display below the image.',
                },
            },
            required: ['prompt'],
        } as any,
        parse(input: string): GenerateImageArgs {
            return generateImageSchema.parse(JSON.parse(input));
        },
        function: async (args: GenerateImageArgs) => {
            try {
                addLog('info', '[IMAGE-TOOLS] generate_image called', { prompt: args.prompt.substring(0, 100), model: modelString });

                const result = await createImageRouter(args.prompt, modelString);
                if (!result) {
                    return JSON.stringify({
                        success: false,
                        error: 'Image generation failed',
                        markdown: `_Image generation failed for: "${args.prompt}"_`,
                    });
                }

                const publicUrl = await uploadGeneratedImage(result.imageData, args.prompt, userId, addLog);
                if (!publicUrl) {
                    return JSON.stringify({
                        success: false,
                        error: 'Upload failed',
                        markdown: `_Image upload failed for: "${args.prompt}"_`,
                    });
                }

                const alt = args.altText || args.prompt;
                const cap = args.caption ? `\n*${args.caption}*` : '';
                const markdown = `![${alt}](${publicUrl})${cap}`;

                addLog('info', 'Image embedded', { url: publicUrl });
                return JSON.stringify({ success: true, markdown, imageUrl: publicUrl });
            } catch (err: any) {
                addLog('error', 'generate_image failed', err);
                return JSON.stringify({ success: false, error: err.message });
            }
        },
    },
});
