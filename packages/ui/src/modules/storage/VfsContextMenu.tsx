import React, { useMemo } from 'react';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuLabel,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type { Action } from '@/actions/types';
import { cn } from '@/lib/utils';

function groupActions(actions: Action[]): [string, Action[]][] {
    const m = new Map<string, Action[]>();
    for (const a of actions) {
        const g = a.group || 'Other';
        if (!m.has(g)) m.set(g, []);
        m.get(g)!.push(a);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
}

/**
 * Wraps a file row / tile so a right-click opens the same VFS commands as the ribbon
 * (actions with {@link Action.visibilities}.ContextMenu), after {@link onBeforeOpen} runs.
 */
export function VfsContextMenuRow({
    actions,
    onBeforeOpen,
    children,
}: {
    actions: Action[];
    onBeforeOpen: () => void;
    children: React.ReactElement;
}) {
    const grouped = useMemo(() => groupActions(actions), [actions]);

    if (!actions.length) {
        return children;
    }

    return (
        <ContextMenu onOpenChange={(open) => { if (open) onBeforeOpen(); }}>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent className="max-h-[min(70vh,480px)] overflow-y-auto z-[200]">
                {grouped.map(([group, items], gi) => (
                    <React.Fragment key={group}>
                        {gi > 0 && <ContextMenuSeparator />}
                        <ContextMenuLabel className="text-[11px] text-muted-foreground font-medium normal-case tracking-normal">
                            {group.replace(/^VFS · /, '')}
                        </ContextMenuLabel>
                        {items.map((action) => {
                            const Icon = action.icon;
                            return (
                                <ContextMenuItem
                                    key={action.id}
                                    disabled={action.disabled}
                                    data-testid={action.metadata?.testId as string | undefined}
                                    onSelect={() => { void action.handler?.(); }}
                                    className={cn(action.metadata?.active && 'bg-accent/70')}
                                >
                                    {Icon ? <Icon className="mr-2 h-4 w-4 shrink-0" /> : null}
                                    {action.label}
                                </ContextMenuItem>
                            );
                        })}
                    </React.Fragment>
                ))}
            </ContextMenuContent>
        </ContextMenu>
    );
}
