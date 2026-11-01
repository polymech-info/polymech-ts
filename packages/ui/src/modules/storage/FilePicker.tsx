import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderOpen, X } from 'lucide-react';
import { T, translate } from '@/i18n';
import { FileBrowserWidget } from './FileBrowserWidget';
import type { INode } from './types';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { vfsUrl } from './helpers';
import { getAuthHeaders } from '@/lib/db';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type FilePickerMode = 'pick' | 'saveAs';

export type FilePickerResult = {
    mount: string;
    directory: string;
    fileName: string;
    fullPath: string;
    overwrite: boolean;
    mask: string;
    encoded: string;
};

export type FileMaskPreset = {
    label: string;
    value: string;
};

const DEFAULT_MASK_PRESETS: FileMaskPreset[] = [
    { label: 'All Files (*.*)', value: '*.*' },
    { label: 'Markdown (*.md)', value: '*.md' },
    { label: 'Text (*.txt)', value: '*.txt' },
    { label: 'JSON (*.json)', value: '*.json' },
];

export function parseVfsStoredPath(val?: string): { mount: string; path: string } {
    if (!val || typeof val !== 'string') {
        return { mount: 'home', path: '/' };
    }
    const i = val.indexOf(':');
    if (i <= 0) {
        return { mount: 'home', path: val.startsWith('/') ? val : `/${val}` };
    }
    return {
        mount: val.slice(0, i) || 'home',
        path: val.slice(i + 1) || '/',
    };
}

function normalizeDirectory(path?: string): string {
    if (!path) return '/';
    const withSlash = path.startsWith('/') ? path : `/${path}`;
    return withSlash.replace(/\/+$/, '') || '/';
}

function splitDirectoryAndName(path?: string): { directory: string; fileName: string } {
    const normalized = normalizeDirectory(path);
    const parts = normalized.split('/').filter(Boolean);
    if (parts.length === 0) return { directory: '/', fileName: '' };
    const last = parts[parts.length - 1] || '';
    if (last.includes('.')) {
        const dir = `/${parts.slice(0, -1).join('/')}`;
        return { directory: normalizeDirectory(dir), fileName: last };
    }
    return { directory: normalized, fileName: '' };
}

function hasFileLikeSegment(path: string): boolean {
    const parts = normalizeDirectory(path).split('/').filter(Boolean);
    if (parts.length === 0) return false;
    const last = parts[parts.length - 1] || '';
    return last.includes('.');
}

const PATH_HISTORY_KEY = 'storage-filepicker-path-history-v1';
const PATH_HISTORY_LIMIT = 20;

function readPathHistory(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(PATH_HISTORY_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
    } catch {
        return [];
    }
}

function pushPathHistory(pathValue: string) {
    if (typeof window === 'undefined') return;
    const value = pathValue.trim();
    if (!value) return;
    const existing = readPathHistory();
    const next = [value, ...existing.filter((p) => p !== value)].slice(0, PATH_HISTORY_LIMIT);
    localStorage.setItem(PATH_HISTORY_KEY, JSON.stringify(next));
}

const PathHistoryInput: React.FC<{
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onFocus?: () => void;
    onBlur?: () => void;
}> = ({ value, onChange, placeholder, onFocus, onBlur }) => {
    const [history, setHistory] = useState<string[]>([]);
    const listId = useMemo(() => `filepicker-history-${Math.random().toString(36).slice(2)}`, []);

    useEffect(() => {
        setHistory(readPathHistory());
    }, []);

    return (
        <>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-8 text-xs font-mono"
                list={listId}
                onFocus={onFocus}
                onBlur={onBlur}
            />
            <datalist id={listId}>
                {history.map((h) => (
                    <option key={h} value={h} />
                ))}
            </datalist>
        </>
    );
};

export interface FilePickerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode?: FilePickerMode;
    initialValue?: string;
    initialFileName?: string;
    initialOverwrite?: boolean;
    initialMask?: string;
    title?: string;
    confirmLabel?: string;
    allowClearMask?: boolean;
    maskPresets?: FileMaskPreset[];
    extensionSlot?: React.ReactNode;
    confirmDisabled?: boolean;
    onConfirm: (result: FilePickerResult) => void;
}

export const FilePickerDialog: React.FC<FilePickerDialogProps> = ({
    open,
    onOpenChange,
    mode = 'pick',
    initialValue,
    initialFileName,
    initialOverwrite = false,
    initialMask = '*.*',
    title,
    confirmLabel,
    allowClearMask = true,
    maskPresets = DEFAULT_MASK_PRESETS,
    extensionSlot,
    confirmDisabled = false,
    onConfirm,
}) => {
    const parsed = useMemo(() => parseVfsStoredPath(initialValue), [initialValue]);
    const initialSplit = useMemo(() => splitDirectoryAndName(parsed.path), [parsed.path]);
    const [browseMount, setBrowseMount] = useState(parsed.mount);
    const [browsePath, setBrowsePath] = useState(initialSplit.directory);
    const [selectedNode, setSelectedNode] = useState<INode | null>(null);
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [manualPath, setManualPath] = useState(`${parsed.mount}:${initialFileName ? `${initialSplit.directory}/${initialFileName}` : parsed.path}`);
    const [isPathInputFocused, setIsPathInputFocused] = useState(false);
    const [confirmOverwriteOpen, setConfirmOverwriteOpen] = useState(false);
    const [pendingResult, setPendingResult] = useState<FilePickerResult | null>(null);
    const [mask, setMask] = useState(initialMask || '*.*');

    useEffect(() => {
        if (!open) return;
        const p = parseVfsStoredPath(initialValue);
        const split = splitDirectoryAndName(p.path);
        setBrowseMount(p.mount);
        setBrowsePath(split.directory);
        setSelectedNode(null);
        setSelectedPath(null);
        const initialCombinedPath = initialFileName ? `${split.directory}/${initialFileName}` : p.path;
        setManualPath(`${p.mount}:${initialCombinedPath}`);
        setIsPathInputFocused(false);
        setConfirmOverwriteOpen(false);
        setPendingResult(null);
        setMask(initialMask || '*.*');
    }, [open, initialFileName, initialMask, initialOverwrite, initialValue]);

    const buildResult = (): FilePickerResult => {
        let selectedDir = mode === 'saveAs'
            ? normalizeDirectory(selectedNode?.type === 'dir' ? (selectedNode.path || browsePath) : browsePath)
            : normalizeDirectory(browsePath);
        let finalName = mode === 'saveAs'
            ? ((selectedNode && selectedNode.type !== 'dir' ? selectedNode.name : '') || initialFileName || 'untitled.txt')
            : (selectedNode && selectedNode.type !== 'dir' ? selectedNode.name : '');

        const typed = manualPath.trim();
        if (typed) {
            const parsedTyped = parseVfsStoredPath(typed.includes(':') ? typed : `${browseMount}:${typed}`);
            const normalizedTyped = normalizeDirectory(parsedTyped.path);
            if (parsedTyped.mount) {
                setBrowseMount(parsedTyped.mount);
            }
            if (mode === 'saveAs') {
                if (hasFileLikeSegment(normalizedTyped)) {
                    const split = splitDirectoryAndName(normalizedTyped);
                    selectedDir = split.directory;
                    if (split.fileName) finalName = split.fileName;
                } else {
                    selectedDir = normalizedTyped;
                }
            } else {
                if (selectedPath) {
                    if (mode === 'pick' && selectedNode && selectedNode.type !== 'dir') {
                        selectedDir = normalizeDirectory(browsePath);
                    } else {
                        selectedDir = selectedPath;
                    }
                } else {
                    selectedDir = normalizedTyped;
                }
            }
            if (parsedTyped.mount && parsedTyped.mount !== browseMount) {
                selectedDir = normalizedTyped;
            }
        }

        const fullPath = finalName ? `${selectedDir === '/' ? '' : selectedDir}/${finalName}` : selectedDir;
        const finalMount = (() => {
            const typedMount = parseVfsStoredPath(typed || `${browseMount}:${selectedDir}`).mount;
            return typedMount || browseMount;
        })();
        return {
            mount: finalMount,
            directory: selectedDir,
            fileName: finalName,
            fullPath,
            overwrite: false,
            mask,
            encoded: `${finalMount}:${fullPath}`,
        };
    };

    const fileExists = async (candidate: FilePickerResult): Promise<boolean> => {
        const url = vfsUrl('get', candidate.mount, candidate.fullPath);
        const headers = await getAuthHeaders();
        try {
            const headRes = await fetch(url, { method: 'HEAD', headers });
            if (headRes.status === 200) return true;
            if (headRes.status === 404) return false;
            if (headRes.status === 401 || headRes.status === 403) return false;
        } catch {
            // Fallback to GET below
        }
        try {
            const getRes = await fetch(url, { cache: 'no-cache', headers });
            return getRes.status === 200;
        } catch {
            return false;
        }
    };

    const finalizeSelection = (result: FilePickerResult) => {
        onConfirm(result);
        pushPathHistory(result.encoded);
        onOpenChange(false);
    };

    const commitSelection = async () => {
        const result = buildResult();
        if (mode === 'saveAs') {
            const exists = await fileExists(result);
            if (exists && !initialOverwrite) {
                setPendingResult(result);
                setConfirmOverwriteOpen(true);
                return;
            }
        }
        finalizeSelection(result);
    };

    const computedTitle = title || (mode === 'saveAs' ? translate('Save As') : translate('Browse Files'));
    const computedConfirmLabel = confirmLabel || (mode === 'saveAs' ? translate('Save') : translate('Select'));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-w-[96vw] p-0 gap-0 flex flex-col max-h-[92vh]">
                <DialogHeader className="p-4 pb-2 shrink-0">
                    <DialogTitle>{computedTitle}</DialogTitle>
                    <DialogDescription className="sr-only">
                        Select a target path and optional mask, then confirm to continue.
                    </DialogDescription>
                    <p className="text-xs text-muted-foreground font-mono">{manualPath}</p>
                </DialogHeader>
                <div className="flex-1 min-h-0 px-2 pb-2" style={{ height: 460 }}>
                    <FileBrowserWidget
                        key={browseMount}
                        mount={browseMount}
                        path={browsePath}
                        glob={mask || '*.*'}
                        onMountChange={(m: string) => {
                            setBrowseMount(m);
                            if (!isPathInputFocused) setManualPath(`${m}:${browsePath}`);
                            setSelectedNode(null);
                            setSelectedPath(null);
                        }}
                        onPathChange={(p: string) => {
                            setBrowsePath(p);
                            if (!isPathInputFocused) setManualPath(`${browseMount}:${p}`);
                            setSelectedNode(null);
                            setSelectedPath(null);
                        }}
                        onSelect={(p: string | null) => setSelectedPath(p)}
                        onSelectNode={(node) => {
                            setSelectedNode(node);
                        }}
                        viewMode="list"
                        mode="simple"
                        showToolbar={true}
                        sortBy="name"
                        canChangeMount={true}
                        allowFileViewer={false}
                        allowLightbox={false}
                        allowDownload={false}
                        jail={false}
                        minHeight="420px"
                        showStatusBar={true}
                    />
                </div>
                <div className="p-3 border-t space-y-3 shrink-0">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-3 items-end">
                        <div className="space-y-1">
                            <Label className="text-xs"><T>Path</T></Label>
                            <PathHistoryInput
                                value={manualPath}
                            onChange={(value) => {
                                setManualPath(value);
                            }}
                                placeholder="home:/folder/file.ext"
                            onFocus={() => setIsPathInputFocused(true)}
                            onBlur={() => setIsPathInputFocused(false)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs"><T>Mask / Filter</T></Label>
                            <Select
                                value={mask}
                                onValueChange={setMask}
                            >
                                <SelectTrigger className="h-8 text-xs font-mono">
                                    <SelectValue placeholder="*.*" />
                                </SelectTrigger>
                                <SelectContent className="z-[2200]">
                                    {maskPresets.map((preset) => (
                                        <SelectItem key={`${preset.label}-${preset.value}`} value={preset.value} className="text-xs font-mono">
                                            {preset.label}
                                        </SelectItem>
                                    ))}
                                    {!maskPresets.some((preset) => preset.value === mask) && (
                                        <SelectItem value={mask} className="text-xs font-mono">
                                            {mask}
                                        </SelectItem>
                                    )}
                                    {allowClearMask && (
                                        <SelectItem value="*.*" className="text-xs font-mono">
                                            Reset to *.*
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {extensionSlot}
                    <div className="flex justify-between items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono truncate">
                            {selectedPath ? `Selected: ${browseMount}:${selectedPath}` : (mode === 'saveAs' ? 'Type full path or select target' : 'Select file or folder')}
                        </span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                                <T>Cancel</T>
                            </Button>
                            <Button size="sm" disabled={confirmDisabled} onClick={() => { void commitSelection(); }}>
                                {computedConfirmLabel}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
            <ConfirmationDialog
                open={confirmOverwriteOpen}
                onOpenChange={setConfirmOverwriteOpen}
                title="Overwrite existing file?"
                description={pendingResult ? `The file "${pendingResult.encoded}" already exists. Do you want to overwrite it?` : 'The selected file already exists.'}
                confirmLabel="Overwrite"
                cancelLabel="Cancel"
                variant="destructive"
                onConfirm={() => {
                    if (pendingResult) {
                        finalizeSelection({ ...pendingResult, overwrite: true });
                        setPendingResult(null);
                    }
                    setConfirmOverwriteOpen(false);
                }}
                onCancel={() => {
                    setConfirmOverwriteOpen(false);
                    setPendingResult(null);
                }}
            />
        </Dialog>
    );
};

export interface FilePickerFieldProps {
    value?: string;
    onChange: (value?: string) => void;
    disabled?: boolean;
    readonly?: boolean;
    mode?: FilePickerMode;
    placeholder?: string;
    dialogTitle?: string;
    dialogConfirmLabel?: string;
    initialFileName?: string;
    initialOverwrite?: boolean;
    initialMask?: string;
    onResultChange?: (result: FilePickerResult) => void;
}

export const FilePickerField: React.FC<FilePickerFieldProps> = ({
    value,
    onChange,
    disabled,
    readonly,
    mode = 'pick',
    placeholder,
    dialogTitle,
    dialogConfirmLabel,
    initialFileName,
    initialOverwrite,
    initialMask,
    onResultChange,
}) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="space-y-1">
            <div className="flex gap-2">
                <Input
                    readOnly
                    value={value || ''}
                    placeholder={placeholder || 'home:/path'}
                    className="flex-1 font-mono text-[10px] h-8"
                    disabled={disabled}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 px-2"
                    disabled={disabled || readonly}
                    onClick={() => setOpen(true)}
                >
                    <FolderOpen className="h-3 w-3 mr-1" />
                    <span className="text-xs">{translate('Browse')}</span>
                </Button>
                {value && !readonly && !disabled && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => onChange(undefined)}
                        title={translate('Clear')}
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>
            <FilePickerDialog
                open={open}
                onOpenChange={setOpen}
                mode={mode}
                title={dialogTitle}
                confirmLabel={dialogConfirmLabel}
                initialValue={value}
                initialFileName={initialFileName}
                initialOverwrite={initialOverwrite}
                initialMask={initialMask}
                onConfirm={(result) => {
                    onChange(result.encoded);
                    if (onResultChange) onResultChange(result);
                }}
            />
        </div>
    );
};

export default FilePickerField;
