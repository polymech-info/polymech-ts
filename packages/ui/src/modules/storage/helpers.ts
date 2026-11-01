import React from 'react';
import {
    Folder, File, Image, Film, Music, FileCode, FileText as FileTextIcon,
    Archive, FileSpreadsheet, Presentation
} from 'lucide-react';
import type { INode, SortKey, MimeCategory } from './types';

// ── Extension sets ───────────────────────────────────────────────

export const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico']);
export const VIDEO_EXTS = new Set(['mp4', 'mov', 'webm', 'mkv', 'avi', 'flv', 'wmv', 'm4v', 'ogv']);
export const AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus']);
export const CODE_EXTS = new Set(['ts', 'tsx', 'js', 'jsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'swift', 'kt', 'sh', 'bash', 'zsh', 'ps1', 'bat', 'cmd', 'lua', 'php', 'sql', 'r', 'html', 'htm', 'css', 'scss', 'sass', 'less', 'json', 'yaml', 'yml', 'toml', 'xml', 'vue', 'svelte']);
export const DOC_EXTS = new Set(['md', 'txt', 'rtf', 'pdf', 'doc', 'docx', 'odt', 'tex', 'log']);
export const ARCHIVE_EXTS = new Set(['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'zst', 'tgz']);
export const SPREADSHEET_EXTS = new Set(['xls', 'xlsx', 'csv', 'ods', 'tsv']);
export const PRESENTATION_EXTS = new Set(['ppt', 'pptx', 'odp', 'key']);

export const BINARY_EXTS = new Set([
    'xlsx', 'xls', 'arw', 'zip', 'rar', '7z', 'tar', 'gz', 'pdf', 'ppt', 'pptx',
    'sldprt', 'sldasm', 'slddrw', 'obj', 'fbx', 'gltf', 'glb', 'blend', '3ds', 'iges', 'igs', 'dwg', 'dxf', 'prt', 'asm', 'catpart', 'catproduct', 'ipt', 'iam', 'step', 'stp'
]);

// ── MIME helpers ─────────────────────────────────────────────────

export function getExt(name?: string): string {
    if (!name) return '';
    const i = name.lastIndexOf('.');
    return i > 0 ? name.slice(i + 1).toLowerCase() : '';
}

export function getMimeCategory(node: INode): MimeCategory {
    if (node.mime === 'inode/directory' || node.type === 'dir') return 'dir';

    const ext = getExt(node.name);
    // Escape hatch for CAD files that might be reported as images or other mime types
    if (['stl', 'obj', 'step', 'stp', 'dxf', 'dwg', 'iges', 'igs', 'blend', '3ds'].includes(ext)) {
        return 'other';
    }

    const mime = node.mime || '';
    if (CODE_EXTS.has(ext)) return 'code';
    if (ext === 'ts' || ext === 'tsx') return 'code';
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/') && ext !== 'ts') return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime.startsWith('text/x-') || mime.includes('javascript') || mime.includes('typescript') || mime.includes('json') || mime.includes('xml') || mime.includes('yaml')) return 'code';
    if (IMAGE_EXTS.has(ext)) return 'image';
    if (VIDEO_EXTS.has(ext)) return 'video';
    if (AUDIO_EXTS.has(ext)) return 'audio';
    if (CODE_EXTS.has(ext)) return 'code';
    if (SPREADSHEET_EXTS.has(ext)) return 'spreadsheet';
    if (PRESENTATION_EXTS.has(ext)) return 'presentation';
    if (ARCHIVE_EXTS.has(ext)) return 'archive';
    if (DOC_EXTS.has(ext)) return 'document';
    return 'other';
}

export function isTextViewable(node: INode): boolean {
    // user requested no preview for text files > 2MB
    if (typeof node.size === 'number' && node.size > 2 * 1024 * 1024) return false;

    const ext = getExt(node.name);
    if (BINARY_EXTS.has(ext)) return false;

    const cat = getMimeCategory(node);
    const isBinaryCat = ['spreadsheet', 'presentation', 'archive', 'audio', 'video', 'image'].includes(cat);
    return !isBinaryCat;
}

export function globToRegex(globStr: string): RegExp {
    if (!globStr || globStr === '*.*' || globStr === '*') return /.*/;
    const patterns = globStr.split(',').map(s => s.trim()).filter(Boolean);
    const regexes = patterns.map(p => {
        let regexStr = p.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.');
        return `^${regexStr}$`;
    });
    return new RegExp(regexes.join('|'), 'i');
}

export const CATEGORY_STYLE: Record<MimeCategory, { icon: React.FC<any>; color: string }> = {
    dir: { icon: Folder, color: '#60a5fa' },
    image: { icon: Image, color: '#22c55e' },
    video: { icon: Film, color: '#ef4444' },
    audio: { icon: Music, color: '#8b5cf6' },
    code: { icon: FileCode, color: '#3b82f6' },
    document: { icon: FileTextIcon, color: '#f59e0b' },
    archive: { icon: Archive, color: '#eab308' },
    spreadsheet: { icon: FileSpreadsheet, color: '#16a34a' },
    presentation: { icon: Presentation, color: '#ec4899' },
    other: { icon: File, color: '#94a3b8' },
};

// ── Format helpers ───────────────────────────────────────────────

export function formatSize(bytes: number): string {
    if (bytes === 0) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const v = bytes / Math.pow(1024, i);
    return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}

export function formatDate(ts?: number): string {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

// ── Sort ─────────────────────────────────────────────────────────

export function sortNodes(nodes: INode[], sortBy: SortKey, asc: boolean): INode[] {
    const dirs = nodes.filter(n => n.mime === 'inode/directory' || n.type === 'dir');
    const files = nodes.filter(n => n.mime !== 'inode/directory' && n.type !== 'dir');
    const cmp = (a: INode, b: INode): number => {
        let r = 0;
        switch (sortBy) {
            case 'name': r = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }); break;
            case 'ext': r = getExt(a.name).localeCompare(getExt(b.name)) || a.name.localeCompare(b.name); break;
            case 'date': r = (a.mtime ?? 0) - (b.mtime ?? 0); break;
            case 'type': r = getMimeCategory(a).localeCompare(getMimeCategory(b)) || a.name.localeCompare(b.name); break;
        }
        return asc ? r : -r;
    };
    dirs.sort(cmp);
    files.sort(cmp);
    return [...dirs, ...files];
}

// ── URL helper ───────────────────────────────────────────────────

/** Build a VFS API URL. Always includes mount segment. */
export function vfsUrl(op: string, mount: string, subpath?: string): string {
    const clean = subpath?.replace(/^\/+/, '');
    return clean
        ? `/api/vfs/${op}/${encodeURIComponent(mount)}/${clean}`
        : `/api/vfs/${op}/${encodeURIComponent(mount)}`;
}
