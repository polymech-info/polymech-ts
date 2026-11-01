/**
 * File System Tools for Chat Playground
 *
 * Provides file system tools (ls, read, write, mkdir, delete) that the AI
 * can invoke to browse and manage files.
 */

import { z } from 'zod';
import type { RunnableToolFunctionWithParse } from 'openai/lib/RunnableFunction';
import { getAuthToken } from '@/lib/db';

type LogFunction = (level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any) => void;
const defaultLog: LogFunction = (level, message, data) => console.log(`[FS-TOOLS][${level}] ${message}`, data ?? '');

const default_mount = 'home';

// ── Auth helper ──────────────────────────────────────────────────────────

const getToken = async (): Promise<string | null> => {
    return (await getAuthToken()) ?? null;
};

const vfsFetch = async (method: string, op: string, subpath?: string, body?: string): Promise<Response> => {
    const token = await getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (body) headers['Content-Type'] = 'text/plain';
    const clean = subpath?.replace(/^\/+/, '');
    const url = clean
        ? `/api/vfs/${op}/${default_mount}/${clean}`
        : `/api/vfs/${op}/${default_mount}`;
    return fetch(url, { method, headers, body });
};

// ── Zod schemas ──────────────────────────────────────────────────────────

const lsSchema = z.object({
    path: z.string().optional(),
    glob: z.string().optional(),
});
type LsArgs = z.infer<typeof lsSchema>;

const readSchema = z.object({
    path: z.string(),
});
type ReadArgs = z.infer<typeof readSchema>;

const writeSchema = z.object({
    path: z.string(),
    content: z.string(),
});
type WriteArgs = z.infer<typeof writeSchema>;

const mkdirSchema = z.object({
    path: z.string(),
});
type MkdirArgs = z.infer<typeof mkdirSchema>;

const deleteSchema = z.object({
    path: z.string(),
});
type DeleteArgs = z.infer<typeof deleteSchema>;

// ── Tool: vfs_ls ─────────────────────────────────────────────────────────

export const createVfsLsTool = (
    addLog: LogFunction = defaultLog,
): RunnableToolFunctionWithParse<LsArgs> => ({
    type: 'function',
    function: {
        name: 'fs_ls',
        description:
            'List files and directories at a path. ' +
            'Returns name, path, size, type and mime for each entry. ' +
            'Omit path or use "/" for root. Use glob to filter (e.g. "*.md").',
        parameters: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Directory path to list. Default: "/".',
                },
                glob: {
                    type: 'string',
                    description: 'Optional glob pattern to filter results, e.g. "*.txt", "*.md".',
                },
            },
            required: [],
        } as any,
        parse(input: string): LsArgs {
            return lsSchema.parse(JSON.parse(input));
        },
        function: async (args: LsArgs) => {
            try {
                const dir = args.path?.replace(/^\/+/, '') || '';
                const route = dir ? `ls/${dir}` : 'ls';
                const queryParams = args.glob ? `?glob=${encodeURIComponent(args.glob)}` : '';
                addLog('info', `[VFS] ls ${dir || '/'}${args.glob ? ` (glob: ${args.glob})` : ''}`);

                const res = await vfsFetch('GET', 'ls', `${dir}${queryParams}`);
                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
                    return JSON.stringify({ success: false, error: err.error || `HTTP ${res.status}` });
                }
                const nodes = await res.json();
                const summary = nodes.map((n: any) => ({
                    name: n.name,
                    type: n.type === 'dir' || n.mime === 'inode/directory' ? 'dir' : 'file',
                    size: n.size,
                    mime: n.mime,
                    path: n.path,
                }));
                addLog('info', `[VFS] ls returned ${summary.length} items`);
                return JSON.stringify({ success: true, path: args.path || '/', items: summary, total: summary.length });
            } catch (err: any) {
                addLog('error', 'vfs_ls failed', err);
                return JSON.stringify({ success: false, error: err.message });
            }
        },
    },
});

// ── Tool: vfs_read ───────────────────────────────────────────────────────

export const createVfsReadTool = (
    addLog: LogFunction = defaultLog,
): RunnableToolFunctionWithParse<ReadArgs> => ({
    type: 'function',
    function: {
        name: 'fs_read',
        description:
            'Read the text content of a file. ' +
            'Only works with text-based files (txt, md, json, csv, etc.).',
        parameters: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'File path to read.',
                },
            },
            required: ['path'],
        } as any,
        parse(input: string): ReadArgs {
            return readSchema.parse(JSON.parse(input));
        },
        function: async (args: ReadArgs) => {
            try {
                const clean = args.path.replace(/^\/+/, '');
                addLog('info', `[VFS] read ${clean}`);
                const res = await vfsFetch('GET', 'read', clean);
                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
                    return JSON.stringify({ success: false, error: err.error || `HTTP ${res.status}` });
                }
                const content = await res.text();
                addLog('info', `[VFS] read ${clean}: ${content.length} chars`);
                return JSON.stringify({ success: true, path: args.path, content, length: content.length });
            } catch (err: any) {
                addLog('error', 'vfs_read failed', err);
                return JSON.stringify({ success: false, error: err.message });
            }
        },
    },
});

// ── Tool: vfs_write ──────────────────────────────────────────────────────

export const createVfsWriteTool = (
    addLog: LogFunction = defaultLog,
): RunnableToolFunctionWithParse<WriteArgs> => ({
    type: 'function',
    function: {
        name: 'fs_write',
        description:
            'Write text content to a file. ' +
            'Creates the file if it doesn\'t exist, or overwrites it if it does. ' +
            'Use for saving notes, configs, markdown documents, etc. ' +
            'Always include the returned markdown link in your response so the user can open the file.',
        parameters: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'File path to write. Include extension.',
                },
                content: {
                    type: 'string',
                    description: 'The text content to write to the file.',
                },
            },
            required: ['path', 'content'],
        } as any,
        parse(input: string): WriteArgs {
            return writeSchema.parse(JSON.parse(input));
        },
        function: async (args: WriteArgs) => {
            try {
                const clean = args.path.replace(/^\/+/, '');
                const res = await vfsFetch('PUT', 'write', clean, args.content);
                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
                    return JSON.stringify({ success: false, error: err.error || `HTTP ${res.status}` });
                }
                const result = await res.json();
                const filePath = result.path || args.path;
                const browserUrl = `/app/filebrowser/${default_mount}?file=${encodeURIComponent(filePath.replace(/^\/+/, ''))}`;
                addLog('info', `[VFS] write ${clean}: OK : ${browserUrl} | ${filePath}`);
                return JSON.stringify({
                    success: true, path: filePath, url: browserUrl,
                    markdown: `📄 Saved [${clean}](${browserUrl})`
                });
            } catch (err: any) {
                addLog('error', 'vfs_write failed', err);
                return JSON.stringify({ success: false, error: err.message });
            }
        },
    },
});

// ── Tool: vfs_mkdir ──────────────────────────────────────────────────────

export const createVfsMkdirTool = (
    addLog: LogFunction = defaultLog,
): RunnableToolFunctionWithParse<MkdirArgs> => ({
    type: 'function',
    function: {
        name: 'fs_mkdir',
        description:
            'Create a directory at the given path.',
        parameters: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Directory path to create.',
                },
            },
            required: ['path'],
        } as any,
        parse(input: string): MkdirArgs {
            return mkdirSchema.parse(JSON.parse(input));
        },
        function: async (args: MkdirArgs) => {
            try {
                const clean = args.path.replace(/^\/+/, '');
                addLog('info', `[VFS] mkdir ${clean}`);
                const res = await vfsFetch('POST', 'mkdir', clean);
                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
                    return JSON.stringify({ success: false, error: err.error || `HTTP ${res.status}` });
                }
                addLog('info', `[VFS] mkdir ${clean}: OK`);
                const browserUrl = `/app/filebrowser/${default_mount}/${encodeURIComponent(clean)}`;
                return JSON.stringify({ success: true, path: args.path, url: browserUrl });
            } catch (err: any) {
                addLog('error', 'vfs_mkdir failed', err);
                return JSON.stringify({ success: false, error: err.message });
            }
        },
    },
});

// ── Tool: vfs_delete ─────────────────────────────────────────────────────

export const createVfsDeleteTool = (
    addLog: LogFunction = defaultLog,
): RunnableToolFunctionWithParse<DeleteArgs> => ({
    type: 'function',
    function: {
        name: 'fs_delete',
        description:
            'Delete a file or directory. ' +
            'Use with caution — this is destructive.',
        parameters: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Path of the file or directory to delete.',
                },
            },
            required: ['path'],
        } as any,
        parse(input: string): DeleteArgs {
            return deleteSchema.parse(JSON.parse(input));
        },
        function: async (args: DeleteArgs) => {
            try {
                const clean = args.path.replace(/^\/+/, '');
                addLog('info', `[VFS] delete ${clean}`);
                const res = await vfsFetch('DELETE', 'delete', clean);
                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
                    return JSON.stringify({ success: false, error: err.error || `HTTP ${res.status}` });
                }
                addLog('info', `[VFS] delete ${clean}: OK`);
                return JSON.stringify({ success: true, path: args.path });
            } catch (err: any) {
                addLog('error', 'vfs_delete failed', err);
                return JSON.stringify({ success: false, error: err.message });
            }
        },
    },
});

// ── Tool: fs_write_many ──────────────────────────────────────────────

const writeManySchema = z.object({
    files: z.array(z.object({
        path: z.string(),
        content: z.string(),
    })),
});
type WriteManyArgs = z.infer<typeof writeManySchema>;

export const createVfsWriteManyTool = (
    addLog: LogFunction = defaultLog,
): RunnableToolFunctionWithParse<WriteManyArgs> => ({
    type: 'function',
    function: {
        name: 'fs_write_many',
        description:
            'Create or modify multiple files in one call. ' +
            'Ideal for scaffolding project structures. ' +
            'Always include the returned markdown links in your response so the user can open the files.',
        parameters: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    description: 'Array of files to write.',
                    items: {
                        type: 'object',
                        properties: {
                            path: { type: 'string', description: 'File path to write.' },
                            content: { type: 'string', description: 'The text content for the file.' },
                        },
                        required: ['path', 'content'],
                    },
                },
            },
            required: ['files'],
        } as any,
        parse(input: string): WriteManyArgs {
            const raw = JSON.parse(input);
            // Handle case where LLM sends files as stringified JSON
            if (typeof raw.files === 'string') {
                try { raw.files = JSON.parse(raw.files); } catch { }
            }
            return writeManySchema.parse(raw);
        },
        function: async (args: WriteManyArgs) => {
            try {
                addLog('info', `[VFS] write_many: ${args.files.length} files`);
                const results: { path: string; success: boolean; url?: string; error?: string }[] = [];

                for (const file of args.files) {
                    const clean = file.path.replace(/^\/+/, '');
                    try {
                        const res = await vfsFetch('PUT', 'write', clean, file.content);
                        if (!res.ok) {
                            const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
                            results.push({ path: file.path, success: false, error: err.error || `HTTP ${res.status}` });
                            addLog('warn', `[VFS] write_many: FAIL ${clean}: ${err.error || res.status}`);
                        } else {
                            await res.json();
                            const browserUrl = `/app/filebrowser/${default_mount}?file=${encodeURIComponent(clean)}`;
                            results.push({ path: file.path, success: true, url: browserUrl });
                            addLog('info', `[VFS] write_many: OK ${clean}`);
                        }
                    } catch (err: any) {
                        results.push({ path: file.path, success: false, error: err.message });
                        addLog('error', `[VFS] write_many: ERR ${clean}`, err);
                    }
                }

                const ok = results.filter(r => r.success);
                const fail = results.filter(r => !r.success);
                const markdown = ok.map(r => `- 📄 [${r.path}](${r.url})`).join('\n');

                return JSON.stringify({
                    success: fail.length === 0,
                    written: ok.length,
                    failed: fail.length,
                    results,
                    markdown: markdown || undefined,
                });
            } catch (err: any) {
                addLog('error', 'fs_write_many failed', err);
                return JSON.stringify({ success: false, error: err.message });
            }
        },
    },
});

// ── Preset: all FS tools ─────────────────────────────────────────────────

export const createVfsTools = (addLog: LogFunction = defaultLog) => [
    createVfsLsTool(addLog),
    createVfsReadTool(addLog),
    createVfsWriteTool(addLog),
    createVfsWriteManyTool(addLog),
    createVfsMkdirTool(addLog),
    createVfsDeleteTool(addLog),
];
