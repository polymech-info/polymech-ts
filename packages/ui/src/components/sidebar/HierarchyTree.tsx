
import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Box, LayoutGrid, Layers, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LayoutContainer, AnyContainer, WidgetInstance } from '@/modules/layout/LayoutManager';
import { widgetRegistry } from '@/lib/widgetRegistry';
import { useLayout } from '@/modules/layout/LayoutContext';

interface HierarchyNodeProps {
    label: string;
    icon: any;
    isSelected: boolean;
    onClick: (e: React.MouseEvent) => void;
    children?: React.ReactNode;
    defaultExpanded?: boolean;
    depth?: number;
    hasChildren?: boolean;
    onToggleExpand?: () => void;
    isExpanded?: boolean;
    onSettings?: (e: React.MouseEvent) => void;
}

const TreeNode = ({
    label,
    icon: Icon,
    isSelected,
    onClick,
    children,
    depth = 0,
    hasChildren = false,
    onToggleExpand,
    isExpanded = false,
    onSettings
}: HierarchyNodeProps) => {

    return (
        <div className="select-none">
            <div
                className={cn(
                    "flex items-center gap-1.5 py-1 pr-2 cursor-pointer hover:bg-muted/50 transition-colors text-sm rounded-sm group",
                    isSelected && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium"
                )}
                style={{ paddingLeft: `${depth * 12 + 4}px` }}
                onClick={onClick}
            >
                <div
                    className={cn(
                        "p-0.5 rounded transition-colors flex items-center justify-center w-5 h-5",
                        hasChildren ? "hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer" : "opacity-0 pointer-events-none"
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand?.();
                    }}
                >
                    {hasChildren && (
                        isExpanded ? <ChevronDown className="h-3 w-3 opacity-50" /> : <ChevronRight className="h-3 w-3 opacity-50" />
                    )}
                </div>

                <Icon className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "opacity-100" : "opacity-60")} />
                <span className="truncate text-xs flex-1">{label}</span>

                {onSettings && (
                    <div
                        role="button"
                        className={cn(
                            "opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-sm hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground",
                            isSelected && "opacity-70 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800"
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSettings(e);
                        }}
                    >
                        <Settings className="h-3 w-3" />
                    </div>
                )}
            </div>
            {hasChildren && isExpanded && (
                <div>{children}</div>
            )}
        </div>
    );
};

interface HierarchyTreeProps {
    containers: AnyContainer[];
    selectedWidgetId?: string | null;
    selectedContainerId?: string | null;
    onSelectWidget: (id: string) => void;
    onSelectContainer: (id: string) => void;
    onSettingsClick?: (id: string, type: 'widget' | 'container', layoutId: string) => void;
    layoutId: string;
}

export const HierarchyTree = ({
    containers,
    selectedWidgetId,
    selectedContainerId,
    onSelectWidget,
    onSelectContainer,
    onSettingsClick,
    layoutId
}: HierarchyTreeProps) => {

    // Manage expansion state locally
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    const { loadedPages, loadPageLayout } = useLayout();
    const requestedLayoutsRef = React.useRef<Set<string>>(new Set());

    // Traverse and load nested layouts
    React.useEffect(() => {
        const checkAndLoadLayouts = (items: AnyContainer[]) => {
            items.forEach(c => {
                c.widgets.forEach(w => {
                    const def = widgetRegistry.get(w.widgetId);
                    const nestedLayouts = def?.getNestedLayouts?.(w.props || {}) || [];

                    nestedLayouts.forEach(layoutInfo => {
                        if (layoutInfo.layoutId && !loadedPages.has(layoutInfo.layoutId) && !requestedLayoutsRef.current.has(layoutInfo.layoutId)) {
                            requestedLayoutsRef.current.add(layoutInfo.layoutId);
                            loadPageLayout(layoutInfo.layoutId, layoutInfo.label).catch(console.error);
                        }
                    });
                });
                if (c.type === 'container' && c.children) checkAndLoadLayouts(c.children);
            });
        };
        if (containers) checkAndLoadLayouts(containers);
    }, [containers, loadedPages, loadPageLayout]);

    // Auto-expand all containers on load/change
    React.useEffect(() => {
        const allIds = new Set<string>();
        const traverse = (items: AnyContainer[]) => {
            items.forEach(c => {
                allIds.add(c.id);
                // Also expand widgets with children (nested layouts)
                c.widgets.forEach(w => {
                    const def = widgetRegistry.get(w.widgetId);
                    const nestedLayouts = def?.getNestedLayouts?.(w.props || {}) || [];
                    if (nestedLayouts.length > 0) {
                        allIds.add(w.id);
                    }
                });

                if (c.type === 'container' && c.children) traverse(c.children);
            });
        };
        if (containers) traverse(containers);
        setExpandedNodes(prev => {
            const next = new Set(prev);
            allIds.forEach(id => next.add(id));
            return next;
        });
    }, [containers]);

    const toggleNode = (id: string) => {
        const next = new Set(expandedNodes);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setExpandedNodes(next);
    };

    // Auto-expand path to selection would be nice, but simple toggle for now



    const renderWidget = (widget: WidgetInstance, depth: number, currentLayoutId: string) => {
        const def = widgetRegistry.get(widget.widgetId);
        const name = def?.metadata.name || widget.widgetId;
        const Icon = def?.metadata.icon || Box;
        const isExpanded = expandedNodes.has(widget.id);

        // Check for nested layouts via registry definition
        let nestedItems: React.ReactNode = null;
        let hasChildren = false;

        const nestedLayouts = def?.getNestedLayouts?.(widget.props || {}) || [];

        if (nestedLayouts.length > 0) {
            hasChildren = true;
            nestedItems = nestedLayouts.map(layoutInfo => {
                const nestedLayoutId = layoutInfo.layoutId;
                const layout = loadedPages.get(nestedLayoutId);
                const expansionKey = nestedLayoutId || layoutInfo.id;
                const isTabExpanded = expandedNodes.has(expansionKey);

                return (
                    <TreeNode
                        key={expansionKey}
                        label={layoutInfo.label}
                        icon={Layers}
                        isSelected={false}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleNode(expansionKey);
                        }}
                        depth={depth + 1}
                        hasChildren={true}
                        isExpanded={isTabExpanded}
                        onToggleExpand={() => toggleNode(expansionKey)}
                        onSettings={(e) => {
                            e.stopPropagation();
                            if (onSettingsClick) {
                                // Select parent widget (in current layout)
                                onSettingsClick(widget.id, 'widget', currentLayoutId);
                            } else {
                                onSelectWidget(widget.id);
                            }
                        }}
                    >
                        {!layout ? (
                            <div className="py-1 px-2 text-xs text-muted-foreground opacity-50" style={{ paddingLeft: `${(depth + 2) * 12 + 4}px` }}>
                                (loading...)
                            </div>
                        ) : (
                            layout.containers.map(c => renderContainer(c, depth + 2, nestedLayoutId))
                        )}
                    </TreeNode>
                );
            });
        }

        // Generic 'layout-container' widget support if it exists and works similarly?
        // For now just tabs.

        return (
            <TreeNode
                key={widget.id}
                label={name}
                icon={Icon}
                isSelected={selectedWidgetId === widget.id}
                onClick={(e) => {
                    e.stopPropagation();
                    // If it's a tab widget, we might want to select it.
                    // But if we click a nested widget, onSelectWidget is called with that ID.
                    onSelectWidget(widget.id);
                }}
                depth={depth}
                hasChildren={hasChildren}
                isExpanded={isExpanded}
                onToggleExpand={() => toggleNode(widget.id)}
                onSettings={(e) => {
                    e.stopPropagation();
                    if (onSettingsClick) {
                        onSettingsClick(widget.id, 'widget', currentLayoutId);
                    } else {
                        onSelectWidget(widget.id);
                    }
                }}
            >
                {/* Render Nested Content */}
                {isExpanded && nestedItems}
            </TreeNode>
        );
    };

    const renderContainer = (container: AnyContainer, depth: number, currentLayoutId: string) => {
        const isLayoutCont = container.type === 'container';
        const lc = isLayoutCont ? container as LayoutContainer : null;
        const title = container.settings?.title
            || (isLayoutCont ? `Container (${lc!.columns} col)` : `Flex Container (${(container as any).rows?.length || 0} rows)`);
        const childrenCount = lc ? lc.children.length : 0;
        const hasChildren = container.widgets.length > 0 || childrenCount > 0;
        const isExpanded = expandedNodes.has(container.id);

        return (
            <React.Fragment key={container.id}>
                <TreeNode
                    label={title}
                    icon={LayoutGrid}
                    isSelected={selectedContainerId === container.id}
                    onClick={() => onSelectContainer(container.id)}
                    depth={depth}
                    hasChildren={hasChildren}
                    isExpanded={isExpanded}
                    onToggleExpand={() => toggleNode(container.id)}
                    onSettings={(e) => {
                        e.stopPropagation();
                        if (onSettingsClick) {
                            onSettingsClick(container.id, 'container', currentLayoutId);
                        } else {
                            onSelectContainer(container.id);
                        }
                    }}
                >
                    {/* Render Content */}
                    {isExpanded && (
                        <>
                            {container.widgets.map(w => renderWidget(w, depth + 1, currentLayoutId))}
                            {lc && lc.children.map(c => renderContainer(c, depth + 1, currentLayoutId))}
                        </>
                    )}
                </TreeNode>
            </React.Fragment>
        );
    };

    if (!containers || containers.length === 0) {
        return (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <LayoutGrid className="h-8 w-8 opacity-20" />
                <p>No layout elements</p>
            </div>
        );
    }

    return (
        <div className="pb-2">
            {containers.map(c => renderContainer(c, 0, layoutId))}
        </div>
    );
};
