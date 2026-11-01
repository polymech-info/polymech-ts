/**
 * ChatLogBrowser — Browse log entries with compact inline tree
 *
 * Transforms LogEntry[] into a navigable list.
 * Drill into any entry to inspect its fields as a compact line-based tree.
 * JSON-containing messages are auto-parsed into browsable sub-trees.
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { LogEntry } from '@/contexts/LogContext';
import { resolveNavItems, serializeForClipboard, getValueAtPath } from '@/components/json/JSONTreeWalker';

/** Value for clipboard: walk from root `data` (same as the list) with fallback to the row’s resolved value. */
function valueForCopy(data: any, path: string[], key: string, fallback: unknown): unknown {
    const v = getValueAtPath(data, [...path, key]);
    return v !== undefined ? v : fallback;
}
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    ListFilter, Trash2, Search, X, ChevronRight, ArrowLeft, Home, Copy, Check,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────

interface ChatLogBrowserProps {
    logs: LogEntry[];
    clearLogs: () => void;
    title?: string;
}

type LevelFilter = 'all' | 'info' | 'debug' | 'warning' | 'error' | 'success';

// ── Helpers ──────────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<string, string> = {
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
    debug: 'text-purple-400',
    success: 'text-green-500',
};

const LEVEL_BG: Record<string, string> = {
    error: 'bg-red-500/10 border-red-500/20',
    warning: 'bg-yellow-500/10 border-yellow-500/20',
    info: 'bg-blue-500/10 border-blue-500/20',
    debug: 'bg-purple-400/10 border-purple-400/20',
    success: 'bg-green-500/10 border-green-500/20',
};

/** Try to extract JSON from a log message string. */
function tryParseJson(msg: string): any | null {
    try {
        const parsed = JSON.parse(msg);
        if (typeof parsed === 'object' && parsed !== null) return parsed;
    } catch { /* not pure JSON */ }
    const firstBrace = msg.search(/[{\[]/);
    if (firstBrace >= 0) {
        const sub = msg.slice(firstBrace);
        try {
            const parsed = JSON.parse(sub);
            if (typeof parsed === 'object' && parsed !== null) return parsed;
        } catch { /* no valid JSON suffix */ }
    }
    return null;
}

/** Build a structured object from a LogEntry for tree browsing. */
function logEntryToTree(log: LogEntry): Record<string, any> {
    const tree: Record<string, any> = {
        level: log.level,
        timestamp: log.timestamp.toLocaleTimeString([], {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        }),
        message: log.message,
    };
    if (log.category) tree.category = log.category;
    // Structured data from tools (preferred) or auto-parsed JSON from message
    if (log.data) {
        tree.data = log.data;
    } else {
        const parsed = tryParseJson(log.message);
        if (parsed) tree.parsedContent = parsed;
    }
    return tree;
}

/** Short preview of a log message. */
function previewMessage(msg: string, maxLen = 80): string {
    const line = msg.replace(/\n/g, ' ').trim();
    return line.length > maxLen ? line.slice(0, maxLen) + '…' : line;
}

/** Format a value for compact display. */
function compactValue(val: any): string {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'object') {
        if (Array.isArray(val)) return `[${val.length} items]`;
        const keys = Object.keys(val);
        return `{${keys.length} keys}`;
    }
    const s = String(val);
    return s.length > 120 ? s.slice(0, 120) + '…' : s;
}

// ── Tree copy button ─────────────────────────────────────────────────────

const TreeCopyButton: React.FC<{ getText: () => string }> = ({ getText }) => {
    const [copied, setCopied] = useState(false);
    const handle = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
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
            el.style.position = 'fixed';
            el.style.opacity = '0';
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
            onPointerDown={(e) => { e.stopPropagation(); }}
            onClick={handle}
            title="Copy value"
            className="flex-shrink-0 invisible group-hover:visible text-muted-foreground hover:text-foreground transition-colors ml-0.5"
        >
            {copied
                ? <Check className="h-2.5 w-2.5 text-green-500" />
                : <Copy className="h-2.5 w-2.5" />
            }
        </button>
    );
};

// ── Compact Tree View ────────────────────────────────────────────────────

interface DeepSearchResult {
    path: string[];
    key: string;
    value: any;
    displayValue: string;
    canDrillIn: boolean;
}

/** Recursively collect all matching key/value pairs with their full paths. */
function deepCollect(obj: any, terms: string[], currentPath: string[], results: DeepSearchResult[], maxResults = 100): void {
    if (results.length >= maxResults || obj == null || typeof obj !== 'object') return;
    const entries = Array.isArray(obj)
        ? obj.map((v, i) => [String(i), v] as [string, any])
        : Object.entries(obj);
    for (const [key, value] of entries) {
        const keyLower = key.toLowerCase();
        const isObj = value !== null && typeof value === 'object';
        const isArr = Array.isArray(value);
        const valStr = isObj
            ? (isArr ? `[${(value as any[]).length} items]` : `{${Object.keys(value as object).length} keys}`)
            : String(value ?? 'null');
        const valLower = valStr.toLowerCase();
        const fullPath = [...currentPath, key];

        // Check if this entry matches
        const keyMatches = terms.every(t => keyLower.includes(t));
        const valMatches = !isObj && terms.every(t => valLower.includes(t));

        if (keyMatches || valMatches) {
            results.push({
                path: currentPath,
                key,
                value,
                displayValue: valStr,
                canDrillIn: isObj,
            });
        }

        // Recurse into children regardless (to find deeper matches)
        if (isObj && results.length < maxResults) {
            deepCollect(value, terms, fullPath, results, maxResults);
        }
    }
}

export const CompactTreeView: React.FC<{
    data: any;
    onExit: () => void;
    header: React.ReactNode;
}> = ({ data, onExit, header }) => {
    const [path, setPath] = useState<string[]>([]);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Resolve items at current path (normal browsing)
    const rawItems = useMemo(() => {
        return resolveNavItems(data, path) || [];
    }, [data, path]);

    // Deep search results (flat list with paths)
    const searchResults = useMemo(() => {
        if (!search.trim()) return null;
        const terms = search.toLowerCase().split(' ').filter(Boolean);
        const results: DeepSearchResult[] = [];
        deepCollect(data, terms, [], results);
        return results;
    }, [data, search]);

    // Active list: search results or normal items
    const isSearchMode = searchResults !== null;
    const listLength = isSearchMode ? searchResults!.length : rawItems.length;

    // Clamp selection
    useEffect(() => {
        if (selectedIdx >= listLength) setSelectedIdx(Math.max(0, listLength - 1));
    }, [listLength, selectedIdx]);

    // Auto-focus container on mount so keyboard nav works immediately
    useEffect(() => {
        requestAnimationFrame(() => containerRef.current?.focus());
    }, []);

    // Reset search on path change (selectedIdx is managed by goUp / drill-in)
    useEffect(() => {
        setSearch('');
    }, [path]);

    // Navigate to a deep search result
    const navigateToResult = useCallback((result: DeepSearchResult) => {
        // Navigate to the parent path, so the matched key is visible in the list
        if (result.canDrillIn) {
            setPath([...result.path, result.key]);
        } else {
            setPath(result.path);
        }
        setSelectedIdx(0);
    }, []);

    // Keyboard nav
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    setSearch('');
                    containerRef.current?.focus();
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIdx(i => i >= listLength - 1 ? 0 : i + 1);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIdx(i => i <= 0 ? listLength - 1 : i - 1);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (isSearchMode && searchResults![selectedIdx]) {
                        navigateToResult(searchResults![selectedIdx]);
                    }
                }
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIdx(i => i >= listLength - 1 ? 0 : i + 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIdx(i => i <= 0 ? listLength - 1 : i - 1);
            } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
                e.preventDefault();
                if (isSearchMode) {
                    const r = searchResults![selectedIdx];
                    if (r) navigateToResult(r);
                } else {
                    const item = rawItems[selectedIdx];
                    if (item?.canDrillIn) {
                        setPath(p => [...p, item.key]);
                        setSelectedIdx(0);
                    }
                }
            } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
                e.preventDefault();
                if (path.length > 0) {
                    const lastSeg = path[path.length - 1];
                    const parentPath = path.slice(0, -1);
                    const parentItems = resolveNavItems(data, parentPath) || [];
                    const restoredIdx = parentItems.findIndex((it: any) => it.key === lastSeg);
                    setPath(parentPath);
                    setSelectedIdx(restoredIdx >= 0 ? restoredIdx : 0);
                } else {
                    onExit();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                if (path.length > 0) {
                    const firstSeg = path[0];
                    const rootItems = resolveNavItems(data, []) || [];
                    const restoredIdx = rootItems.findIndex((it: any) => it.key === firstSeg);
                    setPath([]);
                    setSelectedIdx(restoredIdx >= 0 ? restoredIdx : 0);
                }
                else onExit();
            } else if (e.key === 'Home') {
                e.preventDefault();
                setSelectedIdx(0);
            } else if (e.key === 'End') {
                e.preventDefault();
                setSelectedIdx(listLength - 1);
            } else if (e.key === '/' || (e.key === 'f' && e.ctrlKey)) {
                e.preventDefault();
                searchRef.current?.focus();
            } else if (e.key === 'c' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                if (isSearchMode) {
                    const r = searchResults![selectedIdx];
                    if (r) {
                        navigator.clipboard.writeText(
                            serializeForClipboard(valueForCopy(data, r.path, r.key, r.value)),
                        );
                    }
                } else {
                    const it = rawItems[selectedIdx];
                    if (it) {
                        navigator.clipboard.writeText(
                            serializeForClipboard(valueForCopy(data, path, it.key, it.value)),
                        );
                    }
                }
            }
        };
        el.addEventListener('keydown', handler);
        return () => el.removeEventListener('keydown', handler);
    }, [listLength, selectedIdx, path, onExit, isSearchMode, searchResults, rawItems, navigateToResult]);

    // Scroll selection into view
    useEffect(() => {
        const el = containerRef.current?.querySelector(`[data-tree-idx="${selectedIdx}"]`);
        el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [selectedIdx]);

    return (
        <div className="flex flex-col h-full">
            {/* Header with back */}
            {header}

            {/* Search bar */}
            <div className="flex items-center gap-1 px-2 py-1 border-b bg-muted/10 flex-shrink-0">
                <Search className="h-2.5 w-2.5 text-muted-foreground" />
                <Input
                    ref={searchRef}
                    placeholder="Deep search... (/ to focus)"
                    className="h-5 text-[10px] bg-background flex-1 border-0 shadow-none focus-visible:ring-0 px-1 font-mono"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setSelectedIdx(0); }}
                />
                {search && (
                    <button onClick={() => { setSearch(''); containerRef.current?.focus(); }} className="text-muted-foreground hover:text-foreground">
                        <X className="h-2.5 w-2.5" />
                    </button>
                )}
                {search && (
                    <span className="text-[9px] text-muted-foreground/60 tabular-nums">{listLength}</span>
                )}
            </div>

            {/* Breadcrumb (only in browse mode) */}
            {!isSearchMode && path.length > 0 && (
                <div className="flex items-center gap-0.5 px-2 py-1 border-b bg-muted/10 text-[10px] font-mono flex-shrink-0 overflow-x-auto">
                    <button
                        onClick={() => {
                            const firstSeg = path[0];
                            const rootItems = resolveNavItems(data, []) || [];
                            const idx = rootItems.findIndex((it: any) => it.key === firstSeg);
                            setPath([]);
                            setSelectedIdx(idx >= 0 ? idx : 0);
                        }}
                        className="flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Home className="h-2.5 w-2.5" />
                    </button>
                    {path.map((seg, i) => (
                        <React.Fragment key={i}>
                            <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/40" />
                            <button
                                onClick={() => {
                                    const targetPath = path.slice(0, i + 1);
                                    const childSeg = path[i + 1];
                                    if (childSeg) {
                                        const items = resolveNavItems(data, targetPath) || [];
                                        const idx = items.findIndex((it: any) => it.key === childSeg);
                                        setSelectedIdx(idx >= 0 ? idx : 0);
                                    } else {
                                        setSelectedIdx(0);
                                    }
                                    setPath(targetPath);
                                }}
                                className={cn(
                                    "px-1 py-0.5 rounded transition-colors",
                                    i === path.length - 1
                                        ? "text-primary font-semibold"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                {seg}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            )}

            {/* Items / Search Results */}
            <div
                ref={containerRef}
                tabIndex={0}
                className="flex-1 overflow-y-auto outline-none font-mono text-[11px]"
            >
                {isSearchMode ? (
                    /* ── Deep search results ── */
                    searchResults!.length === 0 ? (
                        <div className="text-muted-foreground text-xs text-center py-4 opacity-60">No matches</div>
                    ) : (
                        searchResults!.map((result, idx) => (
                            <div
                                key={`${result.path.join('.')}.${result.key}-${idx}`}
                                data-tree-idx={idx}
                                onClick={() => { setSelectedIdx(idx); navigateToResult(result); }}
                                className={cn(
                                    "px-2 py-1 rounded cursor-pointer transition-colors group",
                                    selectedIdx === idx
                                        ? "bg-primary/10 ring-1 ring-primary/30"
                                        : "hover:bg-muted/50",
                                )}
                            >
                                {/* Path breadcrumb */}
                                {result.path.length > 0 && (
                                    <div className="text-[9px] text-muted-foreground/50 truncate mb-0.5">
                                        {result.path.join(' › ')}
                                    </div>
                                )}
                                {/* Key : Value */}
                                <div className="flex items-center gap-1.5">
                                    <span className="text-blue-400 flex-shrink-0">{result.key}</span>
                                    <span className="text-muted-foreground/40">:</span>
                                    <span className={cn(
                                        "flex-1 min-w-0 truncate",
                                        result.canDrillIn ? "text-muted-foreground" : "text-foreground/80"
                                    )}>
                                        {result.displayValue.length > 120 ? result.displayValue.slice(0, 120) + '…' : result.displayValue}
                                    </span>
                                    <TreeCopyButton getText={() => serializeForClipboard(valueForCopy(data, result.path, result.key, result.value))} />
                                    {result.canDrillIn && (
                                        <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-60 flex-shrink-0 transition-opacity" />
                                    )}
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    /* ── Normal browse items ── */
                    rawItems.length === 0 ? (
                        <div className="text-muted-foreground text-xs text-center py-4 opacity-60">Empty</div>
                    ) : (
                        rawItems.map((item, idx) => (
                            <div
                                key={item.key}
                                data-tree-idx={idx}
                                onClick={() => {
                                    setSelectedIdx(idx);
                                    if (item.canDrillIn) {
                                        setPath(p => [...p, item.key]);
                                        setSelectedIdx(0);
                                    }
                                }}
                                className={cn(
                                    "flex items-center gap-1.5 px-2 py-[3px] rounded cursor-pointer transition-colors group text-[11px] font-mono",
                                    selectedIdx === idx
                                        ? "bg-primary/10 ring-1 ring-primary/30"
                                        : "hover:bg-muted/50",
                                )}
                            >
                                <span className="text-blue-400 flex-shrink-0">{item.key}</span>
                                <span className="text-muted-foreground/40">:</span>
                                <span className={cn(
                                    "flex-1 min-w-0 truncate",
                                    item.canDrillIn ? "text-muted-foreground" : "text-foreground/80"
                                )}>
                                    {compactValue(item.value)}
                                </span>
                                <TreeCopyButton getText={() => serializeForClipboard(valueForCopy(data, path, item.key, item.value))} />
                                {item.canDrillIn && (
                                    <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-60 flex-shrink-0 transition-opacity" />
                                )}
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    );
};

// ── Main Component ───────────────────────────────────────────────────────

const ChatLogBrowser: React.FC<ChatLogBrowserProps> = ({ logs, clearLogs, title = 'Chat Logs' }) => {
    const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [highlightedIdx, setHighlightedIdx] = useState<number>(0);
    const listRef = useRef<HTMLDivElement>(null);

    // Filtered logs
    const filtered = useMemo(() => {
        let result = logs;
        if (levelFilter !== 'all') {
            result = result.filter(l => l.level === levelFilter);
        }
        if (searchTerm.trim()) {
            const terms = searchTerm.toLowerCase().split(' ').filter(Boolean);
            result = result.filter(l =>
                terms.every(t =>
                    l.message.toLowerCase().includes(t) ||
                    l.level.includes(t) ||
                    (l.category || '').toLowerCase().includes(t)
                )
            );
        }
        return result;
    }, [logs, levelFilter, searchTerm]);

    // Counts per level
    const counts = useMemo(() => {
        const c: Record<string, number> = { all: logs.length };
        for (const l of logs) c[l.level] = (c[l.level] || 0) + 1;
        return c;
    }, [logs]);

    // Reset highlight when filter changes
    useEffect(() => {
        setHighlightedIdx(0);
    }, [levelFilter, searchTerm]);

    // Keyboard nav in list mode
    useEffect(() => {
        if (selectedIdx !== null) return;
        const el = listRef.current;
        if (!el) return;
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedIdx(i => i >= filtered.length - 1 ? 0 : i + 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedIdx(i => i <= 0 ? filtered.length - 1 : i - 1);
            } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
                e.preventDefault();
                if (filtered.length > 0) setSelectedIdx(highlightedIdx);
            } else if (e.key === 'Home') {
                e.preventDefault();
                setHighlightedIdx(0);
            } else if (e.key === 'End') {
                e.preventDefault();
                setHighlightedIdx(filtered.length - 1);
            }
        };
        el.addEventListener('keydown', handler);
        return () => el.removeEventListener('keydown', handler);
    }, [selectedIdx, filtered, highlightedIdx]);

    // Scroll highlighted into view
    useEffect(() => {
        const el = listRef.current?.querySelector(`[data-log-idx="${highlightedIdx}"]`);
        el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [highlightedIdx]);

    const handleBack = useCallback(() => {
        setSelectedIdx(null);
        requestAnimationFrame(() => listRef.current?.focus());
    }, []);

    // ── Drilled-in view (compact inline tree) ────────────────────────────

    if (selectedIdx !== null) {
        const log = filtered[selectedIdx];
        if (!log) { setSelectedIdx(null); return null; }
        const treeData = logEntryToTree(log);
        return (
            <div className="border border-border rounded-lg bg-card flex flex-col h-full">
                <CompactTreeView
                    data={treeData}
                    onExit={handleBack}
                    header={
                        <div className="flex items-center gap-1.5 px-2 py-1.5 border-b bg-muted/20 flex-shrink-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1.5 gap-1 text-xs"
                                onClick={handleBack}
                            >
                                <ArrowLeft className="h-3 w-3" />
                                Back
                            </Button>
                            <span className={cn("text-[10px] font-semibold", LEVEL_COLORS[log.level])}>
                                [{log.level.toUpperCase()}]
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate flex-1 min-w-0">
                                {previewMessage(log.message, 40)}
                            </span>
                        </div>
                    }
                />
            </div>
        );
    }

    // ── List view ────────────────────────────────────────────────────────

    const TABS: { key: LevelFilter; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'info', label: 'Info' },
        { key: 'debug', label: 'Debug' },
        { key: 'warning', label: 'Warn' },
        { key: 'error', label: 'Err' },
        { key: 'success', label: 'OK' },
    ];

    return (
        <div className="border border-border rounded-lg bg-card flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-2 px-3 border-b bg-muted/20 flex-shrink-0">
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                    <ListFilter className="h-3.5 w-3.5" />
                    {title}
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                        ({filtered.length})
                    </span>
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={clearLogs}
                    disabled={logs.length === 0}
                    title="Clear logs"
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-1.5 px-2 py-1.5 border-b bg-muted/10 flex-shrink-0">
                <Search className="h-3 w-3 text-muted-foreground" />
                <Input
                    placeholder="Filter logs..."
                    className="h-6 text-xs bg-background flex-1 border-0 shadow-none focus-visible:ring-0 px-1"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="text-muted-foreground hover:text-foreground">
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>

            {/* Level tabs */}
            <div className="flex gap-0.5 px-2 py-1 border-b bg-muted/5 flex-shrink-0 overflow-x-auto">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setLevelFilter(tab.key)}
                        className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded transition-colors whitespace-nowrap",
                            levelFilter === tab.key
                                ? "bg-primary text-primary-foreground font-semibold"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        {tab.label}
                        {(counts[tab.key] || 0) > 0 && (
                            <span className="ml-0.5 opacity-70">{counts[tab.key]}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Log list */}
            <div
                ref={listRef}
                tabIndex={0}
                className="flex-1 overflow-y-auto outline-none focus:ring-1 focus:ring-primary/20 focus:ring-inset"
            >
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs py-8 opacity-60">
                        <ListFilter className="h-6 w-6 mb-2 stroke-1" />
                        <p>No logs{searchTerm ? ' matching filter' : ''}</p>
                    </div>
                ) : (
                    <div className="p-1">
                        {filtered.map((log, idx) => (
                            <div
                                key={log.id}
                                data-log-idx={idx}
                                onClick={() => { setHighlightedIdx(idx); setSelectedIdx(idx); }}
                                className={cn(
                                    "flex items-start gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors group text-[11px] font-mono",
                                    highlightedIdx === idx
                                        ? "bg-primary/10 ring-1 ring-primary/30"
                                        : "hover:bg-muted/50",
                                )}
                            >
                                {/* Time */}
                                <span className="text-muted-foreground/70 flex-shrink-0 tabular-nums">
                                    {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                                {/* Level badge */}
                                <span className={cn(
                                    "flex-shrink-0 px-1 rounded text-[10px] font-semibold border",
                                    LEVEL_BG[log.level] || '',
                                    LEVEL_COLORS[log.level] || 'text-muted-foreground'
                                )}>
                                    {log.level.slice(0, 3).toUpperCase()}
                                </span>
                                {/* Message preview */}
                                <span className="flex-1 min-w-0 truncate text-foreground/90">
                                    {previewMessage(log.message)}
                                </span>
                                {/* Drill-in hint */}
                                <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-60 flex-shrink-0 mt-0.5 transition-opacity" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatLogBrowser;
