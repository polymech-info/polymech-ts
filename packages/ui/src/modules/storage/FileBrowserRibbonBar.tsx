import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, HardDrive } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useActionStore } from '@/actions/store';
import { useFileBrowser } from '@/modules/storage/FileBrowserContext';
import { VFS_ACTION_PREFIX, vfsPanelActionStoreSignature, type VfsRibbonTabId } from '@/modules/storage/file-browser-commands';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Action } from '@/actions/types';
import { translate } from '@/i18n';
import { fetchVfsMounts } from '@/modules/storage/client-vfs';

/** Tailwind icon colors aligned with {@link PageRibbonBar} ribbon items. */
function vfsIconColor(action: Action): string {
    const slug = action.id.split('/').pop() ?? '';
    const bySlug: Record<string, string> = {
        'navigate-up': 'text-blue-600 dark:text-blue-400',
        refresh: 'text-sky-600 dark:text-sky-400',
        copy: 'text-purple-600 dark:text-purple-400',
        open: 'text-emerald-600 dark:text-emerald-400',
        download: 'text-teal-600 dark:text-teal-400',
        'download-folder': 'text-cyan-600 dark:text-cyan-400',
        filter: 'text-amber-600 dark:text-amber-400',
        search: 'text-orange-600 dark:text-orange-400',
        'clear-search': 'text-rose-500 dark:text-rose-400',
        'view-list': 'text-blue-600 dark:text-blue-400',
        'view-thumbs': 'text-violet-600 dark:text-violet-400',
        'view-tree': 'text-green-600 dark:text-green-400',
        'toggle-explorer': 'text-indigo-600 dark:text-indigo-400',
        'toggle-preview': 'text-indigo-500 dark:text-indigo-300',
        'zoom-in': 'text-slate-700 dark:text-slate-300',
        'zoom-out': 'text-slate-700 dark:text-slate-300',
        sort: 'text-fuchsia-600 dark:text-fuchsia-400',
        'new-tab': 'text-green-600 dark:text-green-400',
        'dual-layout': 'text-cyan-600 dark:text-cyan-400',
        'single-layout': 'text-slate-600 dark:text-slate-400',
        'link-panes': 'text-orange-600 dark:text-orange-400',
        'app-fullscreen': 'text-sky-600 dark:text-sky-400',
        'open-with-ai': 'text-violet-600 dark:text-violet-400',
    };
    return bySlug[slug] ?? 'text-blue-600 dark:text-blue-400';
}

const RibbonTab = ({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'px-4 py-1 text-sm font-medium transition-all duration-200 border-t-2 border-transparent select-none',
            active
                ? 'dark:bg-slate-800/50 text-primary border-t-blue-500 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)]'
                : 'text-muted-foreground hover:bg-background/40 hover:text-foreground',
        )}
    >
        {children}
    </button>
);

const RibbonGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col h-full border-r border-border/40 px-2 last:border-r-0 relative group">
        <div className="flex-1 flex items-center gap-1 justify-center px-1 min-h-[5.5rem]">
            {children}
        </div>
        <div className="text-[10px] text-center text-muted-foreground/70 uppercase tracking-wider font-semibold select-none pb-1 transition-colors group-hover:text-muted-foreground">
            {label}
        </div>
    </div>
);

const RibbonItemSmall = ({
    icon: Icon,
    label,
    onClick,
    active,
    iconColor,
    disabled = false,
    testId,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick?: () => void;
    active?: boolean;
    iconColor?: string;
    disabled?: boolean;
    testId?: string;
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        data-testid={testId}
        className={cn(
            'flex items-center gap-2 px-2 py-0.5 h-7 w-full text-left rounded-sm transition-colors text-xs font-medium',
            !disabled && 'hover:bg-accent/60',
            active && 'bg-blue-100/40 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300',
            disabled && 'opacity-50 cursor-not-allowed',
        )}
    >
        <Icon className={cn('h-4 w-4 shrink-0 transition-colors', iconColor ?? 'text-foreground')} />
        <span className="truncate pr-1">{label}</span>
    </button>
);

const CompactFlowGroup = ({
    actions,
}: {
    actions: {
        id: string;
        icon: React.ComponentType<{ className?: string }>;
        label: string;
        onClick?: () => void;
        active?: boolean;
        disabled?: boolean;
        iconColor?: string;
        testId?: string;
    }[];
}) => (
        <div className="grid grid-rows-3 grid-flow-col gap-1">
            {actions.map((a) => (
                <RibbonItemSmall
                    key={a.id}
                    icon={a.icon}
                    label={a.label}
                    onClick={a.onClick}
                    active={a.active}
                    disabled={a.disabled}
                    iconColor={a.iconColor}
                    testId={a.testId}
                />
            ))}
        </div>
);

/**
 * Explorer-style ribbon for the active file browser panel.
 * Visual language matches {@link PageRibbonBar}.
 */
const FileBrowserRibbonBar: React.FC = () => {
    const { session } = useAuth();
    const accessToken = session?.access_token;
    const { activePanel, activeSide, activePanelIdx, updatePanel, leftPanels, rightPanels } = useFileBrowser();
    const [availableMounts, setAvailableMounts] = useState<string[]>([]);

    useEffect(() => {
        void fetchVfsMounts({ accessToken }).then(setAvailableMounts);
    }, [accessToken]);

    const panelIdx = useMemo(() => {
        const panels = activeSide === 'left' ? leftPanels : rightPanels;
        return Math.min(activePanelIdx, Math.max(0, panels.length - 1));
    }, [activeSide, activePanelIdx, leftPanels, rightPanels]);

    const onSelectMount = (m: string) => {
        updatePanel(activeSide, panelIdx, { mount: m, path: '/' });
    };

    const vfsRibbonSig = useActionStore((s) =>
        vfsPanelActionStoreSignature(s.actions, activePanel.id, 'Ribbon'),
    );
    const [tab, setTab] = useState<VfsRibbonTabId>('home');

    const panelPrefix = `${VFS_ACTION_PREFIX}/${activePanel.id}/`;

    const panelActions = useMemo(() => {
        return Object.values(useActionStore.getState().actions).filter(
            (a) =>
                a.id.startsWith(panelPrefix) &&
                a.visibilities?.Ribbon !== false &&
                (a.metadata?.ribbonTab as VfsRibbonTabId | undefined) === tab,
        );
    }, [panelPrefix, tab, vfsRibbonSig]);

    const groups = useMemo(() => {
        const byGroup = new Map<string, Action[]>();
        for (const a of panelActions) {
            const g = a.group || 'Other';
            if (!byGroup.has(g)) byGroup.set(g, []);
            byGroup.get(g)!.push(a);
        }
        return Array.from(byGroup.entries()).sort(([a], [b]) => a.localeCompare(b));
    }, [panelActions]);

    return (
        <div className="flex flex-col w-full border-b shadow-sm shrink-0 z-40" data-testid="file-browser-ribbon">
            <div className="flex items-center border-b bg-muted/90 backdrop-blur-sm">
                <div className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold tracking-widest shadow-sm">
                    {translate('FILES')}
                </div>
                <div className="flex-1 flex overflow-x-auto scrollbar-none pl-2">
                    <RibbonTab active={tab === 'home'} onClick={() => setTab('home')}>
                        {translate('HOME')}
                    </RibbonTab>
                    <RibbonTab active={tab === 'view'} onClick={() => setTab('view')}>
                        {translate('VIEW')}
                    </RibbonTab>
                </div>
            </div>

            <div className="min-h-[7.5rem] flex items-stretch backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-inner px-0 overflow-x-auto scrollbar-custom">
                {availableMounts.length > 1 && (
                    <RibbonGroup label={translate('Mount')}>
                        <div className="flex flex-col items-center justify-center w-full min-w-[7rem] px-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        id="fb-mount-trigger"
                                        title={translate('Switch mount')}
                                        className={cn(
                                            'flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-border/60 bg-background/80',
                                            'text-xs font-semibold hover:bg-accent/60 transition-colors max-w-[200px] w-full justify-center',
                                        )}
                                    >
                                        <HardDrive className="h-3.5 w-3.5 shrink-0 opacity-80" />
                                        <span className="truncate">{activePanel.mount}</span>
                                        <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="min-w-[160px] z-[250]">
                                    {availableMounts.map((m) => (
                                        <DropdownMenuItem
                                            key={m}
                                            onClick={() => onSelectMount(m)}
                                            className={cn(m === activePanel.mount && 'font-semibold bg-accent')}
                                        >
                                            <HardDrive className="h-3 w-3 mr-2 opacity-60" />
                                            {m}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </RibbonGroup>
                )}
                {groups.length === 0 ? (
                    <div className="flex items-center px-4 text-xs text-muted-foreground">No commands for this tab.</div>
                ) : (
                    groups.map(([groupName, items]) => (
                        <RibbonGroup key={groupName} label={groupName.replace(/^VFS · /, '')}>
                            <CompactFlowGroup
                                actions={items.map((action) => {
                                    const Icon = action.icon;
                                    const testId = action.metadata?.testId as string | undefined;
                                    const active = action.metadata?.active === true;
                                    return {
                                        id: action.id,
                                        icon: Icon,
                                        label: action.label,
                                        onClick: () => {
                                            void action.handler?.();
                                        },
                                        active,
                                        disabled: action.disabled,
                                        iconColor: vfsIconColor(action),
                                        testId,
                                    };
                                })}
                            />
                        </RibbonGroup>
                    ))
                )}
            </div>
        </div>
    );
};

export default FileBrowserRibbonBar;
