import React, { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Trash2, ArrowUp, ArrowDown, Settings, GripVertical, Copy } from 'lucide-react';
import { WidgetMovementControls } from '@/components/widgets/WidgetMovementControls';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import {
    FlexibleContainer,
    RowDef,
    ColumnDef,
    WidgetInstance,
    UnifiedLayoutManager
} from '@/modules/layout/LayoutManager';
import { widgetRegistry } from '@/lib/widgetRegistry';
import { useLayout } from '@/modules/layout/LayoutContext';
import {
    FlexAddRowCommand,
    FlexRemoveRowCommand,
    FlexAddColumnCommand,
    FlexRemoveColumnCommand,
    FlexSetColumnsPresetCommand,
    FlexMoveRowCommand,
    FlexSetRowSizingCommand,
    FlexSetRowPaddingCommand,
    FlexDuplicateRowCommand,
    FlexDuplicateColumnCommand,
    MoveWidgetCommand
} from '@/modules/layout/commands';
import CollapsibleSection from '@/components/CollapsibleSection';
import { WidgetSettingsManager } from '@/components/widgets/WidgetSettingsManager';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

// Re-use the pure helpers (duplicated to keep bundle isolation)
import { columnsToGridTemplate, getRowAlignItems } from './FlexContainerView';

// ---------------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------------

const PADDING_PRESETS = [
    { label: 'None', value: '' },
    { label: 'XS', value: 'p-1' },
    { label: 'SM', value: 'p-2' },
    { label: 'MD', value: 'p-4' },
    { label: 'LG', value: 'p-6' },
    { label: 'XL', value: 'p-8' },
];

const COLUMN_PRESETS: { label: string; columns: ColumnDef[] }[] = [
    { label: '1 col', columns: [{ width: 1, unit: 'fr' }] },
    { label: '50 / 50', columns: [{ width: 1, unit: 'fr' }, { width: 1, unit: 'fr' }] },
    { label: '33 / 33 / 33', columns: [{ width: 1, unit: 'fr' }, { width: 1, unit: 'fr' }, { width: 1, unit: 'fr' }] },
    { label: '25 \u00d7 4', columns: [{ width: 1, unit: 'fr' }, { width: 1, unit: 'fr' }, { width: 1, unit: 'fr' }, { width: 1, unit: 'fr' }] },
    { label: '33 / 67', columns: [{ width: 1, unit: 'fr' }, { width: 2, unit: 'fr' }] },
    { label: '67 / 33', columns: [{ width: 2, unit: 'fr' }, { width: 1, unit: 'fr' }] },
    { label: '25 / 50 / 25', columns: [{ width: 1, unit: 'fr' }, { width: 2, unit: 'fr' }, { width: 1, unit: 'fr' }] },
    { label: '25 / 75', columns: [{ width: 1, unit: 'fr' }, { width: 3, unit: 'fr' }] },
    { label: '75 / 25', columns: [{ width: 3, unit: 'fr' }, { width: 1, unit: 'fr' }] },
];

function matchPresetIndex(columns: ColumnDef[]): number {
    return COLUMN_PRESETS.findIndex(p =>
        p.columns.length === columns.length &&
        p.columns.every((c, i) => c.width === columns[i].width && c.unit === columns[i].unit)
    );
}

// ---------------------------------------------------------------------------
//  FlexDropCell
// ---------------------------------------------------------------------------

interface FlexDropCellProps {
    containerId: string;
    rowId: string;
    colIdx: number;
    isEditMode: boolean;
    children: React.ReactNode;
}

const FlexDropCell: React.FC<FlexDropCellProps> = ({ containerId, rowId, colIdx, isEditMode, children }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `flex-${containerId}-${rowId}-${colIdx}`,
        data: {
            type: 'flex-cell',
            containerId,
            rowId,
            column: colIdx,
        },
        disabled: !isEditMode,
    });

    return (
        <div ref={setNodeRef} className={cn('min-w-0', isOver && 'ring-2 ring-purple-400 ring-offset-1 rounded-md')}>
            {children}
        </div>
    );
};

// ---------------------------------------------------------------------------
//  FlexWidgetItem
// ---------------------------------------------------------------------------

interface FlexWidgetItemProps {
    widget: WidgetInstance;
    containerId: string;
    containerRows: RowDef[];
    isEditMode: boolean;
    pageId: string;
    selectedWidgetId?: string | null;
    selectedWidgetIds?: Set<string>;
    editingWidgetId?: string | null;
    newlyAddedWidgetId?: string | null;
    onSelectWidget?: (widgetId: string, pageId?: string) => void;
    onEditWidget?: (widgetId: string | null) => void;
    onRemoveWidget?: (widgetInstanceId: string) => void;
    contextVariables?: Record<string, any>;
    pageContext?: Record<string, any>;
}

const FlexWidgetItem: React.FC<FlexWidgetItemProps> = ({
    widget,
    containerId,
    containerRows,
    isEditMode,
    pageId,
    selectedWidgetId,
    selectedWidgetIds,
    editingWidgetId,
    newlyAddedWidgetId,
    onSelectWidget,
    onEditWidget,
    onRemoveWidget,
    contextVariables,
    pageContext,
}) => {
    const { updateWidgetProps, executeCommand } = useLayout();
    const widgetDef = widgetRegistry.get(widget.widgetId);
    if (!widgetDef) return null;

    const Component = widgetDef.component;
    const isWidgetSelected = selectedWidgetId === widget.id
        || selectedWidgetIds?.has(widget.id);
    const isEditing = editingWidgetId === widget.id;
    const isNew = newlyAddedWidgetId === widget.id;

    const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
        id: `flex-widget-${widget.id}`,
        data: {
            type: 'existing-widget',
            widgetInstanceId: widget.id,
            widgetDefId: widget.widgetId,
            sourceContainerId: containerId,
            sourceRowId: widget.rowId,
            sourceColumn: widget.column,
        },
        disabled: !isEditMode,
    });

    return (
        <div
            ref={setDragRef}
            id={`widget-item-${widget.id}`}
            className={cn(
                'relative group p-4 min-w-0 flex-1 h-full min-h-0 flex flex-col',
                isEditMode && 'cursor-pointer',
                isEditMode && isWidgetSelected && 'ring-2 ring-blue-500 rounded-lg',
                isEditMode && isNew && 'animate-pulse ring-2 ring-green-500 rounded-lg',
                isDragging && 'opacity-30',
            )}
            onClick={(e) => {
                e.stopPropagation();
                onSelectWidget?.(widget.id, pageId);
            }}
            onDoubleClick={(e) => {
                e.stopPropagation();
                onEditWidget?.(widget.id);
            }}
        >
            {/* Always-visible widget title bar (edit mode) */}
            {isEditMode && (
                <div
                    className="absolute top-0 left-0 right-0 bg-green-500/90 text-white text-xs px-2 py-1 rounded-t-lg z-10 cursor-grab active:cursor-grabbing"
                    {...listeners}
                    {...attributes}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelectWidget?.(widget.id, pageId);
                    }}
                >
                    <div className="flex items-center justify-between">
                        <span>{widgetDef.metadata.name}</span>
                        <div className="flex items-center gap-1">
                            {widgetDef.metadata.configSchema && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-4 w-4 text-white hover:bg-white/20"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditWidget?.(widget.id);
                                    }}
                                    title="Widget settings"
                                >
                                    <Settings className="h-2 w-2" />
                                </Button>
                            )}
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-4 w-4 text-white hover:bg-white/20"
                                onClick={(e) => { e.stopPropagation(); onRemoveWidget?.(widget.id); }}
                                title="Remove widget"
                            >
                                <Trash2 className="h-2 w-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            <div className={isEditMode ? 'pt-6 flex-1 h-full flex flex-col min-h-0' : 'flex-1 h-full flex flex-col min-h-0'}>
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
                    isEditMode={isEditMode}
                    isEditing={isEditing}
                    onPropsChange={async (newProps: Record<string, any>) => {
                        try {
                            await updateWidgetProps(pageId, widget.id, newProps);
                        } catch (e) {
                            console.error('Failed to update widget props', e);
                        }
                    }}
                    onSave={() => {
                        onEditWidget?.(null);
                    }}
                />
            </div>

            {/* Settings modal */}
            {widgetDef.metadata.configSchema && isEditing && (
                <WidgetSettingsManager
                    isOpen={!!isEditing}
                    onClose={() => onEditWidget?.(null)}
                    widgetDefinition={widgetDef}
                    currentProps={widget.props || {}}
                    onSave={async (settings: Record<string, any>) => {
                        try {
                            await updateWidgetProps(pageId, widget.id, settings);
                        } catch (e) {
                            console.error('Failed to save widget settings', e);
                        }
                    }}
                    onCancel={() => onEditWidget?.(null)}
                />
            )}

            {/* Movement Controls D-pad (edit mode) */}
            {isEditMode && (() => {
                const rowIdx = containerRows.findIndex(r => r.id === widget.rowId);
                const currentRowDef = rowIdx >= 0 ? containerRows[rowIdx] : null;
                return (
                    <div className={cn(
                        'absolute bottom-4 right-2 z-10 transition-opacity duration-200',
                        isWidgetSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    )}>
                        <WidgetMovementControls
                            onMove={(direction) => executeCommand(new MoveWidgetCommand(pageId, widget.id, direction))}
                            canMoveLeft={(widget.column ?? 0) > 0}
                            canMoveRight={currentRowDef ? (widget.column ?? 0) < currentRowDef.columns.length - 1 : false}
                            canMoveUp={rowIdx > 0}
                            canMoveDown={rowIdx < containerRows.length - 1}
                        />
                    </div>
                );
            })()}
        </div>
    );
};

// ---------------------------------------------------------------------------
//  Props (full edit interface)
// ---------------------------------------------------------------------------

export interface FlexibleContainerRendererProps {
    container: FlexibleContainer;
    isEditMode: boolean;
    pageId: string;
    selectedContainerId?: string | null;
    onSelect?: (containerId: string, pageId?: string) => void;
    onAddWidget?: (containerId: string, targetColumn?: number, rowId?: string) => void;
    onRemoveWidget?: (widgetInstanceId: string) => void;
    onRemoveContainer?: (containerId: string) => void;
    onMoveContainer?: (containerId: string, direction: 'up' | 'down') => void;
    canMoveContainerUp?: boolean;
    canMoveContainerDown?: boolean;
    selectedWidgetId?: string | null;
    selectedWidgetIds?: Set<string>;
    onSelectWidget?: (widgetId: string, pageId?: string) => void;
    isCompactMode?: boolean;
    editingWidgetId?: string | null;
    onEditWidget?: (widgetId: string | null) => void;
    newlyAddedWidgetId?: string | null;
    contextVariables?: Record<string, any>;
    pageContext?: Record<string, any>;
}

// ---------------------------------------------------------------------------
//  Main Edit Component
// ---------------------------------------------------------------------------

const FlexContainerEdit: React.FC<FlexibleContainerRendererProps> = ({
    container,
    isEditMode,
    pageId,
    selectedContainerId,
    onSelect,
    onAddWidget,
    onRemoveWidget,
    onRemoveContainer,
    onMoveContainer,
    canMoveContainerUp,
    canMoveContainerDown,
    selectedWidgetId,
    selectedWidgetIds,
    onSelectWidget,
    isCompactMode,
    editingWidgetId,
    onEditWidget,
    newlyAddedWidgetId,
    contextVariables,
    pageContext,
}) => {
    const isSelected = selectedContainerId === container.id;

    const hasChildSelected = useMemo(() => {
        if (!selectedWidgetId && (!selectedWidgetIds || selectedWidgetIds.size === 0)) return false;
        return container.widgets.some(w =>
            w.id === selectedWidgetId || selectedWidgetIds?.has(w.id)
        );
    }, [container.widgets, selectedWidgetId, selectedWidgetIds]);

    const isActive = isSelected || hasChildSelected;

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

    const handleSelect = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect?.(container.id, pageId);
    }, [container.id, onSelect, pageId]);

    const { executeCommand } = useLayout();

    const handleAddRow = useCallback(() => {
        const rowId = UnifiedLayoutManager.generateRowId();
        executeCommand(new FlexAddRowCommand(pageId, container.id, rowId));
    }, [container.id, pageId, executeCommand]);

    const handleRemoveRow = useCallback((rowId: string) => {
        executeCommand(new FlexRemoveRowCommand(pageId, container.id, rowId));
    }, [container.id, pageId, executeCommand]);

    const handleAddColumn = useCallback((rowId: string) => {
        executeCommand(new FlexAddColumnCommand(pageId, container.id, rowId));
    }, [container.id, pageId, executeCommand]);

    const handleRemoveColumn = useCallback((rowId: string, colIdx: number) => {
        executeCommand(new FlexRemoveColumnCommand(pageId, container.id, rowId, colIdx));
    }, [container.id, pageId, executeCommand]);

    // ------- Render a single row -------
    const renderRow = (row: RowDef, rowIndex: number) => {
        const gridTemplate = columnsToGridTemplate(row.columns);
        const alignClass = getRowAlignItems(row.sizing);

        return (
            <div key={row.id} className="relative group/row">
                {/* Row header (edit mode only) */}
                {isEditMode && (
                    <div className="flex items-center gap-1 mb-1 text-xs opacity-80">
                        <GripVertical className="h-3 w-3 text-slate-400" />
                        <span className="text-slate-500 dark:text-slate-400">
                            Row {rowIndex + 1}
                        </span>

                        {/* Preset dropdown */}
                        <Select
                            value={String(matchPresetIndex(row.columns))}
                            onValueChange={(val) => {
                                const idx = parseInt(val);
                                if (idx >= 0 && idx < COLUMN_PRESETS.length) {
                                    executeCommand(new FlexSetColumnsPresetCommand(pageId, container.id, row.id, COLUMN_PRESETS[idx].columns));
                                }
                            }}
                        >
                            <SelectTrigger className="h-6 w-auto text-xs px-2 py-0" onClick={(e) => e.stopPropagation()}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {matchPresetIndex(row.columns) === -1 && (
                                    <SelectItem value="-1">Custom</SelectItem>
                                )}
                                {COLUMN_PRESETS.map((p, i) => (
                                    <SelectItem key={i} value={String(i)}>{p.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="ml-auto flex items-center gap-0.5">
                            {/* Row settings popover */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0"
                                        title="Row settings"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Settings className="h-3 w-3" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-52 p-3" align="end" onClick={(e) => e.stopPropagation()}>
                                    <div className="space-y-3 text-xs">
                                        <div className="font-medium text-sm">Row Settings</div>

                                        {/* Sizing */}
                                        <div>
                                            <label className="text-muted-foreground mb-1 block">Sizing</label>
                                            <Select
                                                value={row.sizing || 'constrained'}
                                                onValueChange={(val) => {
                                                    executeCommand(new FlexSetRowSizingCommand(pageId, container.id, row.id, val as any));
                                                }}
                                            >
                                                <SelectTrigger className="h-7 text-xs w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="constrained">Stretch (equal height)</SelectItem>
                                                    <SelectItem value="unconstrained">Auto (content height)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Padding */}
                                        <div>
                                            <label className="text-muted-foreground mb-1 block">Cell Padding</label>
                                            <Select
                                                value={row.padding || 'none'}
                                                onValueChange={(val) => {
                                                    executeCommand(new FlexSetRowPaddingCommand(pageId, container.id, row.id, val === 'none' ? undefined : val));
                                                }}
                                            >
                                                <SelectTrigger className="h-7 text-xs w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PADDING_PRESETS.map(p => (
                                                        <SelectItem key={p.value || 'none'} value={p.value || 'none'}>{p.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            {/* Row move up/down */}
                            {rowIndex > 0 && (
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0"
                                    title="Move row up"
                                    onClick={(e) => { e.stopPropagation(); executeCommand(new FlexMoveRowCommand(pageId, container.id, row.id, 'up')); }}
                                >
                                    <ArrowUp className="h-3 w-3" />
                                </Button>
                            )}
                            {rowIndex < container.rows.length - 1 && (
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0"
                                    title="Move row down"
                                    onClick={(e) => { e.stopPropagation(); executeCommand(new FlexMoveRowCommand(pageId, container.id, row.id, 'down')); }}
                                >
                                    <ArrowDown className="h-3 w-3" />
                                </Button>
                            )}
                            {container.rows.length > 1 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 text-red-500"
                                    title="Remove row"
                                    onClick={(e) => { e.stopPropagation(); handleRemoveRow(row.id); }}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0"
                                title="Duplicate row"
                                onClick={(e) => { e.stopPropagation(); executeCommand(new FlexDuplicateRowCommand(pageId, container.id, row.id)); }}
                            >
                                <Copy className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Column headers with add/remove icons — above the row */}
                {isEditMode && (
                    <div
                        className="grid text-xs mb-1"
                        style={{
                            gridTemplateColumns: gridTemplate,
                            gap: `${row.gap ?? container.gap}px`,
                        }}
                    >
                        {row.columns.map((_col, colIdx) => (
                            <div key={`hdr-${row.id}-${colIdx}`} className="flex items-center justify-between px-1 text-slate-400 dark:text-slate-500">
                                <span className="opacity-60">Col {colIdx + 1}</span>
                                <div className="flex items-center gap-0.5">
                                    <button
                                        className="hover:text-green-500 transition-colors p-0.5"
                                        title="Add column after"
                                        onClick={(e) => { e.stopPropagation(); handleAddColumn(row.id); }}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </button>
                                    <button
                                        className="hover:text-blue-500 transition-colors p-0.5"
                                        title="Duplicate column"
                                        onClick={(e) => { e.stopPropagation(); executeCommand(new FlexDuplicateColumnCommand(pageId, container.id, row.id, colIdx)); }}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </button>
                                    {row.columns.length > 1 && (
                                        <button
                                            className="hover:text-red-500 transition-colors p-0.5"
                                            title="Remove column (deletes its widgets)"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveColumn(row.id, colIdx);
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Grid row */}
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
                            <FlexDropCell key={`${row.id}-col-${colIdx}`} containerId={container.id} rowId={row.id} colIdx={colIdx} isEditMode={isEditMode}>
                                <div
                                    className={cn(
                                        'min-h-[40px] min-w-0 flex flex-col gap-2',
                                        row.padding || '',
                                        isEditMode && 'border border-dashed border-slate-300 dark:border-slate-600 rounded-md p-2',
                                    )}
                                >
                                    {cellWidgets.map(w => (
                                        <FlexWidgetItem
                                            key={w.id}
                                            widget={w}
                                            containerId={container.id}
                                            containerRows={container.rows}
                                            isEditMode={isEditMode}
                                            pageId={pageId}
                                            selectedWidgetId={selectedWidgetId}
                                            selectedWidgetIds={selectedWidgetIds}
                                            editingWidgetId={editingWidgetId}
                                            newlyAddedWidgetId={newlyAddedWidgetId}
                                            onSelectWidget={onSelectWidget}
                                            onEditWidget={onEditWidget}
                                            onRemoveWidget={onRemoveWidget}
                                            contextVariables={contextVariables}
                                            pageContext={pageContext}
                                        />
                                    ))}

                                    {/* Empty cell + add button (edit mode) */}
                                    {isEditMode && cellWidgets.length === 0 && (
                                        <button
                                            className="w-full h-full min-h-[60px] flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-md transition-colors border border-dashed border-transparent hover:border-blue-300"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAddWidget?.(container.id, colIdx, row.id);
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add widget
                                        </button>
                                    )}

                                    {/* Add widget button (edit mode, non-empty cell) */}
                                    {isEditMode && cellWidgets.length > 0 && (
                                        <button
                                            className="w-full py-1 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 rounded-md transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAddWidget?.(container.id, colIdx, row.id);
                                            }}
                                        >
                                            <Plus className="h-3 w-3 mr-0.5" />
                                        </button>
                                    )}
                                </div>
                            </FlexDropCell>
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

    if (!enabled && !isEditMode) return null;

    const containerContent = (
        <div
            className={cn(
                'relative min-w-0',
                isEditMode && 'rounded-lg transition-all duration-200',
                isEditMode && isSelected && 'ring-2 ring-purple-500 bg-purple-50/30 dark:bg-purple-950/10',
                isEditMode && !isSelected && 'hover:ring-1 hover:ring-purple-300',
                !enabled && isEditMode && 'opacity-50',
                container.settings?.customClassName,
            )}
            onClick={handleSelect}
        >
            {/* Container header (edit mode — always visible) */}
            {isEditMode && (
                <div
                    className={cn(
                        "flex items-center justify-between px-2 py-1 rounded-t-lg text-xs cursor-pointer",
                        isSelected
                            ? "bg-purple-500 text-white"
                            : hasChildSelected
                                ? "bg-purple-200 dark:bg-purple-800/40 text-purple-700 dark:text-purple-300"
                                : "bg-slate-400 text-white"
                    )}
                    onClick={handleSelect}
                >
                    <span className="font-medium">
                        ⊞ {container.settings?.title || 'Flex Container'} ({container.rows.length} row{container.rows.length !== 1 ? 's' : ''})
                    </span>
                    <div className="flex items-center gap-0.5">
                        {canMoveContainerUp && (
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0"
                                onClick={(e) => { e.stopPropagation(); onMoveContainer?.(container.id, 'up'); }}>
                                <ArrowUp className="h-3 w-3" />
                            </Button>
                        )}
                        {canMoveContainerDown && (
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0"
                                onClick={(e) => { e.stopPropagation(); onMoveContainer?.(container.id, 'down'); }}>
                                <ArrowDown className="h-3 w-3" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-green-600"
                            title="Add row"
                            onClick={(e) => { e.stopPropagation(); handleAddRow(); }}
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-red-500"
                            title="Remove container"
                            onClick={(e) => { e.stopPropagation(); onRemoveContainer?.(container.id); }}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Rows */}
            <div className={cn('flex flex-col', isEditMode && 'p-3')} style={{ gap: `${container.gap}px` }}>
                {container.rows.map((row, idx) => renderRow(row, idx))}
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

export default FlexContainerEdit;
