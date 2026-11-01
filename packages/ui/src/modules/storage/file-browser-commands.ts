import type { LucideIcon } from 'lucide-react';
import type { Action } from '@/actions/types';
import type { SortKey } from '@/modules/storage/types';

/**
 * Zustand {@link Action} ids — use {@link vfsPanelActionId} so paths stay consistent.
 *
 * **Testing:**
 * - Store `id` includes `panelId` → unique per panel; use `getActionsByPath(\`vfs/panel/${id}/\`)` in unit tests when you control the panel id.
 * - **E2E:** prefer stable **`data-testid`** on ribbon/context items using {@link vfsActionTestId} (no panel segment) so selectors do not depend on dynamic panel ids.
 */
export const VFS_ACTION_PREFIX = 'vfs/panel' as const;

/** Stable slug (last path segment) for each command — use in tests and {@link vfsPanelActionId}. */
export const VfsActionSlug = {
    navigateUp: 'navigate-up',
    refresh: 'refresh',
    open: 'open',
    download: 'download',
    copy: 'copy',
    sort: 'sort',
    viewList: 'view-list',
    viewThumbs: 'view-thumbs',
    viewTree: 'view-tree',
    zoomIn: 'zoom-in',
    zoomOut: 'zoom-out',
    toggleExplorer: 'toggle-explorer',
    togglePreview: 'toggle-preview',
    filter: 'filter',
    search: 'search',
    clearSearch: 'clear-search',
    /** Krusader-style: new tab on this side, cloned from current folder */
    newTab: 'new-tab',
    /** Switch file browser to dual-pane layout */
    dualLayout: 'dual-layout',
    /** Back to single-pane layout */
    singleLayout: 'single-layout',
    /** Mirror left navigation to right pane (dual mode) */
    linkPanes: 'link-panes',
    /** In-app fullscreen: hide app nav/footer for the file browser shell */
    appFullscreen: 'app-fullscreen',
    /** Open selected image(s) in the AI Image Wizard (VFS provenance in `ImageFile.meta`) */
    openWithAi: 'open-with-ai',
} as const;

export type VfsActionSlugKey = keyof typeof VfsActionSlug;

/** Full action id in the global store (unique per panel). */
export function vfsPanelActionId(panelId: string, slug: string): string {
    return `${VFS_ACTION_PREFIX}/${panelId}/${slug}`;
}

/**
 * Stable `data-testid` for DOM (ribbon, menus) — **no** panelId, safe for e2e.
 * Pattern: `vfs-action-<slug>`
 */
export function vfsActionTestId(slug: string): string {
    return `vfs-action-${slug.replace(/[^a-z0-9-]/gi, '_')}`;
}

/**
 * Primitive signature for Zustand selectors — subscribe to this instead of the full `actions` map
 * so unrelated store updates and register/unregister cycles do not re-render every consumer.
 */
export function vfsPanelActionStoreSignature(
    actions: Record<string, Action>,
    panelId: string,
    visibility: 'Ribbon' | 'ContextMenu',
): string {
    const prefix = `${VFS_ACTION_PREFIX}/${panelId}/`;
    return Object.values(actions)
        .filter((a) => {
            if (!a.id.startsWith(prefix)) return false;
            if (visibility === 'Ribbon') return a.visibilities?.Ribbon !== false;
            return a.visibilities?.ContextMenu !== false;
        })
        .map(
            (a) =>
                `${a.id}:${String(a.disabled)}:${String(a.metadata?.active ?? '')}:${String(a.metadata?.ribbonTab ?? '')}`,
        )
        .sort()
        .join('|');
}

/** Which ribbon tab an action belongs to (Explorer-style Home vs View). */
export type VfsRibbonTabId = 'home' | 'view';

/**
 * Command surface for the active file browser panel — consumed by {@link FileBrowserRibbonBar}
 * and (later) context menus and plugin automation. Keep fields stable; extend with optional blocks.
 */
export interface FileBrowserPanelCommandApi {
    panelId: string;
    mount: string;
    path: string;
    selectionCount: number;

    canGoUp: boolean;
    goUp: () => void;
    refresh: () => void;

    canOpen: boolean;
    openSelected: () => void;

    allowDownload: boolean;
    download: () => void;
    downloadFolder?: () => void;

    canCopy: boolean;
    copy: () => void;

    sortBy: SortKey;
    sortAsc: boolean;
    cycleSort: () => void;

    viewMode: 'list' | 'thumbs' | 'tree';
    setViewMode: (m: 'list' | 'thumbs' | 'tree') => void;

    zoomIn: () => void;
    zoomOut: () => void;

    showExplorer: boolean;
    toggleExplorer: () => void;
    showPreview: boolean;
    togglePreview: () => void;

    openFilter: () => void;
    openSearch: () => void;
    isSearchMode: boolean;
    clearSearch: () => void;
}

/** Future: extension commands (open-with, automation pipes) keyed by group id */
export interface FileBrowserPluginCommand {
    id: string;
    label: string;
    icon?: LucideIcon;
    /** Ribbon group id, e.g. "automate" | "open-with" */
    group: string;
    order?: number;
    disabled?: boolean;
    run: (api: FileBrowserPanelCommandApi) => void | Promise<void>;
}
