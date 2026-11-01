/**
 * LogViewerPage — browse a single server log file.
 *
 * Gets `file` from React Router params (/admin/logs/:file).
 * Historical load via GET /api/admin/logs/:file.
 * Live tail via SSE (fetch-based) GET /api/admin/logs/:file/stream.
 * Drill-in via CompactTreeView (same as ChatLogBrowser).
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAdminLog, streamAdminLog } from '@/modules/admin/client-admin';
import { CompactTreeView } from '@/components/ChatLogBrowser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    ArrowLeft, RefreshCw, Radio, RadioTower, Search, X, ChevronRight,
    AlertCircle, FileText,
} from 'lucide-react';

// ── Pino level mapping ────────────────────────────────────────────────

type PinoLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL' | string;

const LEVEL_COLORS: Record<string, string> = {
    FATAL: 'text-red-600',
    ERROR: 'text-red-500',
    WARN: 'text-yellow-500',
    INFO: 'text-blue-400',
    DEBUG: 'text-purple-400',
    TRACE: 'text-muted-foreground',
};

const LEVEL_BG: Record<string, string> = {
    FATAL: 'bg-red-600/15 border-red-600/30',
    ERROR: 'bg-red-500/10 border-red-500/20',
    WARN: 'bg-yellow-500/10 border-yellow-500/20',
    INFO: 'bg-blue-500/10 border-blue-500/20',
    DEBUG: 'bg-purple-400/10 border-purple-400/20',
    TRACE: 'bg-muted/20 border-muted/30',
};

const LEVEL_TABS: Array<{ key: string; label: string }> = [
    { key: 'ALL', label: 'All' },
    { key: 'INFO', label: 'Info' },
    { key: 'WARN', label: 'Warn' },
    { key: 'ERROR', label: 'Error' },
    { key: 'DEBUG', label: 'Debug' },
    { key: 'FATAL', label: 'Fatal' },
];

// ── Entry helpers ─────────────────────────────────────────────────────

interface LogRow {
    _id: string;
    _level: string;
    _time: number;
    _msg: string;
    _raw: Record<string, unknown>;
}

function toRow(entry: unknown, id: string): LogRow {
    const r = (entry ?? {}) as Record<string, unknown>;
    const level = String(r.level ?? 'INFO').toUpperCase();
    const time = r.time
        ? new Date(r.time as string).getTime()
        : r.timestamp
        ? new Date(r.timestamp as string).getTime()
        : 0;
    const msg = String(r.msg ?? r.message ?? '');
    return { _id: id, _level: level, _time: time, _msg: msg, _raw: r };
}

function formatTime(ms: number): string {
    if (!ms) return '--:--:--';
    const d = new Date(ms);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function preview(msg: string, max = 100): string {
    const s = msg.replace(/\n/g, ' ').trim();
    return s.length > max ? s.slice(0, max) + '…' : s;
}

// ── Main component ────────────────────────────────────────────────────

const PAGE_SIZE = 200;

const LogViewerPage: React.FC = () => {
    const { file } = useParams<{ file: string }>();
    const navigate = useNavigate();

    const [rows, setRows] = useState<LogRow[]>([]);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [levelFilter, setLevelFilter] = useState('ALL');
    const [search, setSearch] = useState('');

    const [streaming, setStreaming] = useState(false);
    const [streamError, setStreamError] = useState<string | null>(null);
    const streamAbortRef = useRef<AbortController | null>(null);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [highlightedIdx, setHighlightedIdx] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);

    // ── Load historical entries ───────────────────────────────────────

    const load = useCallback(async (newOffset = 0, append = false) => {
        if (!file) return;
        setLoading(true);
        setError(null);
        try {
            const res = await getAdminLog(file, {
                limit: PAGE_SIZE,
                offset: newOffset,
                level: levelFilter !== 'ALL' ? levelFilter : undefined,
            });
            const newRows = (res.entries as unknown[]).map((e, i) =>
                toRow(e, `hist-${newOffset + i}-${Math.random().toString(36).slice(2)}`)
            );
            setRows(prev => append ? [...prev, ...newRows] : newRows);
            setTotal(res.total);
            setOffset(newOffset);
        } catch (e: any) {
            setError(e?.message ?? 'Failed to load log');
        } finally {
            setLoading(false);
        }
    }, [file, levelFilter]);

    // Reload on filter change
    useEffect(() => {
        setSelectedId(null);
        setHighlightedIdx(0);
        load(0, false);
    }, [file, levelFilter]);

    // ── SSE stream ────────────────────────────────────────────────────

    const startStream = useCallback(() => {
        if (!file || streaming) return;
        setStreamError(null);
        setStreaming(true);
        const ac = new AbortController();
        streamAbortRef.current = ac;

        streamAdminLog(
            file,
            (entry) => {
                const row = toRow(entry, `stream-${Date.now()}-${Math.random().toString(36).slice(2)}`);
                setRows(prev => [row, ...prev].slice(0, 2000));
                setTotal(t => t + 1);
            },
            ac.signal,
        )
            .then(() => { setStreaming(false); })
            .catch(e => {
                if (e?.name !== 'AbortError') {
                    setStreamError(e?.message ?? 'Stream error');
                }
                setStreaming(false);
            });
    }, [file, streaming]);

    const stopStream = useCallback(() => {
        streamAbortRef.current?.abort();
        streamAbortRef.current = null;
        setStreaming(false);
    }, []);

    useEffect(() => () => { streamAbortRef.current?.abort(); }, []);

    // ── Filtered list ─────────────────────────────────────────────────

    const filtered = useMemo(() => {
        let r = rows;
        if (search.trim()) {
            const terms = search.toLowerCase().split(' ').filter(Boolean);
            r = r.filter(row =>
                terms.every(t =>
                    row._msg.toLowerCase().includes(t) ||
                    row._level.toLowerCase().includes(t) ||
                    JSON.stringify(row._raw).toLowerCase().includes(t)
                )
            );
        }
        return r;
    }, [rows, search]);

    // ── Keyboard nav in list ──────────────────────────────────────────

    useEffect(() => {
        if (selectedId !== null) return;
        const el = listRef.current;
        if (!el) return;
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedIdx(i => Math.min(i + 1, filtered.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedIdx(i => Math.max(i - 1, 0));
            } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
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

    // ── Level counts ──────────────────────────────────────────────────

    const counts = useMemo(() => {
        const c: Record<string, number> = { ALL: rows.length };
        for (const r of rows) c[r._level] = (c[r._level] || 0) + 1;
        return c;
    }, [rows]);

    // ── Drill-in (CompactTreeView) ────────────────────────────────────

    const selectedRow = useMemo(
        () => selectedId ? rows.find(r => r._id === selectedId) ?? null : null,
        [selectedId, rows],
    );

    const handleBack = useCallback(() => {
        setSelectedId(null);
        requestAnimationFrame(() => listRef.current?.focus());
    }, []);

    if (selectedRow) {
        const lvl = selectedRow._level;
        return (
            <div className="flex flex-col h-full min-h-0">
                <CompactTreeView
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
                            <span className="text-[10px] text-muted-foreground font-mono">
                                {formatTime(selectedRow._time)}
                            </span>
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

    return (
        <div className="flex flex-col h-full min-h-0 gap-3">

            {/* Header */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs" onClick={() => navigate('/admin/logs')}>
                    <ArrowLeft className="h-3.5 w-3.5" /> Logs
                </Button>
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm font-semibold">{file}</span>
                <span className="text-xs text-muted-foreground ml-1">
                    {total > 0 && `${total} entries`}
                </span>
                <div className="flex-1" />
                <Button
                    variant={streaming ? 'destructive' : 'outline'}
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={streaming ? stopStream : startStream}
                >
                    {streaming
                        ? <><RadioTower className="h-3.5 w-3.5 animate-pulse" /> Stop</>
                        : <><Radio className="h-3.5 w-3.5" /> Tail</>
                    }
                </Button>
                <Button
                    variant="ghost" size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() => load(0, false)}
                    disabled={loading}
                >
                    <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
                </Button>
            </div>

            {/* Errors */}
            {(error || streamError) && (
                <div className="flex items-center gap-2 text-destructive text-xs p-2 border border-destructive/30 rounded bg-destructive/5 flex-shrink-0">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {error || streamError}
                </div>
            )}

            {/* Search + level tabs */}
            <div className="flex flex-col gap-1.5 flex-shrink-0">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Search entries…"
                        className="h-8 text-xs pl-7 pr-7 font-mono"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setHighlightedIdx(0); }}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
                <div className="flex gap-0.5 overflow-x-auto">
                    {LEVEL_TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => { setLevelFilter(tab.key); setHighlightedIdx(0); }}
                            className={cn(
                                'text-[10px] px-2 py-0.5 rounded transition-colors whitespace-nowrap font-mono',
                                levelFilter === tab.key
                                    ? 'bg-primary text-primary-foreground font-semibold'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            )}
                        >
                            {tab.label}
                            {tab.key !== 'ALL' && (counts[tab.key] || 0) > 0 && (
                                <span className="ml-0.5 opacity-60">{counts[tab.key]}</span>
                            )}
                            {tab.key === 'ALL' && (
                                <span className="ml-0.5 opacity-60">{rows.length}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Entry list */}
            <div
                ref={listRef}
                tabIndex={0}
                className="flex-1 min-h-0 overflow-y-auto border rounded-lg bg-card outline-none focus:ring-1 focus:ring-primary/20 focus:ring-inset font-mono text-[11px]"
            >
                {loading && filtered.length === 0 ? (
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
                            <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-primary animate-pulse">
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
                                <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-50 flex-shrink-0 transition-opacity" />
                            </div>
                        ))}

                        {/* Load more */}
                        {!search && offset + PAGE_SIZE < total && (
                            <div className="flex justify-center pt-2 pb-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs gap-1"
                                    disabled={loading}
                                    onClick={() => load(offset + PAGE_SIZE, true)}
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

export default LogViewerPage;
