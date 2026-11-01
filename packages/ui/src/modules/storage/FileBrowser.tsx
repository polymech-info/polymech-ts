import type { INode } from '@/modules/storage/types';
import React, { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { T } from '@/i18n';
import { FileBrowserProvider, useFileBrowser, type FileBrowserChrome } from './FileBrowserContext';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useIsMobile } from '@/hooks/use-mobile';
import LayoutToolbar from './LayoutToolbar';
import PanelSide from './PanelSide';
import FileBrowserRibbonBar from './FileBrowserRibbonBar';

/**
 * Standalone FileBrowser page — Krusader-style dual pane.
 * Inner component that requires FileBrowserProvider context.
 * Syncs active panel mount/path to the browser URL.
 */
const FileBrowserInner: React.FC<{ disableRoutingSync?: boolean, onSelect?: (node: INode | null, mount?: string) => void }> = ({ disableRoutingSync, onSelect }) => {
    const { loading } = useAuth();
    const { layout, activePanel, allowPanels, chrome } = useFileBrowser();
    const fileBrowserImmersive = useAppStore((s) => s.fileBrowserImmersive);
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const hasInitialSelectedRef = React.useRef(false);

    // Propagate selection to parent if requested
    useEffect(() => {
        if (onSelect) {
            onSelect(activePanel.selected.length === 1 ? activePanel.selected[0] : null, activePanel.mount);
        }
    }, [activePanel.selected, activePanel.mount, onSelect]);

    // Sync active panel mount/path/glob/folders/file → browser URL
    useEffect(() => {
        if (disableRoutingSync) return;

        const cleanPath = activePanel.path.replace(/^\/+/, '');

        // Persist to local storage so we can restore location on a fresh visit
        localStorage.setItem('fb-last-mount', activePanel.mount);
        localStorage.setItem('fb-last-path', cleanPath);

        const urlPath = cleanPath
            ? `/app/filebrowser/${activePanel.mount}/${cleanPath}`
            : `/app/filebrowser/${activePanel.mount}`;

        // Preserve and modify query params
        const searchParams = new URLSearchParams(window.location.search);

        if (activePanel.glob && activePanel.glob !== '*.*') {
            searchParams.set('glob', activePanel.glob);
        } else {
            searchParams.delete('glob');
        }

        if (activePanel.showFolders === false) {
            searchParams.set('folders', '0');
        } else {
            searchParams.delete('folders');
        }

        if (activePanel.showExplorer === false) {
            searchParams.set('showExplorer', '0');
        } else {
            searchParams.delete('showExplorer');
        }

        if (activePanel.showPreview === false) {
            searchParams.set('showPreview', '0');
        } else {
            searchParams.delete('showPreview');
        }

        const initialFile = searchParams.get('file');

        if (activePanel.selected.length === 1) {
            const first = activePanel.selected[0];
            if (first.type !== 'dir' && first.mime !== 'inode/directory') {
                searchParams.set('file', first.name);
                hasInitialSelectedRef.current = true;
            } else {
                searchParams.delete('file');
                hasInitialSelectedRef.current = true;
            }
        } else if (activePanel.selected.length > 1) {
            searchParams.delete('file');
            hasInitialSelectedRef.current = true;
        } else {
            // activePanel.selected is empty
            // If the user already made a selection or there wasn't an initial file to preserve, clear it.
            if (!initialFile || hasInitialSelectedRef.current) {
                searchParams.delete('file');
            }
        }

        if (activePanel.searchQuery) {
            searchParams.set('search', activePanel.searchQuery);
            if (activePanel.searchFullText) {
                searchParams.set('fullText', '1');
            } else {
                searchParams.delete('fullText');
            }
        } else {
            searchParams.delete('search');
            searchParams.delete('fullText');
        }

        const newSearch = searchParams.toString() ? `?${searchParams.toString()}` : '';
        const currentPathWithSearch = window.location.pathname + window.location.search;
        const newPathWithSearch = urlPath + newSearch;

        if (currentPathWithSearch !== newPathWithSearch) {
            navigate(newPathWithSearch, { replace: true });
        }
    }, [activePanel.mount, activePanel.path, activePanel.glob, activePanel.showFolders, activePanel.selected, activePanel.searchQuery, activePanel.searchFullText, navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center flex-1 text-muted-foreground">
                <T>Loading…</T>
            </div>
        );
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: fileBrowserImmersive ? '100vh' : 'calc(100vh - 56px)',
                minHeight: fileBrowserImmersive ? '100dvh' : undefined,
                overflow: 'hidden',
            }}
        >
            {/* Layout chrome: ribbon carries Single / Dual / Link / New tab on desktop; keep top bar only on mobile (no ribbon) or toolbar chrome. */}
            {allowPanels && (chrome !== 'ribbon' || isMobile) && <LayoutToolbar />}

            {/* Ribbon is desktop-first (tall + horizontal groups). On narrow viewports we fall back to FileBrowserToolbar in PanelSide. */}
            {chrome === 'ribbon' && !isMobile && <FileBrowserRibbonBar />}

            {/* ═══ Resizable Panes ══════════════════════════ */}
            <ResizablePanelGroup direction={isMobile ? "vertical" : "horizontal"} style={{ flex: 1, overflow: 'hidden' }}>
                <ResizablePanel defaultSize={allowPanels && layout === 'dual' ? 50 : 100} order={1} id="fb-left">
                    <PanelSide side="left" />
                </ResizablePanel>
                {allowPanels && layout === 'dual' && (
                    <>
                        <ResizableHandle withHandle />
                        <ResizablePanel defaultSize={50} order={2} id="fb-right">
                            <PanelSide side="right" />
                        </ResizablePanel>
                    </>
                )}
            </ResizablePanelGroup>
        </div>
    );
};

/**
 * Exported wrapper — provides FileBrowserProvider so this component
 * works both from the standalone app AND when lazy-loaded by App.tsx.
 * Reads initial mount/path from URL path and display options from query params.
 */
const FileBrowser: React.FC<{
    allowPanels?: boolean,
    mode?: 'simple' | 'advanced',
    index?: boolean,
    showRibbon?: boolean,
    disableRoutingSync?: boolean,
    initialMount?: string,
    initialChrome?: FileBrowserChrome,
    onSelect?: (node: INode | null, mount?: string) => void
}> = ({ allowPanels = true, mode, index, showRibbon = true, disableRoutingSync, initialMount: propInitialMount, initialChrome, onSelect }) => {
    const location = useLocation();

    let initialMount = propInitialMount;
    let initialPath: string | undefined;

    if (!disableRoutingSync) {
        // Parse mount and path from URL: /app/filebrowser/{mount}/{...path}
        const urlRest = location.pathname.replace(/^\/app\/filebrowser\/?/, '');
        const segments = urlRest.split('/').filter(Boolean);

        if (segments.length > 0) {
            initialMount = initialMount || segments[0];
            initialPath = segments.slice(1).join('/');
        } else {
            initialMount = initialMount || localStorage.getItem('fb-last-mount') || undefined;
            initialPath = localStorage.getItem('fb-last-path') || undefined;
        }
    }

    // Read display options from URL query params
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get('view');
    const toolbarParam = searchParams.get('toolbar');
    const explorerParam = searchParams.get('showExplorer');
    const previewParam = searchParams.get('showPreview');
    const panelsParam = searchParams.get('panels');
    const modeParam = searchParams.get('mode');
    const fileParam = searchParams.get('file');
    const searchParam = searchParams.get('search');
    const fullTextParam = searchParams.get('fullText');
    const initialViewMode = viewParam === 'thumbs' ? 'thumbs' as const : viewParam === 'list' ? 'list' as const : viewParam === 'tree' ? 'tree' as const : undefined;
    const initialShowToolbar = toolbarParam === '0' ? false : toolbarParam === '1' ? true : undefined;
    const initialShowExplorer = explorerParam === '0' ? false : true;
    const initialShowPreview = previewParam === '0' ? false : true;
    const initialAllowPanels = panelsParam === '1' ? true : (panelsParam === '0' ? false : allowPanels);
    const initialMode = modeParam === 'advanced' ? 'advanced' : (modeParam === 'simple' ? 'simple' : mode);
    const initialSearchQuery = searchParam || undefined;
    const initialSearchFullText = fullTextParam === '1';

    // Read index param
    const indexParam = searchParams.get('index');
    const initialIndex = indexParam === '0' ? false : (indexParam === '1' ? true : index);

    // Read filter params
    const initialGlob = searchParams.get('glob') || '*.*';
    const initialShowFolders = searchParams.get('folders') === '0' ? false : true;

    // Chrome: ?ribbon=1 | ?ribbon=0 or ?chrome=ribbon | ?chrome=toolbar (prop initialChrome overrides when set)
    const chromeParam = searchParams.get('chrome');
    const ribbonParam = searchParams.get('ribbon');
    let initialChromeFromUrl: FileBrowserChrome | undefined;
    if (chromeParam === 'ribbon' || chromeParam === 'toolbar') {
        initialChromeFromUrl = chromeParam;
    } else if (ribbonParam === '1' || ribbonParam === 'true') {
        initialChromeFromUrl = 'ribbon';
    } else if (ribbonParam === '0' || ribbonParam === 'false') {
        initialChromeFromUrl = 'toolbar';
    }
    const resolvedInitialChrome = initialChrome ?? initialChromeFromUrl ?? (showRibbon ? 'ribbon' : 'toolbar');

    // ?file= overrides path to parent dir and pre-selects the file
    let finalPath = initialPath ? `/${initialPath}` : undefined;
    let initialFile: string | undefined;
    if (fileParam) {
        const clean = fileParam.replace(/^\/+/, '');
        const lastSlash = clean.lastIndexOf('/');
        if (lastSlash >= 0) {
            // If the file param is a full path, use its directory as the final path
            finalPath = '/' + clean.slice(0, lastSlash);
            initialFile = clean.slice(lastSlash + 1);
        } else {
            // Otherwise, it's just a filename in the current path
            initialFile = clean;
        }
    }

    return (
        <FileBrowserProvider
            initialMount={initialMount}
            initialPath={finalPath}
            initialViewMode={initialViewMode}
            initialShowToolbar={initialShowToolbar}
            initialShowExplorer={initialShowExplorer}
            initialShowPreview={initialShowPreview}
            initialAllowPanels={initialAllowPanels}
            initialMode={initialMode}
            initialFile={initialFile}
            initialIndex={initialIndex}
            initialGlob={initialGlob}
            initialShowFolders={initialShowFolders}
            initialSearchQuery={initialSearchQuery}
            initialSearchFullText={initialSearchFullText}
            initialChrome={resolvedInitialChrome}
        >
            <FileBrowserInner disableRoutingSync={disableRoutingSync} onSelect={onSelect} />
        </FileBrowserProvider>
    );
};

export default FileBrowser;
