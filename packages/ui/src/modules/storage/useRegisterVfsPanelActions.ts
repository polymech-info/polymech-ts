import { useEffect } from 'react';
import {
    ArrowUp,
    RefreshCw,
    Copy,
    FolderOpen,
    Download,
    Filter,
    Search,
    X,
    List,
    LayoutGrid,
    Network,
    ZoomIn,
    ZoomOut,
    PanelLeft,
    PanelRight,
    ArrowUpDown,
    Plus,
    Columns2,
    Square,
    Link,
    Unlink,
    Maximize2,
    Minimize2,
    Wand2,
} from 'lucide-react';
import { useActionStore } from '@/actions/store';
import type { Action } from '@/actions/types';
import {
    vfsPanelActionId,
    vfsActionTestId,
    VfsActionSlug,
    type VfsRibbonTabId,
} from '@/modules/storage/file-browser-commands';
import type { SortKey } from '@/modules/storage/types';
import { translate } from '@/i18n';

export interface VfsPanelActionSpec {
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

    /** Multi-tab / layout — ribbon-only on desktop when `allowPanels`; no duplicate LayoutToolbar. */
    allowPanels?: boolean;
    addNewTab?: () => void;
    switchToDualLayout?: () => void;
    switchToSingleLayout?: () => void;
    toggleLinkedPanes?: () => void;
    linked?: boolean;
    layout?: 'single' | 'dual';

    /** In-app fullscreen (app shell hidden) — not browser Fullscreen API */
    fileBrowserImmersive?: boolean;
    toggleFileBrowserImmersive?: () => void;

    /** When set, registers “Open with AI” for image selection (`vfsSelectionToWizardImages`). */
    canOpenWithAi?: boolean;
    openWithAi?: () => void;
}

function reg(
    panelId: string,
    slug: string,
    label: string,
    group: string,
    icon: Action['icon'],
    handler: () => void,
    opts: { disabled?: boolean; ribbonTab: VfsRibbonTabId; active?: boolean },
): Action {
    const id = vfsPanelActionId(panelId, slug);
    return {
        id,
        label,
        group,
        icon,
        handler,
        disabled: opts.disabled,
        visibilities: { Ribbon: true, ContextMenu: true },
        metadata: {
            testId: vfsActionTestId(slug),
            ribbonTab: opts.ribbonTab,
            ...(opts.active !== undefined ? { active: opts.active } : {}),
        },
    };
}

/**
 * Registers Zustand {@link Action}s for one panel (prefix `vfs/panel/<panelId>/`).
 * Re-registers when `spec` changes (pass a memoized spec from the panel).
 */
export function useRegisterVfsPanelActions(panelId: string | undefined, enabled: boolean, spec: VfsPanelActionSpec): void {
    useEffect(() => {
        if (!panelId || !enabled) return;

        const { registerAction, unregisterAction } = useActionStore.getState();

        const ids: string[] = [];
        const push = (a: Action) => {
            ids.push(a.id);
            registerAction(a);
        };

        push(
            reg(panelId, VfsActionSlug.navigateUp, 'Up', 'VFS · Navigate', ArrowUp, spec.goUp, {
                disabled: !spec.canGoUp,
                ribbonTab: 'home',
            }),
        );
        push(
            reg(panelId, VfsActionSlug.refresh, 'Refresh', 'VFS · Navigate', RefreshCw, spec.refresh, {
                ribbonTab: 'home',
            }),
        );
        push(
            reg(panelId, VfsActionSlug.copy, 'Copy', 'VFS · Clipboard', Copy, spec.copy, {
                disabled: !spec.canCopy,
                ribbonTab: 'home',
            }),
        );
        if (spec.allowPanels && spec.switchToSingleLayout) {
            push(
                reg(panelId, VfsActionSlug.singleLayout, 'Single', 'VFS · Layout', Square, spec.switchToSingleLayout, {
                    disabled: spec.layout === 'single',
                    ribbonTab: 'home',
                }),
            );
        }
        if (spec.allowPanels && spec.switchToDualLayout) {
            push(
                reg(panelId, VfsActionSlug.dualLayout, 'Dual', 'VFS · Layout', Columns2, spec.switchToDualLayout, {
                    disabled: spec.layout === 'dual',
                    ribbonTab: 'home',
                }),
            );
        }
        if (spec.allowPanels && spec.toggleLinkedPanes) {
            const LinkIcon = spec.linked ? Unlink : Link;
            push(
                reg(
                    panelId,
                    VfsActionSlug.linkPanes,
                    spec.linked ? 'Linked' : 'Link',
                    'VFS · Layout',
                    LinkIcon,
                    spec.toggleLinkedPanes,
                    {
                        disabled: spec.layout !== 'dual',
                        ribbonTab: 'home',
                        active: spec.linked === true,
                    },
                ),
            );
        }
        if (spec.allowPanels && spec.addNewTab) {
            push(
                reg(panelId, VfsActionSlug.newTab, 'New tab', 'VFS · Layout', Plus, spec.addNewTab, {
                    ribbonTab: 'home',
                }),
            );
        }
        if (spec.toggleFileBrowserImmersive) {
            const FsIcon = spec.fileBrowserImmersive ? Minimize2 : Maximize2;
            push(
                reg(
                    panelId,
                    VfsActionSlug.appFullscreen,
                    spec.fileBrowserImmersive ? 'Exit full screen' : 'Full screen',
                    'VFS · Window',
                    FsIcon,
                    spec.toggleFileBrowserImmersive,
                    {
                        ribbonTab: 'home',
                        active: spec.fileBrowserImmersive === true,
                    },
                ),
            );
        }
        if (spec.openWithAi) {
            push(
                reg(
                    panelId,
                    VfsActionSlug.openWithAi,
                    translate('Open with AI'),
                    'VFS · AI',
                    Wand2,
                    spec.openWithAi,
                    {
                        disabled: !spec.canOpenWithAi,
                        ribbonTab: 'home',
                    },
                ),
            );
        }
        push(
            reg(panelId, VfsActionSlug.open, 'Open', 'VFS · Open', FolderOpen, spec.openSelected, {
                disabled: !spec.canOpen,
                ribbonTab: 'home',
            }),
        );
        push(
            reg(panelId, 'download', 'Download', 'VFS · Open', Download, spec.download, {
                disabled: !spec.allowDownload,
                ribbonTab: 'home',
            }),
        );
        if (spec.downloadFolder) {
            push(
                reg(panelId, 'download-folder', 'Download folder', 'VFS · Open', Download, spec.downloadFolder, {
                    disabled: !spec.allowDownload,
                    ribbonTab: 'home',
                }),
            );
        }
        push(
            reg(panelId, VfsActionSlug.filter, 'Filter', 'VFS · Organize', Filter, spec.openFilter, {
                ribbonTab: 'home',
            }),
        );
        push(
            reg(panelId, VfsActionSlug.search, 'Search', 'VFS · Organize', Search, spec.openSearch, {
                ribbonTab: 'home',
            }),
        );
        push(
            reg(panelId, VfsActionSlug.clearSearch, 'Clear search', 'VFS · Organize', X, spec.clearSearch, {
                disabled: !spec.isSearchMode,
                ribbonTab: 'home',
            }),
        );

        push(
            reg(panelId, VfsActionSlug.viewList, 'List', 'VFS · Layout', List, () => spec.setViewMode('list'), {
                ribbonTab: 'view',
                active: spec.viewMode === 'list',
            }),
        );
        push(
            reg(panelId, VfsActionSlug.viewThumbs, 'Thumbnails', 'VFS · Layout', LayoutGrid, () => spec.setViewMode('thumbs'), {
                ribbonTab: 'view',
                active: spec.viewMode === 'thumbs',
            }),
        );
        push(
            reg(panelId, VfsActionSlug.viewTree, 'Tree', 'VFS · Layout', Network, () => spec.setViewMode('tree'), {
                ribbonTab: 'view',
                active: spec.viewMode === 'tree',
            }),
        );
        push(
            reg(panelId, VfsActionSlug.toggleExplorer, 'Explorer pane', 'VFS · Side panes', PanelLeft, spec.toggleExplorer, {
                ribbonTab: 'view',
                active: spec.showExplorer,
            }),
        );
        push(
            reg(panelId, VfsActionSlug.togglePreview, 'Preview pane', 'VFS · Side panes', PanelRight, spec.togglePreview, {
                ribbonTab: 'view',
                active: spec.showPreview,
            }),
        );
        push(
            reg(panelId, VfsActionSlug.zoomIn, 'Zoom in', 'VFS · Zoom', ZoomIn, spec.zoomIn, { ribbonTab: 'view' }),
        );
        push(
            reg(panelId, VfsActionSlug.zoomOut, 'Zoom out', 'VFS · Zoom', ZoomOut, spec.zoomOut, { ribbonTab: 'view' }),
        );
        push(
            reg(panelId, VfsActionSlug.sort, 'Sort', 'VFS · Sort', ArrowUpDown, spec.cycleSort, { ribbonTab: 'view' }),
        );

        return () => {
            const { unregisterAction: unreg } = useActionStore.getState();
            ids.forEach((id) => unreg(id));
        };
    }, [panelId, enabled, spec]);
}
