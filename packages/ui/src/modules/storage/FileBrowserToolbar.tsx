import React, { useState } from 'react';
import {
    ArrowUp, List, LayoutGrid, ChevronRight, ChevronDown,
    Download, ExternalLink, ZoomIn, ZoomOut, HardDrive, Home,
    Type, FileType, Clock, ArrowUpDown, ArrowLeftRight, Share2, Copy, Check, Filter, Eye, Network, Search, X, MoreVertical
} from 'lucide-react';
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import {
    Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { INode, SortKey } from './types';
import { TB_BTN, TB_SEP } from './types';
import { T, translate } from '@/i18n';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRef, useEffect } from 'react';

// ── Props ────────────────────────────────────────────────────────

interface FileBrowserToolbarProps {
    canGoUp: boolean;
    goUp: () => void;
    canChangeMount: boolean;
    availableMounts: string[];
    mount: string;
    updateMount: (m: string) => void;
    mountProp: string;
    pathProp: string;
    updatePath: (p: string) => void;
    breadcrumbs: { label: string; path: string }[];
    selectedFile: INode | null;
    selectedNode: INode | null;
    selectedNodes: INode[];
    handleView: () => void;
    handleDownload: () => void;
    allowDownload: boolean;
    allowCopy?: boolean;
    onCopy?: () => void;
    handleDownloadDir?: () => void;
    allowDownloadDir?: boolean;
    sortBy: SortKey;
    sortAsc: boolean;
    cycleSort: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
    viewMode: 'list' | 'thumbs' | 'tree';
    setViewMode: (v: 'list' | 'thumbs' | 'tree') => void;
    displayMode: 'simple' | 'advanced';
    setDisplayMode?: (m: 'simple' | 'advanced') => void;
    onFilterOpen?: () => void;
    showExplorer?: boolean;
    onToggleExplorer?: () => void;
    showPreview?: boolean;
    onTogglePreview?: () => void;
    allowPanels?: boolean;
    onSearchOpen?: () => void;
    fontSize: number;
    isSearchMode?: boolean;
    onClearSearch?: () => void;
    splitDirection?: 'horizontal' | 'vertical';
    setSplitDirection?: (dir: 'horizontal' | 'vertical') => void;
}

// ── Sort icons ───────────────────────────────────────────────────

const sortIcons: Record<SortKey, React.ReactNode> = {
    name: <Type size={16} />,
    ext: <FileType size={16} />,
    date: <Clock size={16} />,
    type: <ArrowUpDown size={16} />,
};

// ── Component ────────────────────────────────────────────────────

const FileBrowserToolbar: React.FC<FileBrowserToolbarProps> = ({
    canGoUp, goUp,
    canChangeMount, availableMounts, mount, updateMount,
    mountProp, pathProp, updatePath,
    breadcrumbs,
    selectedFile, selectedNode, selectedNodes, handleView, handleDownload, allowDownload, allowCopy = false, onCopy,
    handleDownloadDir, allowDownloadDir,
    sortBy, sortAsc, cycleSort,
    zoomIn, zoomOut,
    viewMode, setViewMode, displayMode, setDisplayMode,
    onFilterOpen, showExplorer = true, onToggleExplorer, showPreview = true, onTogglePreview, allowPanels = false, onSearchOpen, fontSize,
    isSearchMode, onClearSearch, splitDirection, setSplitDirection
}) => {
    const [copied, setCopied] = useState(false);
    const [shareShowExplorer, setShareShowExplorer] = useState(showExplorer);
    const [shareShowToolbar, setShareShowToolbar] = useState(true);
    const [shareShowPanels, setShareShowPanels] = useState(allowPanels);
    const [shareMode, setShareMode] = useState(displayMode);
    const isMobile = useIsMobile();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isNarrow, setIsNarrow] = useState(false);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                const width = entry.contentRect.width;
                setIsNarrow(width < 500); // Tweak threshold as needed
            }
        });

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Sync share toggles when dialog opens
    const handleDialogOpen = (open: boolean) => {
        if (open) {
            setShareShowExplorer(showExplorer);
            setShareShowPanels(allowPanels);
            setShareMode(displayMode);
            setShareShowToolbar(true);
        } else {
            setCopied(false);
        }
    };

    const handleShareCopy = () => {
        navigator.clipboard.writeText(getShareUrl());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getShareUrl = () => {
        const cleanPath = pathProp.replace(/^\/+/, '');
        const urlPath = cleanPath ? `/app/filebrowser/${mountProp}/${cleanPath}` : `/app/filebrowser/${mountProp}`;
        const searchParams = new URLSearchParams();
        if (selectedFile) searchParams.set('file', selectedFile.name);
        if (viewMode) searchParams.set('view', viewMode);
        if (shareMode) searchParams.set('mode', shareMode);
        if (!shareShowExplorer) searchParams.set('showExplorer', '0');
        if (!shareShowToolbar) searchParams.set('toolbar', '0');
        if (shareShowPanels) searchParams.set('panels', '1');

        return `${window.location.origin}${urlPath}${searchParams.toString() ? ('?' + searchParams.toString()) : ''}`;
    };

    return (
        <div ref={containerRef} style={{
            display: 'flex', alignItems: 'center', gap: 2, padding: '4px 6px',
            borderBottom: '1px solid var(--border, #334155)',
            background: 'var(--muted, #1e293b)',
        }}>
            {/* Navigation */}
            <button onClick={goUp} disabled={!canGoUp} title="Go up (Backspace)" className="fb-tb-btn"
                style={{ ...TB_BTN, opacity: canGoUp ? 1 : 0.3, cursor: canGoUp ? 'pointer' : 'default' }}>
                <ArrowUp size={18} />
            </button>

            {/* Mount picker */}
            {canChangeMount && availableMounts.length > 1 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            id="fb-mount-trigger"
                            className="fb-tb-btn"
                            title={translate("Switch mount")}
                            style={{ ...TB_BTN, gap: 4, fontSize: fontSize, fontWeight: 600 }}
                        >
                            <HardDrive size={14} />
                            <span>{mount}</span>
                            <ChevronDown size={10} style={{ opacity: 0.5 }} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[140px]">
                        {availableMounts.map(m => (
                            <DropdownMenuItem
                                key={m}
                                onClick={() => {
                                    updateMount(m);
                                    // Radix manages focus, so we defer stealing it back to the panel
                                    setTimeout(() => document.querySelector<HTMLElement>('.fb-panel-container')?.focus(), 50);
                                }}
                                className={m === mount ? 'font-semibold bg-accent' : ''}
                            >
                                <HardDrive className="h-3 w-3 mr-2 opacity-60" />
                                {m}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            <div style={TB_SEP} />

            {/* Breadcrumbs */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden', padding: '0 4px' }}>
                <button onClick={() => { updateMount(mountProp); updatePath(pathProp); }} title="Home" className="fb-tb-btn"
                    style={{ ...TB_BTN, flexShrink: 0 }}>
                    <Home size={14} />
                </button>
                <ChevronRight size={10} style={{ opacity: 0.3, flexShrink: 0 }} />
                {breadcrumbs.map((c, i) => (
                    <React.Fragment key={c.path}>
                        {i > 0 && <ChevronRight size={10} style={{ opacity: 0.3, flexShrink: 0 }} />}
                        <button onClick={() => updatePath(c.path)} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: i === breadcrumbs.length - 1 ? 'var(--foreground, #e2e8f0)' : 'var(--muted-foreground, #94a3b8)',
                            fontWeight: i === breadcrumbs.length - 1 ? 600 : 400,
                            padding: '2px 3px', borderRadius: 3, whiteSpace: 'nowrap', fontSize: fontSize,
                        }}>
                            {c.label}
                        </button>
                    </React.Fragment>
                ))}
            </div>

            <div style={TB_SEP} />

            {/* File/Folder context actions */}
            {selectedNodes.length > 0 && (<>
                {selectedNodes.length === 1 && selectedFile && (
                    <button onClick={handleView} title="View in browser" className="fb-tb-btn" style={TB_BTN}>
                        <Eye size={18} />
                    </button>
                )}
                {allowDownload && (
                    <button onClick={handleDownload} title={`Download ${selectedNodes.length > 1 ? selectedNodes.length + ' Items' : 'Selection'}`} className="fb-tb-btn" style={TB_BTN}>
                        <Download size={18} />
                    </button>
                )}
                {allowCopy && onCopy && (
                    <button onClick={onCopy} title={translate('Copy (F5)')} className="fb-tb-btn" style={TB_BTN}>
                        <Copy size={18} />
                    </button>
                )}
                <div style={TB_SEP} />
            </>)}

            <button onClick={() => window.open(getShareUrl(), '_blank')} title="Open in new tab" className="fb-tb-btn" style={TB_BTN}>
                <ExternalLink size={18} />
            </button>
            <Dialog onOpenChange={handleDialogOpen}>
                <DialogTrigger asChild>
                    <button title={translate("Share Link")} className="fb-tb-btn" style={TB_BTN}>
                        <Share2 size={18} />
                    </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle><T>Share Link</T></DialogTitle>
                        <DialogDescription>
                            <T>Anyone with this link will be able to view this directory, current state, and the selected files.</T>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2">
                        <div className="grid flex-1 gap-2">
                            <Input
                                readOnly
                                value={getShareUrl()}
                                className="bg-muted focus-visible:ring-0 focus-visible:ring-offset-0"
                                onFocus={(e) => e.target.select()}
                            />
                        </div>
                        <Button type="button" size="sm" className="px-3" onClick={handleShareCopy}>
                            {copied ? (
                                <>
                                    <Check className="h-4 w-4 mr-2 text-green-500" />
                                    <T>Copied</T>
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4 mr-2" />
                                    <T>Copy</T>
                                </>
                            )}
                        </Button>
                    </div>
                    <div className="flex flex-col gap-3 mt-4">
                        <label className="flex items-center justify-between text-sm">
                            <span><T>Show Explorer Pane</T></span>
                            <Switch checked={shareShowExplorer} onCheckedChange={setShareShowExplorer} />
                        </label>
                        <label className="flex items-center justify-between text-sm">
                            <span><T>Show Toolbar</T></span>
                            <Switch checked={shareShowToolbar} onCheckedChange={setShareShowToolbar} />
                        </label>
                        <label className="flex items-center justify-between text-sm">
                            <span><T>Krusader Mode (Dual Panels)</T></span>
                            <Switch checked={shareShowPanels} onCheckedChange={setShareShowPanels} />
                        </label>
                    </div>
                </DialogContent>
            </Dialog>

            <div style={TB_SEP} />

            {isMobile || isNarrow ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button title={translate("Actions")} className="fb-tb-btn" style={TB_BTN}>
                            <MoreVertical size={18} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[200px]">
                        {/* Search */}
                        {onSearchOpen && (
                            <DropdownMenuItem onClick={onSearchOpen} className={isSearchMode ? 'text-blue-500 focus:text-blue-500 font-medium' : ''}>
                                <Search className="h-4 w-4 mr-2 opacity-60" />
                                <T>{isSearchMode ? "Edit Search" : "Search"}</T>
                            </DropdownMenuItem>
                        )}
                        {/* Clear Search */}
                        {isSearchMode && onClearSearch && (
                            <DropdownMenuItem onClick={onClearSearch} className="text-red-500 focus:text-red-500 focus:bg-red-500/10">
                                <X className="h-4 w-4 mr-2" />
                                <T>Clear Search</T>
                            </DropdownMenuItem>
                        )}
                        {/* Filter */}
                        {onFilterOpen && (
                            <DropdownMenuItem onClick={onFilterOpen}>
                                <Filter className="h-4 w-4 mr-2 opacity-60" />
                                <T>Filter</T>
                            </DropdownMenuItem>
                        )}
                        {allowCopy && onCopy && selectedNodes.length > 0 && (
                            <DropdownMenuItem onClick={onCopy}>
                                <Copy className="h-4 w-4 mr-2 opacity-60" />
                                <T>Copy</T>
                            </DropdownMenuItem>
                        )}
                        {/* Sort */}
                        <DropdownMenuItem onClick={cycleSort}>
                            {sortIcons[sortBy]}
                            <span className="ml-2"><T>Sort</T>: <T>{sortBy}</T> ({sortAsc ? 'asc' : 'desc'})</span>
                        </DropdownMenuItem>
                        {/* Zoom */}
                        <DropdownMenuItem onClick={zoomIn}>
                            <ZoomIn className="h-4 w-4 mr-2 opacity-60" />
                            <T>Zoom In</T>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={zoomOut}>
                            <ZoomOut className="h-4 w-4 mr-2 opacity-60" />
                            <T>Zoom Out</T>
                        </DropdownMenuItem>
                        {/* View mode */}
                        <DropdownMenuItem
                            onClick={() => { setViewMode('list'); setDisplayMode?.('simple'); }}
                            className={viewMode === 'list' && displayMode === 'simple' ? 'font-semibold bg-accent' : ''}
                        >
                            <List className="h-4 w-4 mr-2 opacity-60" />
                            <T>Simple List</T>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => { setViewMode('list'); setDisplayMode?.('advanced'); }}
                            className={viewMode === 'list' && displayMode === 'advanced' ? 'font-semibold bg-accent' : ''}
                        >
                            <List className="h-4 w-4 mr-2 opacity-60" />
                            <T>Detailed List</T>
                        </DropdownMenuItem>
                        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                        {onTogglePreview && (
                            <DropdownMenuItem onClick={onTogglePreview}>
                                {showPreview ? <Check className="h-4 w-4 mr-2" /> : <div className="h-4 w-4 mr-2" />}
                                <T>Show Preview</T>
                            </DropdownMenuItem>
                        )}
                        {onToggleExplorer && (
                            <DropdownMenuItem onClick={onToggleExplorer}>
                                {showExplorer ? <Check className="h-4 w-4 mr-2" /> : <div className="h-4 w-4 mr-2" />}
                                <T>Show Explorer</T>
                            </DropdownMenuItem>
                        )}
                        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                        <DropdownMenuItem
                            onClick={() => { setViewMode('thumbs'); setDisplayMode?.('simple'); }}
                            className={viewMode === 'thumbs' ? 'font-semibold bg-accent' : ''}
                        >
                            <LayoutGrid className="h-4 w-4 mr-2 opacity-60" />
                            <T>Thumbnails</T>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => { setViewMode('tree'); setDisplayMode?.('simple'); }}
                            className={viewMode === 'tree' ? 'font-semibold bg-accent' : ''}
                        >
                            <Network className="h-4 w-4 mr-2 opacity-60" />
                            <T>Tree View</T>
                        </DropdownMenuItem>
                        {setSplitDirection && splitDirection && (
                            <>
                                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                                <DropdownMenuItem onClick={() => setSplitDirection(splitDirection === 'horizontal' ? 'vertical' : 'horizontal')}>
                                    {splitDirection === 'horizontal' ? <ArrowUpDown className="h-4 w-4 mr-2 opacity-60" /> : <ArrowLeftRight className="h-4 w-4 mr-2 opacity-60" />}
                                    <T>{splitDirection === 'horizontal' ? 'Split Top/Bottom' : 'Split Side-by-Side'}</T>
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <>
                    {/* Search */}
                    {onSearchOpen && (
                        <button onClick={onSearchOpen} title={translate("Search Files (Ctrl+F / F3)")} className="fb-tb-btn" style={{ ...TB_BTN, background: isSearchMode ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: isSearchMode ? '#3b82f6' : 'inherit' }}>
                            <Search size={18} />
                        </button>
                    )}
                    {isSearchMode && onClearSearch && (
                        <button onClick={onClearSearch} title={translate("Clear Search")} className="fb-tb-btn" style={{ ...TB_BTN, color: '#ef4444' }}>
                            <X size={18} />
                        </button>
                    )}

                    {/* Filter */}
                    {onFilterOpen && (
                        <button onClick={onFilterOpen} title={translate("Filter Files (Shift + +)")} className="fb-tb-btn" style={TB_BTN}>
                            <Filter size={18} />
                        </button>
                    )}

                    {/* Sort */}
                    <button onClick={cycleSort} title={translate(`Sort: ${sortBy} (${sortAsc ? 'asc' : 'desc'})`)} className="fb-tb-btn"
                        style={{ ...TB_BTN, gap: 2 }}>
                        {sortIcons[sortBy]}
                        <span style={{ fontSize: 9, opacity: 0.6 }}>{sortAsc ? '↑' : '↓'}</span>
                    </button>

                    {/* Zoom */}
                    <button onClick={zoomOut} title={translate("Zoom out")} className="fb-tb-btn" style={TB_BTN}>
                        <ZoomOut size={18} />
                    </button>
                    <button onClick={zoomIn} title={translate("Zoom in")} className="fb-tb-btn" style={TB_BTN}>
                        <ZoomIn size={18} />
                    </button>

                    {/* View mode */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button title={translate("View Options")} className="fb-tb-btn" style={{ ...TB_BTN, gap: 4 }}>
                                {viewMode === 'list' ? <List size={18} /> : viewMode === 'tree' ? <Network size={18} /> : <LayoutGrid size={18} />}
                                <ChevronDown size={10} style={{ opacity: 0.5 }} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[160px]">
                            <DropdownMenuItem
                                onClick={() => { setViewMode('list'); setDisplayMode?.('simple'); }}
                                className={viewMode === 'list' && displayMode === 'simple' ? 'font-semibold bg-accent' : ''}
                            >
                                <List className="h-4 w-4 mr-2 opacity-60" />
                                <T>Simple List</T>
                                <span className="ml-auto text-xs text-muted-foreground tracking-widest opacity-60">Alt+2</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => { setViewMode('list'); setDisplayMode?.('advanced'); }}
                                className={viewMode === 'list' && displayMode === 'advanced' ? 'font-semibold bg-accent' : ''}
                            >
                                <List className="h-4 w-4 mr-2 opacity-60" />
                                <T>Detailed List</T>
                                <span className="ml-auto text-xs text-muted-foreground tracking-widest opacity-60">Alt+3</span>
                            </DropdownMenuItem>
                            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                            {onTogglePreview && (
                                <DropdownMenuItem onClick={onTogglePreview}>
                                    {showPreview ? <Check className="h-4 w-4 mr-2" /> : <div className="h-4 w-4 mr-2" />}
                                    <T>Show Preview</T>
                                </DropdownMenuItem>
                            )}
                            {onToggleExplorer && (
                                <DropdownMenuItem onClick={onToggleExplorer}>
                                    {showExplorer ? <Check className="h-4 w-4 mr-2" /> : <div className="h-4 w-4 mr-2" />}
                                    <T>Show Explorer</T>
                                </DropdownMenuItem>
                            )}
                            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                            <DropdownMenuItem
                                onClick={() => { setViewMode('thumbs'); setDisplayMode?.('simple'); }}
                                className={viewMode === 'thumbs' ? 'font-semibold bg-accent' : ''}
                            >
                                <LayoutGrid className="h-4 w-4 mr-2 opacity-60" />
                                <T>Thumbnails</T>
                                <span className="ml-auto text-xs text-muted-foreground tracking-widest opacity-60">Alt+5</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => { setViewMode('tree'); setDisplayMode?.('simple'); }}
                                className={viewMode === 'tree' ? 'font-semibold bg-accent' : ''}
                            >
                                <Network className="h-4 w-4 mr-2 opacity-60" />
                                <T>Tree View</T>
                            </DropdownMenuItem>
                            {setSplitDirection && splitDirection && (
                                <>
                                    <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                                    <DropdownMenuItem onClick={() => setSplitDirection(splitDirection === 'horizontal' ? 'vertical' : 'horizontal')}>
                                        {splitDirection === 'horizontal' ? <ArrowUpDown className="h-4 w-4 mr-2 opacity-60" /> : <ArrowLeftRight className="h-4 w-4 mr-2 opacity-60" />}
                                        <T>{splitDirection === 'horizontal' ? 'Split Top/Bottom' : 'Split Side-by-Side'}</T>
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            )}
        </div>
    );
};

export default FileBrowserToolbar;
