/**
 * Markdown Tools — AI tool definitions for markdown content manipulation
 *
 * These tools allow the AI to manipulate the markdown document currently
 * being edited. The actual mutations are performed by callbacks supplied
 * at construction time (via the consumer hook), keeping this module
 * stateless and reusable.
 *
 * Uses manual JSON schemas (same pattern as searchTools.ts) to guarantee
 * OpenAI-compatible `type: "object"` at the top level.
 */

import React from 'react';
import { z } from 'zod';
import type { RunnableToolFunctionWithParse } from 'openai/lib/RunnableFunction';

type LogFunction = (level: string, message: string, data?: any) => void;
const defaultLog: LogFunction = (level, message, data) => console.log(`[${level}] ${message}`, data);

// ── Mutation callback type ───────────────────────────────────────────────

export type MarkdownAction =
    | { type: 'replace_content'; content: string }
    | { type: 'append_content'; content: string; separator?: string }
    | { type: 'insert_at_cursor'; content: string }
    | { type: 'replace_selection'; content: string };

export type MarkdownMutator = (action: MarkdownAction) => boolean;

// ── Input schemas ────────────────────────────────────────────────────────

interface ReplaceContentArgs {
    content: string;
}
interface AppendContentArgs {
    content: string;
    separator?: string;
}
interface InsertAtCursorArgs {
    content: string;
}
interface ReplaceSelectionArgs {
    content: string;
}

const replaceContentSchema = z.object({
    content: z.string(),
});
const appendContentSchema = z.object({
    content: z.string(),
    separator: z.string().optional(),
});
const insertAtCursorSchema = z.object({
    content: z.string(),
});
const replaceSelectionSchema = z.object({
    content: z.string(),
});

// ── Tool: Replace Content ────────────────────────────────────────────────

export const replaceContentTool = (
    mutatorRef: React.MutableRefObject<MarkdownMutator | null>,
    addLog: LogFunction = defaultLog,
): RunnableToolFunctionWithParse<ReplaceContentArgs> => ({
    type: 'function',
    function: {
        name: 'replace_content',
        description:
            'Replace the ENTIRE markdown document with new content. ' +
            'Use this when the user asks for a complete rewrite, or when generating content from scratch. ' +
            'Do NOT use this to make partial edits — use replace_selection or append_content instead.',
        parameters: {
            type: 'object',
            properties: {
                content: {
                    type: 'string',
                    description: 'The complete new markdown content for the document.',
                },
            },
            required: ['content'],
        } as any,
        parse(input: string): ReplaceContentArgs {
            return replaceContentSchema.parse(JSON.parse(input));
        },
        function: async (args: ReplaceContentArgs) => {
            try {
                addLog('info', '[MD-TOOLS] replace_content called', { length: args.content.length });
                const ok = mutatorRef.current?.({ type: 'replace_content', content: args.content });
                if (ok) {
                    addLog('info', '[MD-TOOLS] replace_content succeeded');
                    return { success: true, action: 'replace_content', message: `Document replaced (${args.content.length} chars)` };
                }
                return { success: false, error: 'Mutator not available' };
            } catch (error: any) {
                addLog('error', '[MD-TOOLS] replace_content failed', { error: error.message });
                return { success: false, error: error.message };
            }
        },
    },
});

// ── Tool: Append Content ─────────────────────────────────────────────────

export const appendContentTool = (
    mutatorRef: React.MutableRefObject<MarkdownMutator | null>,
    addLog: LogFunction = defaultLog,
): RunnableToolFunctionWithParse<AppendContentArgs> => ({
    type: 'function',
    function: {
        name: 'append_content',
        description:
            'Append markdown content at the END of the current document. ' +
            'Use this when the user asks to add more content, extend, or continue writing. ' +
            'By default a horizontal rule separator (---) is added between existing and new content.',
        parameters: {
            type: 'object',
            properties: {
                content: {
                    type: 'string',
                    description: 'The markdown content to append.',
                },
                separator: {
                    type: 'string',
                    description: 'Separator between existing and new content. Default: "\\n\\n---\\n\\n". Use "\\n" for a tight join.',
                },
            },
            required: ['content'],
        } as any,
        parse(input: string): AppendContentArgs {
            return appendContentSchema.parse(JSON.parse(input));
        },
        function: async (args: AppendContentArgs) => {
            try {
                addLog('info', '[MD-TOOLS] append_content called', { length: args.content.length });
                const ok = mutatorRef.current?.({
                    type: 'append_content',
                    content: args.content,
                    separator: args.separator,
                });
                if (ok) {
                    addLog('info', '[MD-TOOLS] append_content succeeded');
                    return { success: true, action: 'append_content', message: `Appended ${args.content.length} chars` };
                }
                return { success: false, error: 'Mutator not available' };
            } catch (error: any) {
                addLog('error', '[MD-TOOLS] append_content failed', { error: error.message });
                return { success: false, error: error.message };
            }
        },
    },
});

// ── Tool: Insert at Cursor ───────────────────────────────────────────────

export const insertAtCursorTool = (
    mutatorRef: React.MutableRefObject<MarkdownMutator | null>,
    addLog: LogFunction = defaultLog,
): RunnableToolFunctionWithParse<InsertAtCursorArgs> => ({
    type: 'function',
    function: {
        name: 'insert_at_cursor',
        description:
            'Insert markdown content at the current cursor position in the editor. ' +
            'Use this when the user asks to insert content at a specific point, ' +
            'or when no text is selected but the user wants content added where they are.',
        parameters: {
            type: 'object',
            properties: {
                content: {
                    type: 'string',
                    description: 'The markdown content to insert at the cursor position.',
                },
            },
            required: ['content'],
        } as any,
        parse(input: string): InsertAtCursorArgs {
            return insertAtCursorSchema.parse(JSON.parse(input));
        },
        function: async (args: InsertAtCursorArgs) => {
            try {
                addLog('info', '[MD-TOOLS] insert_at_cursor called', { length: args.content.length });
                const ok = mutatorRef.current?.({ type: 'insert_at_cursor', content: args.content });
                if (ok) {
                    addLog('info', '[MD-TOOLS] insert_at_cursor succeeded');
                    return { success: true, action: 'insert_at_cursor', message: `Inserted ${args.content.length} chars at cursor` };
                }
                return { success: false, error: 'Mutator not available or no cursor position' };
            } catch (error: any) {
                addLog('error', '[MD-TOOLS] insert_at_cursor failed', { error: error.message });
                return { success: false, error: error.message };
            }
        },
    },
});

// ── Tool: Replace Selection ──────────────────────────────────────────────

export const replaceSelectionTool = (
    mutatorRef: React.MutableRefObject<MarkdownMutator | null>,
    addLog: LogFunction = defaultLog,
): RunnableToolFunctionWithParse<ReplaceSelectionArgs> => ({
    type: 'function',
    function: {
        name: 'replace_selection',
        description:
            'Replace the currently selected text in the editor with new content. ' +
            'Use this when the user has selected text and asks to rewrite, rephrase, translate, or transform it. ' +
            'If no text is selected, this will fail — use append_content or insert_at_cursor instead.',
        parameters: {
            type: 'object',
            properties: {
                content: {
                    type: 'string',
                    description: 'The new markdown content to replace the current selection with.',
                },
            },
            required: ['content'],
        } as any,
        parse(input: string): ReplaceSelectionArgs {
            return replaceSelectionSchema.parse(JSON.parse(input));
        },
        function: async (args: ReplaceSelectionArgs) => {
            try {
                addLog('info', '[MD-TOOLS] replace_selection called', { length: args.content.length });
                const ok = mutatorRef.current?.({ type: 'replace_selection', content: args.content });
                if (ok) {
                    addLog('info', '[MD-TOOLS] replace_selection succeeded');
                    return { success: true, action: 'replace_selection', message: `Selection replaced with ${args.content.length} chars` };
                }
                return { success: false, error: 'No text selected or mutator not available' };
            } catch (error: any) {
                addLog('error', '[MD-TOOLS] replace_selection failed', { error: error.message });
                return { success: false, error: error.message };
            }
        },
    },
});

// ── Tool: Insert Gallery ─────────────────────────────────────────────────

interface InsertGalleryArgs {
    picture_ids: string[];
}

const insertGallerySchema = z.object({
    picture_ids: z.array(z.string()).min(1),
});

export const insertGalleryTool = (
    mutatorRef: React.MutableRefObject<MarkdownMutator | null>,
    addLog: LogFunction = defaultLog,
): RunnableToolFunctionWithParse<InsertGalleryArgs> => ({
    type: 'function',
    function: {
        name: 'insert_gallery',
        description:
            'Insert a picture gallery into the markdown document. ' +
            'Use the find_pictures tool first to search for pictures and get their IDs, ' +
            'then pass the IDs to this tool. The gallery is rendered as an interactive ' +
            'image grid with thumbnails.',
        parameters: {
            type: 'object',
            properties: {
                picture_ids: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of picture IDs to include in the gallery. Use find_pictures to get these.',
                    minItems: 1,
                },
            },
            required: ['picture_ids'],
        } as any,
        parse(input: string): InsertGalleryArgs {
            return insertGallerySchema.parse(JSON.parse(input));
        },
        function: async (args: InsertGalleryArgs) => {
            try {
                const ids = args.picture_ids.filter(Boolean);
                addLog('info', `[MD-TOOLS] insert_gallery called with ${ids.length} pictures`);

                // Build the gallery fence block (append_content adds \n\n separator)
                const galleryBlock = '```custom-gallery\n' + ids.join(',') + '\n```';

                const ok = mutatorRef.current?.({
                    type: 'append_content',
                    content: galleryBlock,
                });
                if (ok) {
                    addLog('info', '[MD-TOOLS] insert_gallery succeeded');
                    return { success: true, action: 'insert_gallery', message: `Gallery inserted with ${ids.length} pictures` };
                }
                return { success: false, error: 'Mutator not available' };
            } catch (error: any) {
                addLog('error', '[MD-TOOLS] insert_gallery failed', { error: error.message });
                return { success: false, error: error.message };
            }
        },
    },
});

// ── Preset ───────────────────────────────────────────────────────────────

/**
 * Create all markdown manipulation tools.
 * The mutatorRef is called by the tools to actually update the editor content.
 */
export const createMarkdownTools = (
    mutatorRef: React.MutableRefObject<MarkdownMutator | null>,
    addLog: LogFunction = defaultLog,
) => [
        replaceContentTool(mutatorRef, addLog),
        appendContentTool(mutatorRef, addLog),
        insertAtCursorTool(mutatorRef, addLog),
        replaceSelectionTool(mutatorRef, addLog),
        insertGalleryTool(mutatorRef, addLog),
    ];
