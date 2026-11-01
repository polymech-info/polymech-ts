import React, { createContext, useContext, useState, useCallback } from 'react';
import type { INode } from '@/modules/storage/types';

// ── Panel State ──────────────────────────────────────────────────

export interface PanelState {
    id: string;
    mount: string;
    path: string;
    glob: string;
    showFolders: boolean;
    showExplorer?: boolean;
    showPreview?: boolean;
    searchQuery?: string;
    searchFullText?: boolean;
    selected: INode[];
}

export type Side = 'left' | 'right';
export type LayoutMode = 'single' | 'dual';
export type FileBrowserChrome = 'toolbar' | 'ribbon';

// ── Context Shape ────────────────────────────────────────────────

interface FileBrowserContextType {
    layout: LayoutMode;
    setLayout: (mode: LayoutMode) => void;

    /** Link mode: left folder navigation mirrors to right */
    linked: boolean;
    setLinked: (v: boolean) => void;

    /** Panels per side */
    leftPanels: PanelState[];
    rightPanels: PanelState[];

    /** Which side + panel index is active */
    activeSide: Side;
    activePanelIdx: number;
    setActivePanel: (side: Side, idx: number) => void;

    /** Get the currently active panel state */
    activePanel: PanelState;

    /** Update a panel's state */
    updatePanel: (side: Side, idx: number, patch: Partial<PanelState>) => void;

    /** Add a new tab/panel to a side */
    addPanel: (side: Side, initial?: Partial<PanelState>) => void;

    /** Remove a panel (tab) from a side — won't remove last panel */
    removePanel: (side: Side, idx: number) => void;

    /** Display options (can be set from URL params) */
    viewMode: 'list' | 'thumbs' | 'tree';
    setViewMode: (mode: 'list' | 'thumbs' | 'tree') => void;
    showToolbar: boolean;
    setShowToolbar: (v: boolean) => void;
    allowPanels: boolean;
    setAllowPanels: (v: boolean) => void;
    mode: 'simple' | 'advanced';
    setMode: (v: 'simple' | 'advanced') => void;
    index: boolean;
    setIndex: (v: boolean) => void;

    /** File to auto-select on initial load */
    initialFile?: string;

    initialSearchFullText?: boolean;

    /** Compact toolbar vs Explorer-style ribbon (ribbon hides per-panel FileBrowserToolbar). */
    chrome: FileBrowserChrome;
    setChrome: (c: FileBrowserChrome) => void;
}

const FileBrowserContext = createContext<FileBrowserContextType | undefined>(undefined);

// ── Helpers ──────────────────────────────────────────────────────

let _panelIdCounter = 0;
function nextPanelId(): string {
    return `panel-${++_panelIdCounter}`;
}

function createPanel(overrides?: Partial<PanelState>): PanelState {
    return {
        id: nextPanelId(),
        mount: 'machines',
        path: '/',
        glob: '*.*',
        showFolders: true,
        showExplorer: true,
        showPreview: true,
        searchFullText: false,
        selected: [],
        ...overrides,
    };
}

// ── Provider ─────────────────────────────────────────────────────

export const FileBrowserProvider: React.FC<{
    children: React.ReactNode;
    initialMount?: string;
    initialPath?: string;
    initialViewMode?: 'list' | 'thumbs' | 'tree';
    initialShowToolbar?: boolean;
    initialAllowPanels?: boolean;
    initialMode?: 'simple' | 'advanced';
    initialFile?: string;
    initialIndex?: boolean;
    initialGlob?: string;
    initialShowFolders?: boolean;
    initialShowExplorer?: boolean;
    initialShowPreview?: boolean;
    initialSearchQuery?: string;
    initialSearchFullText?: boolean;
    initialChrome?: FileBrowserChrome;
}> = ({ children, initialMount, initialPath, initialViewMode, initialShowToolbar, initialAllowPanels, initialMode, initialFile, initialIndex,    initialGlob, initialShowFolders, initialShowExplorer, initialShowPreview, initialSearchQuery, initialSearchFullText, initialChrome }) => {
    const [layout, setLayout] = useState<LayoutMode>('single');
    const [linked, setLinked] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'thumbs' | 'tree'>(initialViewMode || 'list');
    const [showToolbar, setShowToolbar] = useState(initialShowToolbar !== undefined ? initialShowToolbar : true);
    const [allowPanels, setAllowPanels] = useState(initialAllowPanels !== undefined ? initialAllowPanels : false);
    const [mode, setMode] = useState<'simple' | 'advanced'>(initialMode || 'simple');
    const [index, setIndex] = useState(initialIndex !== undefined ? initialIndex : true);
    const [leftPanels, setLeftPanels] = useState<PanelState[]>([createPanel({
        ...(initialMount ? { mount: initialMount } : {}),
        ...(initialPath ? { path: initialPath } : {}),
        ...(initialGlob ? { glob: initialGlob } : {}),
        ...(initialShowFolders !== undefined ? { showFolders: initialShowFolders } : {}),
        ...(initialShowExplorer !== undefined ? { showExplorer: initialShowExplorer } : {}),
        ...(initialShowPreview !== undefined ? { showPreview: initialShowPreview } : {}),
        ...(initialSearchQuery ? { searchQuery: initialSearchQuery } : {}),
        ...(initialSearchFullText !== undefined ? { searchFullText: initialSearchFullText } : {}),
    })]);
    const [rightPanels, setRightPanels] = useState<PanelState[]>([createPanel()]);
    const [activeSide, setActiveSide] = useState<Side>('left');
    const [activePanelIdx, setActivePanelIdx] = useState(0);
    const [chrome, setChrome] = useState<FileBrowserChrome>(initialChrome ?? 'toolbar');

    const setActivePanel = useCallback((side: Side, idx: number) => {
        setActiveSide(side);
        setActivePanelIdx(idx);
    }, []);

    const updatePanel = useCallback((side: Side, idx: number, patch: Partial<PanelState>) => {
        const setter = side === 'left' ? setLeftPanels : setRightPanels;
        setter(prev => prev.map((p, i) => i === idx ? { ...p, ...patch } : p));

        // Link mode: left path changes mirror to right's active panel
        if (linked && side === 'left' && patch.path !== undefined) {
            setRightPanels(prev => {
                const rIdx = Math.min(activePanelIdx, prev.length - 1);
                return prev.map((p, i) => i === rIdx ? { ...p, path: patch.path! } : p);
            });
        }
    }, [linked, activePanelIdx]);

    const addPanel = useCallback((side: Side, initial?: Partial<PanelState>) => {
        let newIdx = 0;
        const setter = side === 'left' ? setLeftPanels : setRightPanels;
        setter(prev => {
            const next = [...prev, createPanel(initial)];
            newIdx = next.length - 1;
            return next;
        });
        setActiveSide(side);
        setActivePanelIdx(newIdx);
    }, []);

    const removePanel = useCallback((side: Side, idx: number) => {
        const setter = side === 'left' ? setLeftPanels : setRightPanels;
        setter(prev => {
            if (prev.length <= 1) return prev; // Keep at least one
            const next = prev.filter((_, i) => i !== idx);
            // Adjust active index if needed
            if (side === activeSide && activePanelIdx >= next.length) {
                setActivePanelIdx(next.length - 1);
            }
            return next;
        });
    }, [activeSide, activePanelIdx]);

    const panels = activeSide === 'left' ? leftPanels : rightPanels;
    const activePanel = panels[Math.min(activePanelIdx, panels.length - 1)];

    return (
        <FileBrowserContext.Provider value={{
            layout, setLayout,
            linked, setLinked,
            leftPanels, rightPanels,
            activeSide, activePanelIdx, setActivePanel,
            activePanel,
            updatePanel, addPanel, removePanel,
            viewMode, setViewMode,
            showToolbar, setShowToolbar,
            allowPanels, setAllowPanels,
            mode, setMode,
            index, setIndex,
            initialFile,
            initialSearchFullText,
            chrome,
            setChrome,
        }}>
            {children}
        </FileBrowserContext.Provider>
    );
};

// ── Hook ─────────────────────────────────────────────────────────

export const useFileBrowser = () => {
    const ctx = useContext(FileBrowserContext);
    if (!ctx) throw new Error('useFileBrowser must be used within FileBrowserProvider');
    return ctx;
};

export const useOptionalFileBrowser = () => useContext(FileBrowserContext);
