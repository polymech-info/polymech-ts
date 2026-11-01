import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Loader2, X, ArrowRight, ExternalLink, LayoutList, CheckSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { INode } from '@/modules/storage/types';
import { getMimeCategory, vfsUrl } from '@/modules/storage/helpers';
import { NodeIcon } from '@/modules/storage/ThumbPreview';
import { T, translate } from '@/i18n';
import { useFileBrowser } from './FileBrowserContext';

// ── Props ────────────────────────────────────────────────────────

interface SearchDialogProps {
    mount: string;
    currentPath: string;
    accessToken?: string;
    onNavigate: (node: INode) => void;
    onClose: () => void;
}

// ── Component ────────────────────────────────────────────────────

const SearchDialog: React.FC<SearchDialogProps> = ({
    mount, currentPath, accessToken, onNavigate, onClose,
}) => {
    const { activeSide, activePanelIdx, activePanel, updatePanel } = useFileBrowser();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<INode[]>([]);
    const [loading, setLoading] = useState(false);
    const [truncated, setTruncated] = useState(false);
    const [focusIdx, setFocusIdx] = useState(0);
    const [searched, setSearched] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<any>(null);

    // Auto-focus input on mount
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 50);
    }, []);

    // Debounced search
    const doSearch = useCallback(async (q: string) => {
        if (q.trim().length < 2) {
            setResults([]);
            setSearched(false);
            return;
        }

        setLoading(true);
        setSearched(true);
        try {
            const headers: Record<string, string> = {};
            if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
            const cleanPath = currentPath.replace(/^\/+/, '');
            const ftsParam = activePanel.searchFullText ? '&fts=1' : '';
            const url = cleanPath
                ? `${vfsUrl('search', mount, cleanPath)}?q=${encodeURIComponent(q.trim())}&maxResults=200${ftsParam}`
                : `${vfsUrl('search', mount)}?q=${encodeURIComponent(q.trim())}&maxResults=200${ftsParam}`;
            const res = await fetch(url, { headers });
            if (res.ok) {
                const data = await res.json();
                setResults(data.results || []);
                setTruncated(data.truncated || false);
                setFocusIdx(0);
            } else {
                setResults([]);
            }
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [mount, currentPath, accessToken]);

    const handleInput = useCallback((val: string) => {
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(val), 300);
    }, [doSearch]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusIdx(prev => Math.min(prev + 1, results.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusIdx(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (results[focusIdx]) {
                    const node = results[focusIdx];
                    onNavigate(node);
                    onClose();
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
        }
    }, [results, focusIdx, onNavigate, onClose]);

    // Scroll focused item into view
    useEffect(() => {
        const el = listRef.current?.querySelector(`[data-search-idx="${focusIdx}"]`);
        if (el) el.scrollIntoView({ block: 'nearest' });
    }, [focusIdx]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full max-w-lg bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
                onKeyDown={handleKeyDown}
            >
                {/* Search input */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                    <Search size={18} className="text-muted-foreground shrink-0" />
                    <Input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => handleInput(e.target.value)}
                        placeholder={translate("Search files and folders...")}
                        className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                        autoComplete="off"
                        spellCheck={false}
                    />
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            updatePanel(activeSide, activePanelIdx, { searchFullText: !activePanel.searchFullText });
                        }}
                        className={`shrink-0 flex items-center gap-1.5 px-2 py-1 rounded text-xs select-none transition-colors border ${activePanel.searchFullText ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:text-foreground'}`}
                        title={translate("Toggle Full Text Search")}
                    >
                        <CheckSquare size={14} className={activePanel.searchFullText ? 'opacity-100' : 'opacity-50'} />
                        <span className="hidden sm:inline">FTS</span>
                    </button>
                    {loading && <Loader2 size={16} className="animate-spin text-muted-foreground shrink-0" />}
                    {query.trim().length > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                updatePanel(activeSide, activePanelIdx, { searchQuery: query });
                                onClose();
                            }}
                            className="text-muted-foreground hover:text-foreground shrink-0 border border-border bg-muted/50 rounded p-1 ml-1"
                            title={translate("Open search in panel")}
                        >
                            <LayoutList size={14} />
                        </button>
                    )}
                    {query.trim().length > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const cleanRoute = currentPath.startsWith('/') ? currentPath : `/${currentPath}`;
                                const url = `/app/filebrowser/${mount}${cleanRoute}?search=${encodeURIComponent(query)}`;
                                window.open(url, '_blank');
                                onClose();
                            }}
                            className="text-muted-foreground hover:text-foreground shrink-0 border border-border bg-muted/50 rounded p-1 ml-1"
                            title={translate("Open search in new tab")}
                        >
                            <ExternalLink size={14} />
                        </button>
                    )}
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0 ml-1">
                        <X size={16} />
                    </button>
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-[50vh] overflow-y-auto">
                    {results.length === 0 && searched && !loading && (
                        <div className="p-6 text-center text-muted-foreground text-sm">
                            <T>No results found</T>
                        </div>
                    )}
                    {results.length === 0 && !searched && (
                        <div className="p-6 text-center text-muted-foreground text-sm">
                            <T>Type at least 2 characters to search</T>
                        </div>
                    )}
                    {results.map((node, i) => {
                        const isDir = getMimeCategory(node) === 'dir';
                        const isFocused = focusIdx === i;
                        return (
                            <div
                                key={`${node.path}-${i}`}
                                data-search-idx={i}
                                className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${isFocused ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                                    }`}
                                onClick={() => {
                                    onNavigate(node);
                                    onClose();
                                }}
                                onMouseEnter={() => setFocusIdx(i)}
                            >
                                <NodeIcon node={node} />
                                <div className="flex-1 min-w-0">
                                    <div className="truncate text-sm font-medium">{node.name}</div>
                                    <div className="truncate text-xs text-muted-foreground">
                                        {node.parent || '/'}
                                    </div>
                                </div>
                                <ArrowRight size={14} className="opacity-30 shrink-0" />
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                {results.length > 0 && (
                    <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex justify-between">
                        <span>{results.length} <T>{results.length !== 1 ? 'results' : 'result'}</T>{truncated ? <T> (truncated)</T> : ''}</span>
                        <span className="opacity-60"><T>↑↓ navigate · Enter open · Esc close</T></span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchDialog;
