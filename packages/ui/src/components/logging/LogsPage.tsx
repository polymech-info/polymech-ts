/**
 * LogsPage — combined log file selector + viewer.
 *
 * Toolbar: [file dropdown] · [clear UI] · [tail toggle] · [refresh]
 * Body: level tabs · search · entry list with CompactTreeView drill-in.
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { getAdminLogFiles, getAdminLog, clearAdminLog, streamAdminLog, type AdminLogFile } from '@/modules/admin/client-admin';
import { CompactTreeView } from '@/components/ChatLogBrowser';
import { serializeForClipboard } from '@/components/json/JSONTreeWalker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
    RefreshCw, Radio, RadioTower, Search, X, ChevronRight,
    AlertCircle, FileText, Trash2, ArrowLeft, Copy, Check,
} from 'lucide-react';

// ── Level colours ─────────────────────────────────────────────────────

const LEVEL_COLORS: Record<string, string> = {
    FATAL: 'text-red-600', ERROR: 'text-red-500',
    WARN: 'text-yellow-500', INFO: 'text-blue-400',
    DEBUG: 'text-purple-400', TRACE: 'text-muted-foreground',
};
const LEVEL_BG: Record<string, string> = {
    FATAL: 'bg-red-600/15 border-red-600/30', ERROR: 'bg-red-500/10 border-red-500/20',
    WARN: 'bg-yellow-500/10 border-yellow-500/20', INFO: 'bg-blue-500/10 border-blue-500/20',
    DEBUG: 'bg-purple-400/10 border-purple-400/20', TRACE: 'bg-muted/20 border-muted/30',
};
const LEVEL_TABS = ['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG', 'FATAL'];

// ── Entry helpers ─────────────────────────────────────────────────────

interface LogRow {
    _id: string;
    _level: string;
    _time: number;
    _msg: string;
    _raw: Record<string, unknown>;
}

let _seq = 0;
function toRow(entry: unknown): LogRow {
    const r = (entry ?? {}) as Record<string, unknown>;
    const level = String(r.level ?? 'INFO').toUpperCase();
    const time = r.time
        ? new Date(r.time as string).getTime()
        : r.timestamp ? new Date(r.timestamp as string).getTime() : 0;
    return {
        _id: `row-${++_seq}`,
        _level: level,
        _time: time,
        _msg: String(r.msg ?? r.message ?? ''),
        _raw: r,
    };
}

function stripExt(name: string) {
    return name.replace(/\.(json|jsonl)$/, '');
}

function formatTime(ms: number) {
    if (!ms) return '--:--:--';
    return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function preview(msg: string, max = 110) {
    const s = msg.replace(/\n/g, ' ').trim();
    return s.length > max ? s.slice(0, max) + '…' : s;
}

// ── Copy button ───────────────────────────────────────────────────────

const CopyButton: React.FC<{ getText: () => string }> = ({ getText }) => {
    const [copied, setCopied] = useState(false);
    const handle = (e: React.MouseEvent) => {
        e.stopPropagation();
        let text: string;
        try {
            text = getText();
        } catch {
            text = '';
        }
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        }).catch(() => {
            const el = document.createElement('textarea');
            el.value = text;
            el.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        });
    };
    return (
        <button
            onClick={handle}
            title="Copy full entry as JSON (all fields)"
            className="flex-shrink-0 invisible group-hover:visible text-muted-foreground hover:text-foreground transition-colors"
        >
            {copied
                ? <Check className="h-3 w-3 text-green-500" />
                : <Copy className="h-3 w-3" />
            }
        </button>
    );
};

const PAGE_SIZE = 200;

// ── Component ─────────────────────────────────────────────────────────

const LogsPage: React.FC = () => {
    // File list
    const [files, setFiles] = useState<AdminLogFile[]>([]);
    const [activeFile, setActiveFile] = useState<string | null>(null);

    // Entries
    const [rows, setRows] = useState<LogRow[]>([]);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [levelFilter, setLevelFilter] = useState('ALL');
    const [search, setSearch] = useState('');

    // Stream
    const [streaming, setStreaming] = useState(false);
    const [streamError, setStreamError] = useState<string | null>(null);
    const streamAbortRef = useRef<AbortController | null>(null);

    // Generation counter — increment to discard in-flight loadEntries results
    const genRef = useRef(0);
    const [clearing, setClearing] = useState(false);

    // List nav / drill-in
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [highlightedIdx, setHighlightedIdx] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);

    // ── Load file list ────────────────────────────────────────────────

    const loadFiles = useCallback(async () => {
        try {
            const res = await getAdminLogFiles();
            // Server already puts app.log first; preserve that, sort the rest alpha
            const [pinned, rest] = res.files.reduce<[AdminLogFile[], AdminLogFile[]]>(
                ([p, r], f) => f.name === 'app.log' ? [[...p, f], r] : [p, [...r, f]],
                [[], []],
            );
            const sorted = [...pinned, ...rest.sort((a, b) => stripExt(a.name).localeCompare(stripExt(b.name)))];
            setFiles(sorted);
            if (sorted.length > 0 && !activeFile) {
                setActiveFile(sorted[0].name);
            }
        } catch { /* non-fatal */ }
    }, [activeFile]);

    useEffect(() => { loadFiles(); }, []);

    // ── Load entries ──────────────────────────────────────────────────

    const loadEntries = useCallback(async (newOffset = 0, append = false) => {
        if (!activeFile) return;
        setLoading(true);
        setError(null);
        try {
            const res = await getAdminLog(activeFile, {
                limit: PAGE_SIZE,
                offset: newOffset,
                level: levelFilter !== 'ALL' ? levelFilter : undefined,
            });
            const newRows = (res.entries as unknown[]).map(toRow);
            setRows(prev => append ? [...prev, ...newRows] : newRows);
            setTotal(res.total);
            setOffset(newOffset);
        } catch (e: any) {
            setError(e?.message ?? 'Failed to load log');
        } finally {
            setLoading(false);
        }
    }, [activeFile, levelFilter]);

    // Reload when file or level filter changes
    useEffect(() => {
        setRows([]);
        setTotal(0);
        setSelectedId(null);
        setHighlightedIdx(0);
        setSearch('');
        stopStream();
        if (activeFile) loadEntries(0, false);
    }, [activeFile, levelFilter]);

    // ── SSE tail ──────────────────────────────────────────────────────

    const stopStream = useCallback(() => {
        streamAbortRef.current?.abort();
        streamAbortRef.current = null;
        setStreaming(false);
    }, []);

    const startStream = useCallback(() => {
        if (!activeFile || streaming) return;
        setStreamError(null);
        setStreaming(true);
        const ac = new AbortController();
        streamAbortRef.current = ac;
        streamAdminLog(
            activeFile,
            (entry) => {
                setRows(prev => [toRow(entry), ...prev].slice(0, 2000));
                setTotal(t => t + 1);
            },
            ac.signal,
        )
            .then(() => setStreaming(false))
            .catch(e => {
                if (e?.name !== 'AbortError') setStreamError(e?.message ?? 'Stream error');
                setStreaming(false);
            });
    }, [activeFile, streaming]);

    useEffect(() => () => { streamAbortRef.current?.abort(); }, []);

    // ── Filtered list ─────────────────────────────────────────────────

    const filtered = useMemo(() => {
        if (!search.trim()) return rows;
        const terms = search.toLowerCase().split(' ').filter(Boolean);
        return rows.filter(r =>
            terms.every(t =>
                r._msg.toLowerCase().includes(t) ||
                r._level.toLowerCase().includes(t) ||
                JSON.stringify(r._raw).toLowerCase().includes(t)
            )
        );
    }, [rows, search]);

    const counts = useMemo(() => {
        const c: Record<string, number> = { ALL: rows.length };
        for (const r of rows) c[r._level] = (c[r._level] || 0) + 1;
        return c;
    }, [rows]);

    // ── Keyboard nav ──────────────────────────────────────────────────

    useEffect(() => {
        if (selectedId !== null) return;
        const el = listRef.current;
        if (!el) return;
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIdx(i => Math.min(i + 1, filtered.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIdx(i => Math.max(i - 1, 0)); }
            else if (e.key === 'Enter' || e.key === 'ArrowRight') {
                e.preventDefault();
                if (filtered[highlightedIdx]) setSelectedId(filtered[highlightedIdx]._id);
            }
        };
        el.addEventListener('keydown', handler);
        return () => el.removeEventListener('keydown', handler);
    }, [selectedId, filtered, highlightedIdx]);

    useEffect(() => {
        listRef.current?.querySelector(`[data-row-idx="${highlightedIdx}"]`)
            ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [highlightedIdx]);

    const handleBack = useCallback(() => {
        setSelectedId(null);
        requestAnimationFrame(() => listRef.current?.focus());
    }, []);

    // ── Drill-in view ─────────────────────────────────────────────────

    const selectedRow = selectedId ? rows.find(r => r._id === selectedId) ?? null : null;

    if (selectedRow) {
        const lvl = selectedRow._level;
        return (
            <div className="flex flex-col h-full min-h-0">
                <CompactTreeView
                    key={selectedRow._id}
                    data={selectedRow._raw}
                    onExit={handleBack}
                    header={
                        <div className="flex items-center gap-1.5 px-2 py-1.5 border-b bg-muted/20 flex-shrink-0">
                            <Button variant="ghost" size="sm" className="h-6 px-1.5 gap-1 text-xs" onClick={handleBack}>
                                <ArrowLeft className="h-3 w-3" /> Back
                            </Button>
                            <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border', LEVEL_BG[lvl], LEVEL_COLORS[lvl])}>
                                {lvl}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">{formatTime(selectedRow._time)}</span>
                            <span className="text-[10px] text-muted-foreground truncate flex-1 min-w-0">
                                {preview(selectedRow._msg, 60)}
                            </span>
                        </div>
                    }
                />
            </div>
        );
    }

    // ── List view ─────────────────────────────────────────────────────

    const activeLabel = activeFile ? stripExt(activeFile) : null;

    return (
        <div className="flex flex-col h-full min-h-0 gap-3">

            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                {/* File dropdown */}
                <Select
                    value={activeFile ?? ''}
                    onValueChange={v => { setActiveFile(v); }}
                    disabled={files.length === 0}
                >
                    <SelectTrigger className="h-8 w-44 text-xs font-mono">
                        <SelectValue placeholder="Select log…" />
                    </SelectTrigger>
                    <SelectContent>
                        {files.map(f => (
                            <SelectItem key={f.name} value={f.name} className="text-xs font-mono">
                                {stripExt(f.name)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Active name + count */}
                {activeLabel && (
                    <span className="text-sm font-semibold text-foreground/80 hidden sm:block">
                        {activeLabel}
                        {total > 0 && (
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">{total}</span>
                        )}
                    </span>
                )}

                <div className="flex-1" />

                {/* Stream error */}
                {streamError && (
                    <span className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> {streamError}
                    </span>
                )}

                {/* Clear — truncates file on server + resets UI */}
                <Button
                    variant="ghost" size="sm"
                    className="h-8 gap-1.5 text-xs"
                    disabled={!activeFile || clearing}
                    onClick={async () => {
                        if (!activeFile) return;
                        setClearing(true);
                        genRef.current++;          // discard any in-flight load
                        try {
                            await clearAdminLog(activeFile);
                        } catch { /* best-effort */ }
                        setRows([]);
                        setTotal(0);
                        setOffset(0);
                        setSelectedId(null);
                        setHighlightedIdx(0);
                        setClearing(false);
                    }}
                    title="Clear log file on server"
                >
                    {clearing
                        ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />
                    }
                    <span className="hidden sm:inline">Clear</span>
                </Button>

                {/* Tail toggle */}
                <Button
                    variant={streaming ? 'destructive' : 'outline'}
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    disabled={!activeFile}
                    onClick={streaming ? stopStream : startStream}
                >
                    {streaming
                        ? <><RadioTower className="h-3.5 w-3.5 animate-pulse" /><span className="hidden sm:inline">Stop</span></>
                        : <><Radio className="h-3.5 w-3.5" /><span className="hidden sm:inline">Tail</span></>
                    }
                </Button>

                {/* Refresh */}
                <Button
                    variant="ghost" size="sm"
                    className="h-8 w-8 p-0"
                    disabled={loading || !activeFile}
                    onClick={() => loadEntries(0, false)}
                    title="Reload entries"
                >
                    <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
                </Button>
            </div>

            {/* Load error */}
            {error && (
                <div className="flex items-center gap-2 text-destructive text-xs p-2 border border-destructive/30 rounded bg-destructive/5 flex-shrink-0">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> {error}
                </div>
            )}

            {/* Search + level tabs */}
            {activeFile && (
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Search entries…"
                            className="h-8 text-xs pl-8 pr-7 font-mono"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setHighlightedIdx(0); }}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-0.5 overflow-x-auto">
                        {LEVEL_TABS.map(key => (
                            <button
                                key={key}
                                onClick={() => { setLevelFilter(key); setHighlightedIdx(0); }}
                                className={cn(
                                    'text-[10px] px-2 py-0.5 rounded transition-colors whitespace-nowrap font-mono',
                                    levelFilter === key
                                        ? 'bg-primary text-primary-foreground font-semibold'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                )}
                            >
                                {key === 'ALL' ? 'All' : key.charAt(0) + key.slice(1).toLowerCase()}
                                <span className="ml-0.5 opacity-60">
                                    {key === 'ALL' ? rows.length : (counts[key] || 0) || ''}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Entry list */}
            <div
                ref={listRef}
                tabIndex={0}
                className="flex-1 min-h-0 overflow-y-auto border rounded-lg bg-card outline-none focus:ring-1 focus:ring-primary/20 focus:ring-inset font-mono text-[11px]"
            >
                {!activeFile ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-xs gap-1.5">
                        <FileText className="h-6 w-6 stroke-1" />
                        Select a log file above
                    </div>
                ) : loading && filtered.length === 0 ? (
                    <div className="flex items-center justify-center h-24 text-muted-foreground text-xs gap-2">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Loading…
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-24 text-muted-foreground text-xs gap-1">
                        <FileText className="h-5 w-5 stroke-1" />
                        <span>No entries{search ? ' matching search' : ''}</span>
                    </div>
                ) : (
                    <div className="p-1">
                        {streaming && (
                            <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-primary animate-pulse border-b border-primary/10 mb-1">
                                <RadioTower className="h-3 w-3" /> Tailing live…
                            </div>
                        )}
                        {filtered.map((row, idx) => (
                            <div
                                key={row._id}
                                data-row-idx={idx}
                                onClick={() => { setHighlightedIdx(idx); setSelectedId(row._id); }}
                                className={cn(
                                    'flex items-center gap-1.5 px-2 py-[3px] rounded cursor-pointer transition-colors group',
                                    highlightedIdx === idx
                                        ? 'bg-primary/10 ring-1 ring-primary/30'
                                        : 'hover:bg-muted/50',
                                )}
                            >
                                <span className="text-muted-foreground/60 flex-shrink-0 tabular-nums w-16 text-right text-[10px]">
                                    {formatTime(row._time)}
                                </span>
                                <span className={cn(
                                    'flex-shrink-0 px-1 rounded text-[10px] font-semibold border',
                                    LEVEL_BG[row._level] ?? 'bg-muted/20 border-muted/30',
                                    LEVEL_COLORS[row._level] ?? 'text-muted-foreground',
                                )}>
                                    {row._level.slice(0, 3)}
                                </span>
                                <span className="flex-1 min-w-0 truncate text-foreground/90">
                                    {preview(row._msg)}
                                </span>
                                <CopyButton getText={() => serializeForClipboard(row._raw)} />
                                <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-50 flex-shrink-0 transition-opacity" />
                            </div>
                        ))}

                        {/* Load more */}
                        {!search && offset + PAGE_SIZE < total && (
                            <div className="flex justify-center pt-2 pb-1">
                                <Button
                                    variant="ghost" size="sm"
                                    className="h-6 text-xs gap-1"
                                    disabled={loading}
                                    onClick={() => loadEntries(offset + PAGE_SIZE, true)}
                                >
                                    {loading
                                        ? <RefreshCw className="h-3 w-3 animate-spin" />
                                        : `Load more (${total - offset - PAGE_SIZE} remaining)`
                                    }
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LogsPage;
