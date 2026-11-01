import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
    FlexibleContainer,
    RowDef,
    ColumnDef,
    WidgetInstance,
} from '@/modules/layout/LayoutManager';
import { widgetRegistry } from '@/lib/widgetRegistry';
import { useLayout } from '@/modules/layout/LayoutContext';
import CollapsibleSection from '@/components/CollapsibleSection';

// ---------------------------------------------------------------------------
//  Helpers (shared with edit — kept small, duplicated for bundle isolation)
// ---------------------------------------------------------------------------

export function columnsToGridTemplate(columns: ColumnDef[]): string {
    return columns
        .map(c => {
            switch (c.unit) {
                case 'fr': return `${c.width}fr`;
                case 'px': return `${c.width}px`;
                case 'rem': return `${c.width}rem`;
                case '%': return `${c.width}%`;
                default: return `${c.width}fr`;
            }
        })
        .join(' ');
}

export function getRowAlignItems(sizing?: 'constrained' | 'unconstrained'): string {
    return sizing === 'unconstrained' ? 'items-start' : 'items-stretch';
}

// ---------------------------------------------------------------------------
//  View-only widget item
// ---------------------------------------------------------------------------

interface FlexWidgetViewProps {
    widget: WidgetInstance;
    pageId: string;
    contextVariables?: Record<string, any>;
    pageContext?: Record<string, any>;
}

const FlexWidgetView: React.FC<FlexWidgetViewProps> = ({ widget, pageId, contextVariables, pageContext }) => {
    const { updateWidgetProps } = useLayout();
    const widgetDef = widgetRegistry.get(widget.widgetId);
    if (!widgetDef) return null;

    const Component = widgetDef.component;

    return (
        <div className="relative p-4 flex-1 h-full min-h-0 flex flex-col">
            <Component
                {...(widget.props || {})}
                className="flex-1 h-full flex flex-col min-h-0"
                widgetInstanceId={widget.id}
                widgetDefId={widget.widgetId}
                variables={{
                    ...(contextVariables || {}),
                    ...(widget.props?.variables || {}),
                }}
                pageContext={pageContext}
                isEditMode={false}
                isEditing={false}
                onPropsChange={async (newProps: Record<string, any>) => {
                    try {
                        await updateWidgetProps(pageId, widget.id, newProps);
                    } catch (e) {
                        console.error('Failed to update widget props', e);
                    }
                }}
                onSave={() => { }}
            />
        </div>
    );
};

// ---------------------------------------------------------------------------
//  Props (the view-only subset)
// ---------------------------------------------------------------------------

export interface FlexContainerViewProps {
    container: FlexibleContainer;
    isEditMode: boolean;
    pageId: string;
    isCompactMode?: boolean;
    contextVariables?: Record<string, any>;
    pageContext?: Record<string, any>;
}

// ---------------------------------------------------------------------------
//  Main View Component
// ---------------------------------------------------------------------------

const FlexContainerView: React.FC<FlexContainerViewProps> = ({
    container,
    pageId,
    isCompactMode,
    contextVariables,
    pageContext,
}) => {
    // ------- Widget grouping: per row + column -------
    const widgetsByCell = useMemo(() => {
        const map = new Map<string, WidgetInstance[]>();
        for (const row of container.rows) {
            for (let colIdx = 0; colIdx < row.columns.length; colIdx++) {
                const key = `${row.id}:${colIdx}`;
                map.set(key, []);
            }
        }
        for (const w of container.widgets) {
            if (w.rowId && w.column !== undefined) {
                const key = `${w.rowId}:${w.column}`;
                const list = map.get(key);
                if (list) list.push(w);
            }
        }
        for (const list of map.values()) {
            list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        }
        return map;
    }, [container.rows, container.widgets]);

    // ------- Render a single row -------
    const renderRow = (row: RowDef) => {
        const gridTemplate = columnsToGridTemplate(row.columns);
        const alignClass = getRowAlignItems(row.sizing);

        return (
            <div key={row.id}>
                <div
                    className={cn('grid min-w-0 max-md:!grid-cols-1', alignClass)}
                    style={{
                        gridTemplateColumns: gridTemplate,
                        gap: `${row.gap ?? container.gap}px`,
                    }}
                >
                    {row.columns.map((_col, colIdx) => {
                        const key = `${row.id}:${colIdx}`;
                        const cellWidgets = widgetsByCell.get(key) || [];

                        return (
                            <div
                                key={`${row.id}-col-${colIdx}`}
                                className={cn(
                                    'min-h-[40px] min-w-0 flex flex-col gap-2',
                                    row.padding || '',
                                )}
                            >
                                {cellWidgets.map(w => (
                                    <FlexWidgetView
                                        key={w.id}
                                        widget={w}
                                        pageId={pageId}
                                        contextVariables={contextVariables}
                                        pageContext={pageContext}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // ------- Container wrapper -------
    const title = container.settings?.title || 'Flexible Container';
    const showTitle = container.settings?.showTitle;
    const isCollapsible = container.settings?.collapsible;
    const enabled = container.settings?.enabled !== false;

    if (!enabled) return null;

    const containerContent = (
        <div
            className={cn(
                'relative min-w-0',
                container.settings?.customClassName,
            )}
        >
            <div className="flex flex-col" style={{ gap: `${container.gap}px` }}>
                {container.rows.map(row => renderRow(row))}
            </div>
        </div>
    );

    if (isCollapsible && showTitle) {
        return (
            <CollapsibleSection
                title={title}
                initiallyOpen={!container.settings?.collapsed}
            >
                {containerContent}
            </CollapsibleSection>
        );
    }

    if (showTitle && !isCompactMode) {
        return (
            <div>
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">{title}</h3>
                {containerContent}
            </div>
        );
    }

    return containerContent;
};

export default FlexContainerView;
