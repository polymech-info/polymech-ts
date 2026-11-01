import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWizardContext } from '@/hooks/useWizardContext';
import ImageLightbox from '@/components/ImageLightbox';
import LightboxText from '@/modules/storage/views/LightboxText';
import LightboxIframe from '@/modules/storage/views/LightboxIframe';
import { renderFileViewer } from '@/modules/storage/FileViewerRegistry';
import { useDragDrop } from '@/contexts/DragDropContext';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

import type { INode, SortKey } from '@/modules/storage/types';
import { getMimeCategory, vfsUrl, formatSize } from '@/modules/storage/helpers';
import { serverUrl } from '@/lib/db';
import FileBrowserToolbar from '@/modules/storage/FileBrowserToolbar';
import FileListView from '@/modules/storage/FileListView';
import FileGridView from '@/modules/storage/FileGridView';
import FileDetailPanel from '@/modules/storage/FileDetailPanel';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IMAGE_EXTS, VIDEO_EXTS, CODE_EXTS } from '@/modules/storage/helpers';
import { T, translate } from '@/i18n';
import { useOptionalStream } from '@/contexts/StreamContext';
import type { AppEvent } from '@/types-server';
import { FilePickerDialog, type FilePickerResult } from './FilePicker';
import { useCopyTransfer } from './hooks/useCopyTransfer';
import CopyTransferOptions from './CopyTransferOptions';
import CopyConflictDialog from './CopyConflictDialog';
import CopyProgressDialog from './CopyProgressDialog';

import { fetchVfsMounts } from '@/modules/storage/client-vfs';
import { mergeVfsPluginContributions, type FileBrowserPluginContext } from '@/modules/storage/plugins';
import { useVfsAdapter } from '@/modules/storage/hooks/useVfsAdapter';
import { useSelection } from '@/modules/storage/hooks/useSelection';
import { useFilePreview } from '@/modules/storage/hooks/useFilePreview';
import { useDefaultKeyboardHandler } from '@/modules/storage/hooks/useDefaultKeyboardHandler';
import { useDefaultSelectionHandler } from '@/modules/storage/hooks/useDefaultSelectionHandler';
import { useDefaultActions } from '@/modules/storage/hooks/useDefaultActions';
import { FileTree } from './FileTree';
import SearchDialog from './SearchDialog';
import { useActionStore } from '@/actions/store';
import { useOptionalFileBrowser, type Side } from '@/modules/storage/FileBrowserContext';
import { VFS_ACTION_PREFIX, vfsPanelActionStoreSignature } from '@/modules/storage/file-browser-commands';
import { useRegisterVfsPanelActions, type VfsPanelActionSpec } from '@/modules/storage/useRegisterVfsPanelActions';
import { useAppStore } from '@/store/appStore';

// ── Props ────────────────────────────────────────────────────────

export interface FileBrowserPanelProps {
    mount?: string;
    path?: string;
    glob?: string;
    mode?: 'simple' | 'advanced';
    viewMode?: 'list' | 'thumbs' | 'tree';
    sortBy?: SortKey;
    showToolbar?: boolean;
    canChangeMount?: boolean;
    allowFileViewer?: boolean;
    allowLightbox?: boolean;
    allowPreview?: boolean;
    allowDownload?: boolean;
    jail?: boolean;
    onPathChange?: (path: string) => void;
    onMountChange?: (mount: string) => void;
    /** If set, auto-open this file in lightbox after directory loads */
    initialFile?: string;
    /** If true, automatically loads and renders a readme.md (case-insensitive) in the current directory */
    index?: boolean;
    /** If true, allows the fallback FileBrowserPanel to render when no readme is found. */
    allowFallback?: boolean;
    /** ID for saving user preferences like viewMode locally (e.g. 'pm-filebrowser-left-panel') */
    autoSaveId?: string;
    showFolders?: boolean;
    showExplorer?: boolean;
    showPreview?: boolean;
    showTree?: boolean;
    onToggleExplorer?: () => void;
    onTogglePreview?: () => void;
    onFilterChange?: (glob: string, showFolders: boolean) => void;
    onSelect?: (nodes: INode[] | INode | null) => void;
    searchQuery?: string;
    onSearchQueryChange?: (q: string) => void;
    autoFocus?: boolean;
    includeSize?: boolean;
    splitSizeHorizontal?: number[];
    splitSizeVertical?: number[];
    onLayoutChange?: (sizes: number[], direction: 'horizontal' | 'vertical') => void;
    showStatusBar?: boolean;
    allowCopyAction?: boolean;
    /** Stable id for Zustand ribbon actions (`vfs/panel/<panelId>/…`). */
    panelId?: string;
    /** Which Krusader-style pane this instance is (left/right); used for “New tab” / panel actions. */
    browserSide?: Side;
}

// ── Main Component ───────────────────────────────────────────────

const FileBrowserPanel: React.FC<FileBrowserPanelProps> = ({
    mount: mountProp = 'machines',
    path: pathProp = '/',
    glob = '*.*',
    mode = 'simple',
    viewMode: initialViewMode = 'list',
    sortBy: initialSort = 'name',
    showToolbar = true,
    canChangeMount = false,
    allowFileViewer = true,
    allowLightbox = true,
    allowPreview = true,
    allowDownload = true,
    jail = false,
    initialFile,
    allowFallback = true,
    autoFocus = true,
    includeSize = false,
    index = true,
    autoSaveId,
    showFolders: showFoldersProp,
    showExplorer = true,
    showPreview = true,
    showTree = true,
    onToggleExplorer,
    onTogglePreview,
    onPathChange,
    onMountChange,
    onSelect,
    onFilterChange,
    searchQuery,
    onSearchQueryChange,
    splitSizeHorizontal,
    splitSizeVertical,
    onLayoutChange,
    showStatusBar = true,
    allowCopyAction = true,
    panelId,
    browserSide,
}) => {

    const { session } = useAuth();
    const { setWizardImage } = useWizardContext();
    const fileBrowserCtx = useOptionalFileBrowser();
    const accessToken = session?.access_token;

    const [readmeContent, setReadmeContent] = useState<string | null>(null);
    const [selectedReadmeContent, setSelectedReadmeContent] = useState<string | null>(null);

    // ── Controlled / uncontrolled mode ────────────────────────────

    const [internalMount, setInternalMount] = useState(mountProp);
    const mount = onMountChange ? mountProp : internalMount;

    const [internalGlob, setInternalGlob] = useState(glob);
    const [internalShowFolders, setInternalShowFolders] = useState(true);
    const actualCurrentGlob = onFilterChange ? glob : internalGlob;
    const showFolders = onFilterChange ? (showFoldersProp ?? true) : internalShowFolders;

    const updateFilter = useCallback((newGlob: string, newShowFolders: boolean) => {
        if (onFilterChange) onFilterChange(newGlob, newShowFolders);
        else {
            setInternalGlob(newGlob);
            setInternalShowFolders(newShowFolders);
        }
    }, [onFilterChange]);

    // ── Drag & Drop Uploads ───────────────────────────────────────

    type UploadingNode = INode & { _uploading: boolean; _progress: number; _error?: string; _file?: File };
    const { setLocalZoneActive, resetDragState } = useDragDrop();
    const [uploads, setUploads] = useState<UploadingNode[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragEnter = (e: React.DragEvent) => {
        if (!e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
        e.stopPropagation();
        setLocalZoneActive(true);
        setIsDragOver(true);
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (!e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
        e.stopPropagation();
        if (!isDragOver) setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        if (e.clientX <= rect.left || e.clientX >= rect.right || e.clientY <= rect.top || e.clientY >= rect.bottom) {
            setIsDragOver(false);
            setLocalZoneActive(false);
        }
    };

    // ── Available mounts ─────────────────────────────────────────

    const [availableMounts, setAvailableMounts] = useState<string[]>([]);
    useEffect(() => {
        void fetchVfsMounts({ accessToken }).then(setAvailableMounts);
    }, [accessToken]);

    // ── VFS Adapter ───────────────────────────────────────────────

    const {
        nodes,
        sorted,
        loading,
        error,
        currentPath,
        currentGlob,
        updatePath,
        updateMount,
        fetchDir,
        canGoUp,
        goUp: rawGoUp,
        breadcrumbs,
        jailRoot,
        isSearchMode
    } = useVfsAdapter({
        mount,
        pathProp,
        glob: actualCurrentGlob,
        showFolders,
        accessToken,
        index,
        jail,
        jailPath: pathProp,
        sortBy: initialSort,
        sortAsc: true,
        includeSize,
        searchQuery,
        onPathChange,
        onMountChange: (m) => {
            setInternalMount(m);
            if (onMountChange) onMountChange(m);
        },
        onFetched: async (fetchedNodes, isSearch) => {
            setReadmeContent(null);
            if (index && !isSearch) {
                const readmeNode = fetchedNodes.find(n => n.name.toLowerCase() === 'readme.md');
                if (readmeNode) {
                    const tokenParam = accessToken ? `token=${encodeURIComponent(accessToken)}` : '';
                    const base = vfsUrl('get', mount, readmeNode.path);
                    const fileUrl = tokenParam ? `${base}?${tokenParam}` : base;
                    const fileRes = await fetch(fileUrl, { cache: 'no-cache' });
                    if (fileRes.ok) {
                        const content = await fileRes.text();
                        setReadmeContent(content);
                    }
                }
            }
        }
    });

    const stream = useOptionalStream();
    const refreshTimerRef = useRef<number | null>(null);
    const scheduleScopedRefresh = useCallback(() => {
        if (refreshTimerRef.current) {
            window.clearTimeout(refreshTimerRef.current);
        }
        refreshTimerRef.current = window.setTimeout(() => {
            fetchDir(currentPath || '/');
            refreshTimerRef.current = null;
        }, 250);
    }, [currentPath, fetchDir]);

    useEffect(() => {
        if (!stream) return;
        const normalize = (p?: string) => (p || '').replace(/^\/+|\/+$/g, '');
        const unsubscribe = stream.subscribe((event: AppEvent) => {
            if (event.kind !== 'system') return;
            if (event.type !== 'vfs-copy' && event.type !== 'vfs-index') return;

            if (event.type === 'vfs-index') {
                const evMount = String(event.data?.mount || '');
                const evTarget = normalize(String(event.data?.targetPath || ''));
                const here = normalize(currentPath);
                if (evMount === mount && (evTarget === '' || here === evTarget || here.startsWith(`${evTarget}/`) || evTarget.startsWith(`${here}/`))) {
                    scheduleScopedRefresh();
                }
                return;
            }

            // vfs-copy
            const srcMount = String(event.data?.sourceMount || '');
            const dstMount = String(event.data?.destinationMount || '');
            const srcPath = normalize(String(event.data?.sourcePath || ''));
            const dstPath = normalize(String(event.data?.destinationPath || ''));
            const here = normalize(currentPath);
            const mountMatches = mount === srcMount || mount === dstMount;
            const pathMatches = here === '' || here === srcPath || here === dstPath || srcPath.startsWith(`${here}/`) || dstPath.startsWith(`${here}/`);
            if (mountMatches && pathMatches) {
                scheduleScopedRefresh();
            }
        });
        return () => {
            if (refreshTimerRef.current) {
                window.clearTimeout(refreshTimerRef.current);
                refreshTimerRef.current = null;
            }
            unsubscribe();
        };
    }, [stream, mount, currentPath, scheduleScopedRefresh]);

    // ── View Mode & Zoom ─────────────────────────────────────────

    const displayNodes = useMemo(() => [...sorted, ...(uploads as INode[])], [sorted, uploads]);

    const handleDrop = async (e: React.DragEvent) => {
        if (!e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        setLocalZoneActive(false);
        resetDragState();

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        const newUploads = files.map((f, index) => ({
            name: f.name,
            path: currentPath ? `${currentPath}/${f.name}` : f.name,
            size: f.size,
            mtime: Date.now(),
            parent: currentPath,
            type: 'file',
            _uploading: true,
            _progress: 0,
            _file: f
        }));
        setUploads(prev => [...prev, ...newUploads]);

        const uploadOne = (uploadItem: typeof newUploads[0]) => new Promise<void>((resolve) => {
            const xhr = new XMLHttpRequest();
            const cleanDir = (currentPath || '').replace(/^\/+|\/+$/g, '');
            const filePath = cleanDir ? `${cleanDir}/${uploadItem.name}` : uploadItem.name;
            const uploadUrl = `${serverUrl}/api/vfs/upload/${mount}/${filePath}`;
            xhr.open('POST', uploadUrl, true);
            if (accessToken) {
                xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
            }
            
            xhr.upload.onprogress = (evt) => {
                if (evt.lengthComputable) {
                    const percent = Math.round((evt.loaded / evt.total) * 100);
                    setUploads(prev => prev.map(u => 
                        u.name === uploadItem.name ? { ...u, _progress: percent } : u
                    ));
                }
            };

            const markError = (msg: string) => {
                setUploads(prev => prev.map(u => 
                    u.name === uploadItem.name ? { ...u, _uploading: false, _error: msg } : u
                ));
                setTimeout(() => {
                    setUploads(prev => prev.filter(u => u.name !== uploadItem.name));
                }, 4000);
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    setUploads(prev => prev.filter(u => u.name !== uploadItem.name));
                } else {
                    let msg = `Error ${xhr.status}`;
                    try {
                        const body = JSON.parse(xhr.responseText);
                        msg = body.message || body.error || msg;
                    } catch {}
                    markError(msg);
                }
                resolve();
            };

            xhr.onerror = () => {
                markError('Network error');
                resolve();
            };

            const formData = new FormData();
            if (uploadItem._file) {
                formData.append('file', uploadItem._file);
            }
            xhr.send(formData);
        });

        await Promise.all(newUploads.map(uploadOne));
        fetchDir(currentPath || '/');
    };

    const [internalViewMode, setInternalViewMode] = useState<'list' | 'thumbs' | 'tree'>(() => {
        if (autoSaveId) {
            const saved = localStorage.getItem(`${autoSaveId}-viewMode`);
            if (saved === 'list' || saved === 'thumbs' || saved === 'tree') return saved;
        }
        return initialViewMode;
    });

    const [internalMode, setInternalMode] = useState<'simple' | 'advanced'>(() => {
        if (autoSaveId) {
            const saved = localStorage.getItem(`${autoSaveId}-mode`);
            if (saved === 'simple' || saved === 'advanced') return saved;
        }
        return mode;
    });

    const setViewMode = useCallback((m: 'list' | 'thumbs' | 'tree') => {
        setInternalViewMode(m);
        if (autoSaveId) localStorage.setItem(`${autoSaveId}-viewMode`, m);
    }, [autoSaveId]);

    const setDisplayMode = useCallback((m: 'simple' | 'advanced') => {
        setInternalMode(m);
        if (autoSaveId) localStorage.setItem(`${autoSaveId}-mode`, m);
    }, [autoSaveId]);

    const [splitDirection, setSplitDirectionState] = useState<'horizontal' | 'vertical'>(() => {
        if (autoSaveId) {
            const saved = localStorage.getItem(`${autoSaveId}-splitDir`);
            if (saved === 'horizontal' || saved === 'vertical') return saved;
        }
        return typeof window !== 'undefined' && window.innerWidth < 768 ? 'vertical' : 'horizontal';
    });

    const setSplitDirection = useCallback((m: 'horizontal' | 'vertical') => {
        setSplitDirectionState(m);
        if (autoSaveId) localStorage.setItem(`${autoSaveId}-splitDir`, m);
    }, [autoSaveId]);

    const viewMode = internalViewMode;
    const currentMode = internalMode;
    const activeSplitSize = splitDirection === 'horizontal' ? splitSizeHorizontal : splitSizeVertical;

    const [thumbSize, setThumbSize] = useState(() => {
        const v = localStorage.getItem('fb-thumb-size');
        return v ? Math.max(60, Math.min(200, Number(v))) : 80;
    });
    const [fontSize, setFontSize] = useState(() => {
        const v = localStorage.getItem('fb-font-size');
        return v ? Math.max(10, Math.min(18, Number(v))) : 14;
    });

    const zoomIn = () => {
        if (viewMode === 'thumbs') setThumbSize(s => { const n = Math.min(200, s + 20); localStorage.setItem('fb-thumb-size', String(n)); return n; });
        else setFontSize(s => { const n = Math.min(18, s + 1); localStorage.setItem('fb-font-size', String(n)); return n; });
    };
    const zoomOut = () => {
        if (viewMode === 'thumbs') setThumbSize(s => { const n = Math.max(60, s - 20); localStorage.setItem('fb-thumb-size', String(n)); return n; });
        else setFontSize(s => { const n = Math.max(10, s - 1); localStorage.setItem('fb-font-size', String(n)); return n; });
    };

    // ── Selection & Refs ─────────────────────────────────────────

    const listRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const {
        focusIdx,
        setFocusIdx,
        selected,
        setSelected,
        itemCount,
        getNode,
        handleItemClick,
        handleItemContextMenu,
        clearSelection
    } = useSelection({
        sorted: displayNodes,
        canGoUp,
        onSelect
    });

    // Dummy Sort controls for now since useVfsAdapter uses static sortBy
    const [sortBy, setSortBy] = useState<SortKey>(initialSort);
    const [sortAsc, setSortAsc] = useState(true);
    const cycleSort = () => {
        const keys: SortKey[] = ['name', 'ext', 'date', 'type'];
        const i = keys.indexOf(sortBy);
        if (sortAsc) { setSortAsc(false); } else { setSortBy(keys[(i + 1) % keys.length]); setSortAsc(true); }
    };

    // ── Previews ─────────────────────────────────────────────────

    const {
        lightboxNode,
        setLightboxNode,
        textLightboxNode,
        setTextLightboxNode,
        iframeLightboxNode,
        setIframeLightboxNode,
        openPreview,
        closeAllPreviews
    } = useFilePreview({ allowLightbox, allowFileViewer });

    // ── Filter Dialog State ────────────────────────────────────────

    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [tempGlob, setTempGlob] = useState(currentGlob);
    const [tempShowFolders, setTempShowFolders] = useState(showFolders);

    const applyTempFilter = () => {
        updateFilter(tempGlob, tempShowFolders);
        setFilterDialogOpen(false);
        setTimeout(() => containerRef.current?.focus(), 0);
    };

    const mediaGlob = Array.from(new Set([...IMAGE_EXTS, ...VIDEO_EXTS])).map(ext => `*.${ext}`).join(',');
    const codeGlob = Array.from(CODE_EXTS).map(ext => `*.${ext}`).join(',');

    const tokenParam = accessToken ? `token=${encodeURIComponent(accessToken)}` : '';

    // ── Standalone scroll & grid helpers (shared by keyboard + selection hooks) ──

    const scrollItemIntoView = useCallback((idx: number) => {
        if (!listRef.current) return;
        const items = listRef.current.querySelectorAll('[data-fb-idx]');
        const el = items[idx] as HTMLElement | undefined;
        el?.scrollIntoView({ block: 'nearest' });
    }, []);

    const getGridCols = useCallback((): number => {
        if (viewMode !== 'thumbs' || !listRef.current) return 1;
        const style = getComputedStyle(listRef.current);
        const cols = style.gridTemplateColumns.split(' ').length;
        return Math.max(1, cols);
    }, [viewMode]);

    // ── Default Selection Handler (first so we get wrapped goUp) ──

    const [pendingFileSelect, setPendingFileSelect] = useState<string | null>(null);
    const selectedCopyCandidates = useMemo(
        () => selected.filter((n) => getMimeCategory(n) !== 'other'),
        [selected]
    );
    const copyTransfer = useCopyTransfer({
        mount,
        selectedSources: selectedCopyCandidates,
        stream,
        onCompleted: () => fetchDir(currentPath || '/'),
    });
    const copyEnabled = allowCopyAction && copyTransfer.copyEnabled;

    const { goUp } = useDefaultSelectionHandler({
        sorted: displayNodes,
        canGoUp,
        rawGoUp,
        currentPath,
        loading,
        viewMode,
        autoFocus,
        index,
        isSearchMode,
        initialFile,
        allowFallback,
        setFocusIdx,
        setSelected,
        onSelect,
        pendingFileSelect,
        setPendingFileSelect,
        scrollItemIntoView,
        containerRef,
        listRef,
    });

    /** Context menu actions (before keyboard hook — used by Shift+F10 for list/thumbs). */
    const vfsContextMenuSig = useActionStore((s) =>
        (panelId ? vfsPanelActionStoreSignature(s.actions, panelId, 'ContextMenu') : ''),
    );
    const vfsContextMenuActions = useMemo(() => {
        if (!panelId) return [];
        const prefix = `${VFS_ACTION_PREFIX}/${panelId}/`;
        return Object.values(useActionStore.getState().actions)
            .filter((a) => a.id.startsWith(prefix) && a.visibilities?.ContextMenu !== false)
            .sort((a, b) => (a.group || '').localeCompare(b.group || '') || a.label.localeCompare(b.label));
    }, [panelId, vfsContextMenuSig]);

    const openContextMenuFromKeyboard = useCallback(() => {
        if (!vfsContextMenuActions.length || viewMode === 'tree') return;
        handleItemContextMenu(focusIdx);
        const el = listRef.current?.querySelector(`[data-fb-idx="${focusIdx}"]`) as HTMLElement | null;
        if (el) {
            const r = el.getBoundingClientRect();
            el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, view: window, button: 2 }));
        }
    }, [vfsContextMenuActions, viewMode, handleItemContextMenu, focusIdx]);

    // ── Default Keyboard Handler (uses wrapped goUp) ─────────────

    const {
        searchOpen,
        setSearchOpen,
        searchDisplay,
        searchBufferRef,
        pendingSearchSelection,
        setPendingSearchSelection,
        handleKeyDown
    } = useDefaultKeyboardHandler({
        focusIdx,
        setFocusIdx,
        selected,
        setSelected,
        itemCount,
        getNode,
        clearSelection,
        canGoUp,
        goUp,
        updatePath,
        openPreview,
        viewMode,
        setViewMode,
        setDisplayMode,
        currentGlob,
        showFolders,
        cycleSort,
        setTempGlob,
        setTempShowFolders,
        setFilterDialogOpen,
        containerRef,
        scrollItemIntoView,
        getGridCols,
        autoFocus,
        allowFallback,
        currentPath,
        onSearchQueryChange,
        searchQuery,
        isSearchMode,
        onSelect,
        sorted: displayNodes,
        onCopyRequest: copyTransfer.handleCopyRequest,
        onOpenContextMenu: openContextMenuFromKeyboard,
    });

    // ── Default Actions ──────────────────────────────────────────

    const {
        selectedFile,
        getFileUrl,
        handleView,
        handleDownload,
        handleDownloadDir,
        mediaNodes,
        lightboxIdx,
        lightboxPrev,
        lightboxNext,
        closeLightbox,
        closeTextLightbox,
        closeIframeLightbox,
        handleDoubleClick,
        handleLinkClick
    } = useDefaultActions({
        mount,
        mountProp,
        pathProp,
        accessToken,
        selected,
        sorted: displayNodes,
        canGoUp,
        setFocusIdx,
        setSelected,
        lightboxNode,
        setLightboxNode,
        textLightboxNode,
        setTextLightboxNode,
        iframeLightboxNode,
        setIframeLightboxNode,
        openPreview,
        updatePath,
        setPendingFileSelect,
        containerRef,
        getNode,
        goUp,
    });

    const allowPanels = fileBrowserCtx?.allowPanels ?? false;
    const rightPanels = fileBrowserCtx?.rightPanels;
    const activeSide = fileBrowserCtx?.activeSide;
    const addPanel = fileBrowserCtx?.addPanel;
    const setLayoutMode = fileBrowserCtx?.setLayout;
    const layoutMode = fileBrowserCtx?.layout;
    const linked = fileBrowserCtx?.linked;
    const setLinked = fileBrowserCtx?.setLinked;

    const addNewTab = useCallback(() => {
        if (!allowPanels || !browserSide || !addPanel) return;
        // Always open the new tab in the right pane (Krusader-style); show dual layout if needed.
        setLayoutMode?.('dual');
        addPanel('right', {
            mount,
            path: pathProp ?? '/',
            glob: actualCurrentGlob,
            showFolders,
            showExplorer: showExplorer !== false,
            showPreview: showPreview !== false,
            searchQuery: undefined,
            searchFullText: false,
            selected: [],
        });
    }, [allowPanels, browserSide, addPanel, setLayoutMode, mount, pathProp, actualCurrentGlob, showFolders, showExplorer, showPreview]);

    const switchToDualLayout = useCallback(() => {
        setLayoutMode?.('dual');
    }, [setLayoutMode]);

    const switchToSingleLayout = useCallback(() => {
        setLayoutMode?.('single');
    }, [setLayoutMode]);

    const toggleLinkedPanes = useCallback(() => {
        if (layoutMode !== 'dual' || !setLinked) return;
        setLinked(!linked);
    }, [layoutMode, linked, setLinked]);

    /** Copy To dialog: in dual layout, default destination to the right pane when the left pane initiates copy. */
    const copyToInitialValue = useMemo(() => {
        const base = `${mount}:${currentPath || '/'}`;
        if (!fileBrowserCtx || layoutMode !== 'dual' || !rightPanels?.length) {
            return base;
        }
        if (activeSide === 'left') {
            const rp = rightPanels[0];
            return `${rp.mount}:${rp.path || '/'}`;
        }
        return base;
    }, [fileBrowserCtx, layoutMode, rightPanels, activeSide, mount, currentPath]);

    const fileBrowserImmersive = useAppStore((s) => s.fileBrowserImmersive);
    const toggleFileBrowserImmersive = useCallback(() => {
        const cur = useAppStore.getState().fileBrowserImmersive;
        useAppStore.getState().setFileBrowserImmersive(!cur);
    }, []);

    const navigate = useNavigate();

    const pluginCtx = useMemo<FileBrowserPluginContext>(
        () => ({
            mount,
            selected,
            accessToken,
            sessionUser: session?.user,
            navigate,
            setWizardReturnPath: (path: string) => {
                setWizardImage(null, path);
            },
        }),
        [mount, selected, accessToken, session?.user, navigate, setWizardImage],
    );

    const pluginContribution = useMemo(() => mergeVfsPluginContributions(pluginCtx), [pluginCtx]);

    const vfsSpec = useMemo<VfsPanelActionSpec>(() => ({
        canGoUp,
        goUp,
        refresh: () => { fetchDir(currentPath || '/'); },
        canOpen: !!selectedFile,
        openSelected: handleView,
        allowDownload: allowDownload && selected.length > 0,
        download: handleDownload,
        downloadFolder: allowDownload ? handleDownloadDir : undefined,
        canCopy: copyEnabled,
        copy: () => { void copyTransfer.handleCopyRequest(); },
        sortBy,
        sortAsc,
        cycleSort,
        viewMode,
        setViewMode,
        zoomIn,
        zoomOut,
        showExplorer: showExplorer !== false,
        toggleExplorer: onToggleExplorer ?? (() => {}),
        showPreview: showPreview !== false,
        togglePreview: onTogglePreview ?? (() => {}),
        openFilter: () => {
            setTempGlob(currentGlob);
            setTempShowFolders(showFolders);
            setFilterDialogOpen(true);
        },
        openSearch: () => { setSearchOpen(true); },
        isSearchMode,
        clearSearch: () => { onSearchQueryChange?.(''); },
        allowPanels,
        addNewTab: allowPanels && browserSide ? addNewTab : undefined,
        switchToDualLayout: allowPanels ? switchToDualLayout : undefined,
        switchToSingleLayout: allowPanels ? switchToSingleLayout : undefined,
        toggleLinkedPanes: allowPanels ? toggleLinkedPanes : undefined,
        linked: linked ?? false,
        layout: layoutMode,
        fileBrowserImmersive,
        toggleFileBrowserImmersive: fileBrowserCtx ? toggleFileBrowserImmersive : undefined,
        ...pluginContribution,
    }), [
        canGoUp, goUp, fetchDir, currentPath, selectedFile, handleView, allowDownload, selected.length,
        handleDownload, handleDownloadDir, copyEnabled,
        copyTransfer.handleCopyRequest,
        sortBy, sortAsc, cycleSort,
        viewMode, setViewMode, zoomIn, zoomOut, showExplorer, onToggleExplorer, showPreview, onTogglePreview,
        currentGlob, showFolders, isSearchMode, onSearchQueryChange, setSearchOpen,
        allowPanels, browserSide, addNewTab, switchToDualLayout, switchToSingleLayout, toggleLinkedPanes, linked, layoutMode,
        fileBrowserImmersive, fileBrowserCtx, toggleFileBrowserImmersive,
        pluginContribution,
    ]);

    const vfsActionsEnabled = Boolean(panelId && fileBrowserCtx);
    useRegisterVfsPanelActions(panelId, vfsActionsEnabled, vfsSpec);

    return (
        <div
            ref={containerRef}
            data-testid="file-browser-panel"
            tabIndex={viewMode === 'tree' ? undefined : 0}
            className={`fb-panel-container ${isDragOver ? 'ring-2 ring-primary bg-primary/5' : ''}`}
            onKeyDown={handleKeyDown}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                position: 'relative',
                display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
                border: '1px solid var(--border, #334155)', borderRadius: 6, overflow: 'hidden',

                fontFamily: 'var(--font-sans, system-ui, sans-serif)', outline: 'none',
            }}
        >
            <style>{`
        @media (max-width: 767px) { 
          .fb-detail-pane { display: none !important; }
        }
      `}</style>

            {/* ═══ Drop Overlay ═══════════════════════════════ */}
            {isDragOver && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 50,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '2px dashed var(--primary, #3b82f6)',
                    borderRadius: 6,
                    pointerEvents: 'none',
                }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary, #3b82f6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--primary, #3b82f6)', letterSpacing: '0.02em' }}>
                        Drop files to upload
                    </span>
                </div>
            )}

            {/* ═══ Toolbar ═══════════════════════════════════ */}
            {showToolbar && (
                <FileBrowserToolbar
                    canGoUp={canGoUp}
                    goUp={goUp}
                    canChangeMount={!jail && canChangeMount}
                    availableMounts={availableMounts}
                    mount={mount}
                    updateMount={updateMount}
                    mountProp={mountProp}
                    pathProp={pathProp}
                    updatePath={updatePath}
                    breadcrumbs={breadcrumbs}
                    selectedNode={selected.length === 1 ? selected[0] : null}
                    selectedNodes={selected}
                    selectedFile={selectedFile}
                    handleView={handleView}
                    handleDownload={handleDownload}
                    allowDownload={allowDownload && selected.length > 0}
                    allowCopy={copyEnabled}
                    onCopy={copyTransfer.handleCopyRequest}
                    handleDownloadDir={handleDownloadDir}
                    allowDownloadDir={allowDownload}
                    sortBy={sortBy}
                    sortAsc={sortAsc}
                    cycleSort={cycleSort}
                    zoomIn={zoomIn}
                    zoomOut={zoomOut}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    displayMode={currentMode}
                    setDisplayMode={setDisplayMode}
                    splitDirection={splitDirection}
                    setSplitDirection={setSplitDirection}
                    showExplorer={showExplorer}
                    onToggleExplorer={onToggleExplorer}
                    showPreview={showPreview}
                    onTogglePreview={onTogglePreview}
                    onFilterOpen={() => {
                        setTempGlob(currentGlob);
                        setTempShowFolders(showFolders);
                        setFilterDialogOpen(true);
                    }}
                    onSearchOpen={() => setSearchOpen(true)}
                    fontSize={fontSize}
                    isSearchMode={isSearchMode}
                    onClearSearch={() => onSearchQueryChange && onSearchQueryChange('')}
                />
            )}

            {/* ═══ Content ═══════════════════════════════════ */}
            {loading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.6 }}>
                    <Loader2 size={16} className="animate-spin" />
                    <span style={{ fontSize: 14 }}><T>Loading…</T></span>
                </div>
            ) : error ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontSize: 14, color: '#ef4444' }}>
                    <T>{error}</T>
                </div>
            ) : itemCount === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontSize: 14, opacity: 0.5 }}>
                    <T>Empty directory</T>
                </div>
            ) : (
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

                    <ResizablePanelGroup
                        direction={splitDirection}
                        onLayout={(sizes) => {
                            if (onLayoutChange) onLayoutChange(sizes, splitDirection);
                        }}
                        {...(activeSplitSize && activeSplitSize.length > 0 ? {} : { autoSaveId: autoSaveId ? `${autoSaveId}-split-${splitDirection}` : `pm-filebrowser-panel-layout-${splitDirection}` })}
                        className={`flex-1 flex overflow-hidden ${splitDirection === 'vertical' ? 'flex-col min-h-0' : 'flex-row min-w-0'}`}
                    >
                        {showExplorer && (
                            <ResizablePanel defaultSize={activeSplitSize ? activeSplitSize[0] : 60} minSize={15} className="relative min-w-0 bg-white dark:bg-slate-800/50">
                                <div className="w-full h-full flex flex-col min-h-[50px] min-w-0">
                                    {viewMode === 'tree' ? (
                                        <div className="flex-1 min-h-0 overflow-hidden pt-1">
                                            <FileTree
                                                data={displayNodes}
                                                canGoUp={canGoUp}
                                                onGoUp={goUp}
                                                selectedId={selected.length === 1 ? selected[0].path : undefined}
                                                fontSize={fontSize}
                                                fetchChildren={async (node: INode) => {
                                                    const clean = node.path.replace(/^\/+/, '');
                                                    const base = vfsUrl('ls', mount, clean);
                                                    const url = `${base}?includeSize=true`;
                                                    const headers: Record<string, string> = {};
                                                    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
                                                    const res = await fetch(url, { headers });
                                                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                                                    return res.json();
                                                }}
                                                onSelectionChange={(nodes) => {
                                                    setSelected(nodes);
                                                }}
                                                onSelect={(n) => {
                                                    setSelected([n]);
                                                }}
                                                onActivate={(n) => {
                                                    if (getMimeCategory(n) === 'dir') {
                                                        updatePath(n.path || n.name);
                                                    } else {
                                                        openPreview(n);
                                                    }
                                                }}
                                                vfsContextMenuActions={vfsContextMenuActions}
                                            />
                                        </div>
                                    ) : viewMode === 'list' ? (
                                        <div className="flex-1 min-h-0 overflow-hidden pt-1 flex flex-col w-full h-full">
                                            <FileListView
                                                listRef={listRef}
                                                sorted={displayNodes}
                                                canGoUp={canGoUp}
                                                goUp={goUp}
                                                focusIdx={focusIdx}
                                                setFocusIdx={setFocusIdx}
                                                selected={selected}
                                                onItemClick={handleItemClick}
                                                onItemDoubleClick={handleDoubleClick}
                                                fontSize={fontSize}
                                                mode={currentMode}
                                                searchBuffer={isSearchMode ? (searchQuery || searchDisplay) : searchDisplay}
                                                isSearchMode={isSearchMode}
                                                vfsContextMenuActions={vfsContextMenuActions}
                                                onVfsContextMenuOpen={handleItemContextMenu}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden w-full h-full pt-1">
                                            <FileGridView
                                                listRef={listRef}
                                                sorted={displayNodes}
                                                canGoUp={canGoUp}
                                                goUp={goUp}
                                                focusIdx={focusIdx}
                                                setFocusIdx={setFocusIdx}
                                                selected={selected}
                                                onItemClick={handleItemClick}
                                                onItemDoubleClick={handleDoubleClick}
                                                thumbSize={thumbSize}
                                                mount={mount}
                                                tokenParam={tokenParam}
                                                fontSize={fontSize}
                                                isSearchMode={isSearchMode}
                                                vfsContextMenuActions={vfsContextMenuActions}
                                                onVfsContextMenuOpen={handleItemContextMenu}
                                            />
                                        </div>
                                    )}
                                </div>
                            </ResizablePanel>
                        )}

                        {/* Right Pane conditionally renders if preview or fallback exists */}
                        {showPreview && ((!showExplorer && selected.length === 1) || (allowPreview && selected.length === 1 && getMimeCategory(selected[0]) !== 'dir') || (selected.length === 0 && readmeContent) || (allowPreview && selectedReadmeContent) || (allowPreview && allowFallback && selected.length === 1 && getMimeCategory(selected[0]) === 'dir')) && (
                            <>
                                {showExplorer && <ResizableHandle withHandle />}
                                <ResizablePanel defaultSize={activeSplitSize && activeSplitSize.length > 1 ? activeSplitSize[1] : (showExplorer ? 40 : 100)} minSize={15} className="relative min-w-0 bg-card/30">
                                    <div className="w-full h-full flex flex-col min-h-[50px] min-w-0">
                                        {((!showExplorer && selected.length === 1 && getMimeCategory(selected[0]) !== 'dir') || (allowPreview && selected.length === 1 && getMimeCategory(selected[0]) !== 'dir')) ? (
                                            <div className="fb-readme-pane shrink-0 border-t md:border-t-0 border-border overflow-hidden w-full h-full relative flex flex-1 flex-col min-h-0">
                                                {renderFileViewer({
                                                    selected: selected[0],
                                                    url: getFileUrl(selected[0]),
                                                    fileName: selected[0].name,
                                                    inline: true,
                                                    isOpen: true,
                                                    onClose: () => { },
                                                    onLinkClick: (href, e) => handleLinkClick(href, e, selected[0].parent || '/')
                                                })}
                                            </div>
                                        ) : ((selected.length === 0 && readmeContent) || (allowPreview && selectedReadmeContent)) ? (
                                            <div className="fb-readme-pane shrink-0 p-6 border-t md:border-t-0 border-border overflow-y-auto flex-1 w-full h-full">
                                                <MarkdownRenderer
                                                    content={selectedReadmeContent || readmeContent || ''}
                                                    baseUrl={
                                                        selectedReadmeContent && selected.length === 1
                                                            ? vfsUrl('get', mount, selected[0].path) + '/'
                                                            : vfsUrl('get', mount, currentPath) + '/'
                                                    }
                                                    onLinkClick={(href, e) => {
                                                        const basePath = (selectedReadmeContent && selected.length === 1)
                                                            ? (selected[0].parent || '/')
                                                            : currentPath;
                                                        handleLinkClick(href, e, basePath);
                                                    }}
                                                />
                                            </div>
                                        ) : (allowPreview && allowFallback && selected.length === 1 && getMimeCategory(selected[0]) === 'dir') ? (
                                            <div className="fb-readme-pane flex shrink-0 border-t md:border-t-0 border-border flex-1 flex-col min-h-0 overflow-hidden relative w-full h-full">
                                                <FileBrowserPanel
                                                    mount={mount}
                                                    path={selected[0].path}
                                                    viewMode="thumbs"
                                                    showToolbar={false}
                                                    mode="simple"
                                                    jail={true}
                                                    allowFallback={false}
                                                    index={false}
                                                    autoFocus={false}
                                                    showStatusBar={false}
                                                />
                                            </div>
                                        ) : null}
                                    </div>
                                </ResizablePanel>
                            </>
                        )}
                    </ResizablePanelGroup>

                    {/* Detail panel (advanced, desktop only) */}


                    {/* Detail panel (advanced, desktop only) */}
                    {mode === 'advanced' && (
                        <FileDetailPanel file={selected.length === 1 ? selected[0] : null} fileUrl={selected.length === 1 ? getFileUrl(selected[0]) : ''} />
                    )}
                </div>
            )}

            {showStatusBar && <div style={{
                padding: '4px 10px', fontSize: 13, borderTop: '2px solid var(--border)',
                color: 'var(--muted-foreground)', display: 'flex', justifyContent: 'space-between',
                background: 'var(--muted)', width: '100%', overflow: 'hidden', gap: '8px'
            }}>
                <span
                    title={`${sorted.length} ${sorted.length !== 1 ? 'items' : 'item'} · ${formatSize(sorted.reduce((sum, n) => sum + (n.size || 0), 0))}${selectedFile ? ` · ${selectedFile.name} (${formatSize(selectedFile.size)})` : ''}`}
                    style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                    {sorted.length} <T>{sorted.length !== 1 ? 'items' : 'item'}</T>
                    {' · '}{formatSize(sorted.reduce((sum, n) => sum + (n.size || 0), 0))}
                    {selectedFile ? ` · ${selectedFile.name} (${formatSize(selectedFile.size)})` : ''}
                </span>
                <span
                    title={`${mount}:${currentPath || '/'}`}
                    style={{
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        flexShrink: 1, textAlign: 'right', minWidth: 50, maxWidth: '50%'
                    }}
                >
                    {mount}:{currentPath || '/'}
                </span>
            </div>}

            {/* ═══ Lightboxes ════════════════════════════════ */}
            <ImageLightbox
                isOpen={!!lightboxNode}
                onClose={closeLightbox}
                imageUrl={lightboxNode ? getFileUrl(lightboxNode) : ''}
                imageTitle={lightboxNode?.name || ''}
                currentIndex={lightboxIdx}
                totalCount={mediaNodes.length}
                onNavigate={(dir) => dir === 'prev' ? lightboxPrev() : lightboxNext()}
                showPrompt={false}
            />
            <LightboxText
                isOpen={!!textLightboxNode}
                onClose={closeTextLightbox}
                url={textLightboxNode ? getFileUrl(textLightboxNode) : ''}
                fileName={textLightboxNode?.name || ''}
            />
            <LightboxIframe
                isOpen={!!iframeLightboxNode}
                onClose={closeIframeLightbox}
                url={iframeLightboxNode ? getFileUrl(iframeLightboxNode) : ''}
                fileName={iframeLightboxNode?.name || ''}
            />

            {/* ── Dialogs ───────────────────────────────────────────── */}
            {filterDialogOpen && (
                <Dialog open={filterDialogOpen} onOpenChange={(open) => {
                    if (!open) {
                        setFilterDialogOpen(false);
                        setTimeout(() => containerRef.current?.focus(), 0);
                    }
                }}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle><T>Filter Current View</T></DialogTitle>
                            <DialogDescription>
                                <T>Enter a list of comma-separated wildcard matcher expressions (e.g., *.jpg, *.png) or use a preset below.</T>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="showFolders" className="flex flex-col gap-1">
                                    <span><T>Show Folders</T></span>
                                    <span className="font-normal text-xs text-muted-foreground"><T>Keep subdirectories visible alongside matched files</T></span>
                                </Label>
                                <Switch
                                    id="showFolders"
                                    checked={tempShowFolders}
                                    onCheckedChange={setTempShowFolders}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="globPattern">Glob Pattern</Label>
                                <Input
                                    id="globPattern"
                                    value={tempGlob}
                                    onChange={(e) => setTempGlob(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            applyTempFilter();
                                        }
                                    }}
                                    autoFocus
                                    placeholder="*.*"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setTempGlob('*.*')}>
                                    All Files (*.*)
                                </Badge>
                                <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setTempGlob(mediaGlob)}>
                                    Media
                                </Badge>
                                <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setTempGlob(codeGlob)}>
                                    Code
                                </Badge>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 w-full">
                            <Button variant="outline" onClick={() => {
                                setFilterDialogOpen(false);
                                setTimeout(() => containerRef.current?.focus(), 0);
                            }}>
                                Cancel
                            </Button>
                            <Button onClick={applyTempFilter}>
                                Apply Filter
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Search dialog */}
            {searchOpen && (
                <SearchDialog
                    mount={mount}
                    currentPath={currentPath}
                    accessToken={accessToken}
                    onNavigate={(node: INode) => {
                        const isDir = getMimeCategory(node) === 'dir';

                        if (isDir) {
                            updatePath(node.path.startsWith('/') ? node.path : `/${node.path}`);
                        } else {
                            const parentPath = node.parent || '/';

                            const currentTarget = parentPath.startsWith('/') ? parentPath : `/${parentPath}`;
                            const normalizedCurrent = currentPath.replace(/\/+$/, '') || '/';
                            const normalizedTarget = currentTarget.replace(/\/+$/, '') || '/';

                            if (normalizedTarget !== normalizedCurrent) {
                                setPendingSearchSelection(node.name);
                                updatePath(currentTarget);
                            } else {
                                const idx = sorted.findIndex(n => n.name === node.name);
                                if (idx >= 0) {
                                    const focusIndex = canGoUp ? idx + 1 : idx;
                                    setFocusIdx(focusIndex);
                                    const itemNode = sorted[idx];
                                    if (itemNode) {
                                        const newlySelected = [itemNode];
                                        setSelected(newlySelected);
                                        if (onSelect) {
                                            onSelect(newlySelected);
                                        }
                                        requestAnimationFrame(() => scrollItemIntoView(focusIndex));
                                    }
                                }
                            }
                        }
                    }}
                    onClose={() => {
                        setSearchOpen(false);
                        setTimeout(() => {
                            if (viewMode === 'tree') {
                                listRef.current?.focus();
                            } else {
                                containerRef.current?.focus();
                            }
                        }, 0);
                    }}
                />
            )}

            <FilePickerDialog
                open={copyTransfer.copyDialogOpen}
                onOpenChange={copyTransfer.setCopyDialogOpen}
                mode="pick"
                title={translate('Copy To')}
                confirmLabel={copyTransfer.copyBusy ? translate('Copying...') : translate('Copy')}
                confirmDisabled={copyTransfer.copyBusy}
                initialValue={copyToInitialValue}
                initialMask="*.*"
                onConfirm={copyTransfer.handleCopyConfirm}
                extensionSlot={
                    <CopyTransferOptions
                        includePatterns={copyTransfer.copyIncludePatterns}
                        excludePatterns={copyTransfer.copyExcludePatterns}
                        excludeDefault={copyTransfer.copyExcludeDefault}
                        conflictPreset={copyTransfer.copyConflictPreset}
                        onIncludePatternsChange={copyTransfer.setCopyIncludePatterns}
                        onExcludePatternsChange={copyTransfer.setCopyExcludePatterns}
                        onExcludeDefaultChange={copyTransfer.setCopyExcludeDefault}
                        onConflictPresetChange={copyTransfer.setCopyConflictPreset}
                        error={copyTransfer.copyError}
                    />
                }
            />

            <CopyProgressDialog
                open={copyTransfer.copyProgress.open}
                busy={copyTransfer.copyBusy}
                progress={copyTransfer.copyProgress.progress}
                fileProgress={copyTransfer.copyProgress.fileProgress}
                filesDone={copyTransfer.copyProgress.filesDone}
                totalFiles={copyTransfer.copyProgress.totalFiles}
                bytesTransferred={copyTransfer.copyProgress.bytesTransferred}
                taskState={copyTransfer.copyTaskState}
                error={copyTransfer.copyError}
                onOpenChange={(open) => copyTransfer.setCopyProgress((prev: any) => ({ ...prev, open }))}
            />
            <CopyConflictDialog
                open={Boolean(copyTransfer.copyConflict)}
                conflict={copyTransfer.copyConflict}
                resolving={copyTransfer.resolvingConflict}
                error={copyTransfer.copyError}
                onOpenChange={(open) => {
                    if (!open && !copyTransfer.resolvingConflict) copyTransfer.setCopyConflict(undefined);
                }}
                onDecision={(decision) => {
                    void copyTransfer.resolveConflictDecision(decision);
                }}
            />
        </div>
    );
};

export { FileBrowserPanel };
export default FileBrowserPanel;
