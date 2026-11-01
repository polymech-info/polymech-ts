import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useImageDrop } from '@/hooks/useImageDrop';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Grid3X3, Trash2, Settings, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { LayoutContainer as LayoutContainerType, WidgetInstance } from '@/modules/layout/LayoutManager';
import { widgetRegistry } from '@/lib/widgetRegistry';
import { WidgetSettingsManager } from '@/components/widgets/WidgetSettingsManager';
import { WidgetMovementControls } from '@/components/widgets/WidgetMovementControls';
import { useLayout } from '@/modules/layout/LayoutContext';
import CollapsibleSection from '@/components/CollapsibleSection';
import { ContainerSettingsManager } from '@/components/containers/ContainerSettingsManager';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { LayoutContainer } from './LayoutContainer';

// Droppable slot for empty areas (column indicators, add-widget buttons)
const DroppableSlot: React.FC<{
  containerId: string;
  index: number;
  isEditMode: boolean;
  children: React.ReactNode;
}> = ({ containerId, index, isEditMode, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${containerId}-${index}`,
    data: {
      type: 'container-cell',
      containerId,
      index,
    },
    disabled: !isEditMode,
  });

  return (
    <div ref={setNodeRef} className={cn(isOver && 'ring-2 ring-blue-400 ring-offset-2 rounded-lg')}>
      {children}
    </div>
  );
};

export interface LayoutContainerEditProps {
  container: LayoutContainerType;
  isEditMode: boolean;
  pageId: string;
  selectedContainerId?: string | null;
  onSelect?: (containerId: string, pageId?: string) => void;
  onAddWidget?: (containerId: string, targetColumn?: number) => void;
  onRemoveWidget?: (widgetInstanceId: string) => void;
  onMoveWidget?: (widgetInstanceId: string, direction: 'up' | 'down' | 'left' | 'right') => void;
  onUpdateColumns?: (containerId: string, columns: number) => void;
  onUpdateSettings?: (containerId: string, settings: Partial<LayoutContainerType['settings']>) => void;
  onAddContainer?: (parentContainerId: string) => void;
  onRemoveContainer?: (containerId: string) => void;
  onMoveContainer?: (containerId: string, direction: 'up' | 'down') => void;
  canMoveContainerUp?: boolean;
  canMoveContainerDown?: boolean;
  selectedWidgetId?: string | null;
  selectedWidgetIds?: Set<string>;
  onSelectWidget?: (widgetId: string, pageId?: string) => void;
  depth?: number;
  isCompactMode?: boolean;
  editingWidgetId?: string | null;
  onEditWidget?: (widgetId: string | null) => void;
  newlyAddedWidgetId?: string | null;
  contextVariables?: Record<string, any>;
  pageContext?: Record<string, any>;
  onFilesDrop?: (files: File[], targetColumn?: number) => void;
}

const LayoutContainerEditComponent: React.FC<LayoutContainerEditProps> = ({
  container,
  isEditMode,
  pageId,
  selectedContainerId,
  onSelect,
  onAddWidget,
  onRemoveWidget,
  onMoveWidget,
  onUpdateColumns,
  onUpdateSettings,
  onAddContainer,
  onRemoveContainer,
  onMoveContainer,
  canMoveContainerUp,
  canMoveContainerDown,
  selectedWidgetId,
  selectedWidgetIds,
  onSelectWidget,
  depth = 0,
  isCompactMode = false,
  editingWidgetId,
  onEditWidget,
  newlyAddedWidgetId,
  contextVariables,
  pageContext,
  onFilesDrop,
}) => {
  const { isDragging, handlers } = useImageDrop({
    onFilesDrop: (files) => onFilesDrop?.(files),
    isEditMode: isEditMode && !!onFilesDrop,
  });
  const maxDepth = 3; // Limit nesting depth
  const canNest = depth < maxDepth;
  const isSelected = selectedContainerId === container.id;
  const [showContainerSettings, setShowContainerSettings] = useState(false);

  // Generate responsive grid classes based on container.columns
  const getGridClasses = (columns: number) => {
    const baseClass = "grid"; // Always grid with gap

    // Mobile: always 1 column, Desktop: respect container.columns
    switch (columns) {
      case 1: return `${baseClass} grid-cols-1`;
      case 2: return `${baseClass} grid-cols-1 md:grid-cols-2`;
      case 3: return `${baseClass} grid-cols-1 md:grid-cols-2 lg:grid-cols-3`;
      case 4: return `${baseClass} grid-cols-1 md:grid-cols-2 lg:grid-cols-4`;
      case 5: return `${baseClass} grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`;
      case 6: return `${baseClass} grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`;
      default:
        // For 7+ columns, use a more conservative approach
        return `${baseClass} grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-${Math.min(columns, 12)}`;
    }
  };

  const gridClasses = getGridClasses(container.columns);

  // Extract container content rendering logic
  const renderContainerContent = () => (
    <>
      {/* Grid Column Indicators (only in edit mode when selected) */}
      {isEditMode && isSelected && container.widgets.length === 0 && container.children.length === 0 && (
        <>
          {Array.from({ length: container.columns }, (_, i) => (
            <DroppableSlot
              key={i}
              containerId={container.id}
              index={i}
              isEditMode={isEditMode}
            >
              <div
                className="min-h-[80px] flex items-center justify-center text-blue-500 dark:text-blue-400 text-sm cursor-pointer hover:bg-blue-100/20 dark:hover:bg-blue-800/20 transition-colors"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onAddWidget?.(container.id, i);
                }}
                title={`Double-click to add widget to column ${i + 1}`}
              >
                Col {i + 1}
              </div>
            </DroppableSlot>
          ))}
        </>
      )}

      {/* Render Widgets */}
      {container.widgets
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((widget, index) => (
          <WidgetItem
            key={widget.id}
            widget={widget}
            index={index}
            containerId={container.id}
            isEditMode={isEditMode}
            pageId={pageId}
            isSelected={selectedWidgetIds ? selectedWidgetIds.has(widget.id) : selectedWidgetId === widget.id}
            onSelect={() => onSelectWidget?.(widget.id, pageId)}
            canMoveUp={index > 0}
            canMoveDown={index < container.widgets.length - 1}
            onRemove={onRemoveWidget}
            onMove={onMoveWidget}
            isEditing={editingWidgetId === widget.id}
            onEditWidget={onEditWidget}
            isNew={newlyAddedWidgetId === widget.id}
            selectedWidgetId={selectedWidgetId}
            onSelectWidget={onSelectWidget}
            editingWidgetId={editingWidgetId}
            contextVariables={contextVariables}
            pageContext={pageContext}
            selectedContainerId={selectedContainerId}
            onSelectContainer={onSelect}
          />
        ))}

      {/* Add Widget Buttons - always visible in edit mode at bottom of every container */}
      {isEditMode && (
        <>
          {container.columns > 1 ? (
            <div className="col-span-full grid gap-4" style={{ gridTemplateColumns: `repeat(${container.columns}, minmax(0, 1fr))` }}>
              {Array.from({ length: container.columns }, (_, colIndex) => (
                <DroppableSlot
                  key={`add-widget-${colIndex}`}
                  containerId={container.id}
                  index={container.widgets.length + colIndex}
                  isEditMode={isEditMode}
                >
                  <div
                    className="flex items-center justify-center min-h-[40px] rounded-lg hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddWidget?.(container.id, colIndex);
                    }}
                    title={`Add widget to column ${colIndex + 1}`}
                  >
                    <div className="text-center text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                      <Plus className="h-4 w-4 mx-auto" />
                      <p className="text-[10px]">Col {colIndex + 1}</p>
                    </div>
                  </div>
                </DroppableSlot>
              ))}
            </div>
          ) : (
            <DroppableSlot
              containerId={container.id}
              index={container.widgets.length}
              isEditMode={isEditMode}
            >
              <div
                className="col-span-full flex items-center justify-center min-h-[36px] rounded-lg hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddWidget?.(container.id);
                }}
                title="Add widget"
              >
                <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                  <Plus className="h-4 w-4" />
                  <span className="text-xs">Add Widget</span>
                </div>
              </div>
            </DroppableSlot>
          )}
        </>
      )}

      {/* Render Nested Containers */}
      {container.children
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((childContainer) => (
          <div key={childContainer.id} className="col-span-full">
            <LayoutContainer
              container={childContainer}
              isEditMode={isEditMode}
              pageId={pageId}
              selectedContainerId={selectedContainerId}
              onSelect={onSelect}
              onAddWidget={onAddWidget}
              onRemoveWidget={onRemoveWidget}
              onMoveWidget={onMoveWidget}
              onUpdateColumns={onUpdateColumns}
              onUpdateSettings={onUpdateSettings}
              onAddContainer={onAddContainer}
              onRemoveContainer={onRemoveContainer}
              onMoveContainer={onMoveContainer}
              canMoveContainerUp={canMoveContainerUp}
              canMoveContainerDown={canMoveContainerDown}
              selectedWidgetId={selectedWidgetId}
              selectedWidgetIds={selectedWidgetIds}
              onSelectWidget={onSelectWidget}
              depth={depth + 1}
              isCompactMode={isCompactMode}
              editingWidgetId={editingWidgetId}
              onEditWidget={onEditWidget}
              newlyAddedWidgetId={newlyAddedWidgetId}
              contextVariables={contextVariables}
              pageContext={pageContext}
            />
          </div>
        ))}


      {/* Empty State - only show when not showing column indicators */}
      {container.widgets.length === 0 && container.children.length === 0 && !(isEditMode && isSelected) && !isEditMode && (
        <div className="col-span-full flex items-center justify-center min-h-[80px] text-slate-500 dark:text-slate-400">
          <p className="text-sm"></p>
        </div>
      )}
    </>
  );

  // Handle Enabled State
  const isContainerEnabled = container.settings?.enabled !== false; // Default to true

  if (!isContainerEnabled && !isEditMode) {
    return null;
  }

  return (
    <div className={cn(
      "space-y-0",
      container.settings?.customClassName,
      !isContainerEnabled && "opacity-50 grayscale transition-all hover:grayscale-0"
    )}>
      {/* Edit Mode Controls */}
      {isEditMode && (
        <div className={cn(
          "text-white px-2 sm:px-3 py-1 rounded-t-lg text-xs overflow-hidden cursor-pointer",
          isSelected ? "bg-blue-500" : "bg-slate-500"
        )}
          onClick={(e) => {
            e.stopPropagation();
            if (isEditMode) {
              onSelect?.(container.id, pageId);
            }
          }}
        >
          {/* Responsive layout: title and buttons wrap on small screens */}
          <div className="flex items-center justify-between gap-x-2 gap-y-1 min-w-0 flex-wrap">
            <div className="flex items-center gap-1 min-w-0 flex-grow">
              <Grid3X3 className="h-3 w-3 shrink-0" />
              <span className="truncate text-xs font-semibold">
                {container.settings?.showTitle && container.settings?.title
                  ? container.settings.title
                  : `Container (${container.columns} col${container.columns !== 1 ? 's' : ''})`}
                {(container.settings?.collapsible || container.settings?.showTitle) && (
                  <span className="ml-1 opacity-75 font-normal">⚙️</span>
                )}
              </span>
            </div>

            {/* Minimalist button row - wraps and justifies to the end */}
            <div className="flex items-center gap-0.5 flex-wrap justify-end">
              {/* Move controls for root containers */}
              {depth === 0 && (
                <div className="flex items-center gap-0.5 mr-1 border-r border-white/20 pr-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveContainer?.(container.id, 'up');
                    }}
                    disabled={!canMoveContainerUp}
                    className="h-4 px-1 text-white hover:bg-white/20 shrink-0"
                    title="Move container up"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveContainer?.(container.id, 'down');
                    }}
                    disabled={!canMoveContainerDown}
                    className="h-4 px-1 text-white hover:bg-white/20 shrink-0"
                    title="Move container down"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {/* Column controls */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateColumns?.(container.id, container.columns - 1);
                }}
                disabled={container.columns <= 1}
                className="h-4 px-1 text-white hover:bg-white/20 shrink-0"
                title="Decrease columns"
              >
                <Minus className="h-3 w-3" />
              </Button>

              <span className="min-w-[12px] text-center text-xs font-medium px-1">{container.columns}</span>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateColumns?.(container.id, container.columns + 1);
                }}
                disabled={container.columns >= 12}
                className="h-4 px-1 text-white hover:bg-white/20 shrink-0"
                title="Increase columns"
              >
                <Plus className="h-3 w-3" />
              </Button>

              {/* Add widget button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddWidget?.(container.id);
                }}
                className="h-4 px-1 text-white hover:bg-white/20 shrink-0 ml-1"
                title="Add widget"
              >
                <Plus className="h-3 w-3" />
              </Button>

              {/* Add nested container button */}
              {canNest && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddContainer?.(container.id);
                  }}
                  className="h-4 px-1 text-white hover:bg-white/20 shrink-0"
                  title="Add nested container"
                >
                  <Grid3X3 className="h-3 w-3" />
                </Button>
              )}

              {/* Container settings button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowContainerSettings(true);
                }}
                className="h-4 px-1 text-white hover:bg-white/20 shrink-0"
                title="Container settings"
              >
                <Settings className="h-3 w-3" />
              </Button>

              {/* Remove container button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveContainer?.(container.id);
                }}
                className="h-4 px-1 text-white hover:bg-red-400 shrink-0"
                title="Remove container"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Container Content */}
      <div
        {...handlers}
        className={cn(
          "relative transition-all duration-200 min-w-0 overflow-hidden",
          isEditMode ? "rounded-b-lg" : "",
          isEditMode && "hover:border-blue-300 cursor-pointer",
          isSelected && isEditMode && "border-blue-500 bg-blue-50/20 dark:bg-blue-900/20",
          !isSelected && isEditMode && "border-slate-300/50 dark:border-white/20",
          !isEditMode && "border-transparent",
          isDragging && "ring-4 ring-blue-400 ring-opacity-50 bg-blue-50/50 dark:bg-blue-900/50"
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (isEditMode) {
            onSelect?.(container.id, pageId);
          }
        }}
      >
        {container.settings?.collapsible ? (
          <CollapsibleSection
            title={
              container.settings?.showTitle
                ? (container.settings?.title || `Container (${container.columns} col${container.columns !== 1 ? 's' : ''})`)
                : `Container (${container.columns} col${container.columns !== 1 ? 's' : ''})`
            }
            initiallyOpen={!container.settings?.collapsed}
            storageKey={`container-${container.id}-collapsed`}
            className="border-0 rounded-none shadow-none bg-transparent"
            minimal={true}
          >
            <div
              className={cn(
                isCompactMode ? "p-1 sm:p-2 min-h-[80px]" : isEditMode ? "p-2 min-h-[120px]" : "min-h-[120px]",
                gridClasses,
                isEditMode && isSelected && "bg-blue-50/10 dark:bg-blue-900/10"
              )}
              style={{
                gap: `${container.gap}px`,
              }}
            >
              {renderContainerContent()}
            </div>
          </CollapsibleSection>
        ) : (
          <div>
            {/* Title for non-collapsible containers */}
            {container.settings?.showTitle && (
              <div className="px-4 pt-3 pb-1 border-b border-slate-300/30 dark:border-white/10">
                <h3 className="text-sm font-medium text-slate-700 dark:text-white">
                  {container.settings?.title || `Container (${container.columns} col${container.columns !== 1 ? 's' : ''})`}
                </h3>
              </div>
            )}
            <div
              className={cn(
                isCompactMode ? "p-1 sm:p-2 min-h-[80px]" : isEditMode ? "p-2 min-h-[120px]" : "min-h-[120px]",
                gridClasses,
                isEditMode && isSelected && "bg-blue-50/10 dark:bg-blue-900/10"
              )}
              style={{
                gap: `${container.gap}px`,
              }}
            >
              {renderContainerContent()}
            </div>
          </div>
        )}
      </div>
      {/* Drop Overlay */}


      {/* Container Settings Dialog */}
      {showContainerSettings && (
        <ContainerSettingsManager
          isOpen={showContainerSettings}
          onClose={() => setShowContainerSettings(false)}
          onSave={(settings) => {
            onUpdateSettings?.(container.id, settings);
            setShowContainerSettings(false);
          }}
          currentSettings={container.settings}
          containerInfo={{
            id: container.id,
            columns: container.columns,
          }}
        />
      )}
    </div>
  );
};

interface WidgetItemProps {
  widget: WidgetInstance;
  index: number;
  containerId: string;
  isEditMode: boolean;
  pageId: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRemove?: (widgetInstanceId: string) => void;
  onMove?: (widgetInstanceId: string, direction: 'up' | 'down' | 'left' | 'right') => void;
  isSelected?: boolean;
  onSelect?: () => void;
  isEditing?: boolean;
  onEditWidget?: (widgetId: string | null) => void;
  isNew?: boolean;
  selectedWidgetId?: string | null;
  onSelectWidget?: (widgetId: string, pageId?: string) => void;
  editingWidgetId?: string | null;
  contextVariables?: Record<string, any>;
  pageContext?: Record<string, any>;
  selectedContainerId?: string | null;
  onSelectContainer?: (containerId: string, pageId?: string) => void;
}

const WidgetItem: React.FC<WidgetItemProps> = ({
  widget,
  index,
  containerId,
  isEditMode,
  pageId,
  canMoveUp,
  canMoveDown,
  onRemove,
  onMove,
  isSelected,
  onSelect,
  isEditing,
  onEditWidget,
  isNew,
  selectedWidgetId,
  onSelectWidget,
  editingWidgetId,
  contextVariables,
  pageContext,
  selectedContainerId,
  onSelectContainer,
}) => {
  const widgetDefinition = widgetRegistry.get(widget.widgetId);
  const { updateWidgetProps, renameWidget } = useLayout();

  // DnD hooks (only active in edit mode)
  const { attributes, listeners, setNodeRef: setDragRef, isDragging: isDndDragging } = useDraggable({
    id: `widget-${widget.id}`,
    data: {
      type: 'existing-widget',
      widgetInstanceId: widget.id,
      widgetDefId: widget.widgetId,
      sourceContainerId: containerId,
      sourceIndex: index,
    },
    disabled: !isEditMode,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `cell-${containerId}-${index}`,
    data: {
      type: 'container-cell',
      containerId,
      index,
    },
    disabled: !isEditMode,
  });

  // Combine refs
  const combinedRef = (node: HTMLElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };

  // Internal state removed in favor of controlled state
  // const [showSettingsModal, setShowSettingsModal] = useState(false);

  const handlePropsChange = React.useCallback(async (newProps: Record<string, any>) => {
    try {
      await updateWidgetProps(pageId, widget.id, newProps);
    } catch (error) {
      console.error('Failed to update widget props:', error);
    }
  }, [pageId, widget.id, updateWidgetProps]);

  // pageId is now passed as a prop from the parent component

  if (!widgetDefinition) {
    return (
      <div className="relative group border-red-500 bg-red-100 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400 text-sm">
          Widget "{widget.widgetId}" not found in registry
        </p>
        {isEditMode && (
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.(widget.id);
            }}
            title="Remove invalid widget"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  const WidgetComponent = widgetDefinition.component;

  const handleSettingsSave = async (settings: Record<string, any>) => {
    try {
      await updateWidgetProps(pageId, widget.id, settings);
    } catch (error) {
      console.error('Failed to save widget settings:', error);
    }
  };

  const handleSettingsCancel = () => {
    if (isNew) {
      onRemove?.(widget.id);
    }
  };

  // Handle Enabled State
  const isEnabled = widget.props?.enabled !== false; // Default to true

  if (!isEnabled && !isEditMode) {
    return null;
  }

  return (
    <div ref={combinedRef} className={cn(
      "relative group",
      !isEnabled && "opacity-50 grayscale transition-all hover:grayscale-0",
      isDndDragging && "opacity-30",
      isOver && "ring-2 ring-blue-400 ring-offset-2 rounded-lg"
    )} id={`widget-item-${widget.id}`}>
      {/* Edit Mode Controls */}
      {isEditMode && (
        <>
          {/* Widget Info Overlay */}
          <div
            className="absolute top-0 left-0 right-0 bg-green-500/90 text-white text-xs px-2 py-1 rounded-t-lg z-10 cursor-grab active:cursor-grabbing"
            {...listeners}
            {...attributes}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
          >
            <div className="flex items-center justify-between">
              <span>{widgetDefinition.metadata.name}</span>
              <div className="flex items-center gap-1">
                {/* Settings Gear Icon - For widgets with configSchema */}
                {widgetDefinition.metadata.configSchema && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-4 w-4 text-white hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Open settings modal via prop
                      onEditWidget?.(widget.id);
                    }}
                    title="Widget settings"
                  >
                    <Settings className="h-2 w-2" />
                  </Button>
                )}

                {/* Remove Button */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-4 w-4 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove?.(widget.id);
                  }}
                  title="Remove widget"
                >
                  <Trash2 className="h-2 w-2" />
                </Button>
              </div>
            </div>
          </div>



          {/* Move Controls - Cross Pattern (Only show on hover or selection) */}
          <div className={cn(
            "absolute bottom-4 right-2 z-10 transition-opacity duration-200",
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            <WidgetMovementControls
              onMove={(direction) => onMove?.(widget.id, direction)}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
            />
          </div>

        </>
      )}

      {/* Widget Content - With selection wrapper */}
      <div
        className={cn(
          "w-full dark:bg-slate-900/10 overflow-hidden transition-all duration-200",
          isEditMode && "rounded-lg",
          widget.props?.customClassName || `widget-${widget.id.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          `widget-type-${widget.widgetId}`,
          // Selection Visuals & Margins
          isEditMode && "border-2",
          isEditMode && isSelected ? "border-blue-500 ring-4 ring-blue-500/10 shadow-lg z-10" : "border-transparent",
          isEditMode && !isSelected && "hover:border-blue-300 dark:hover:border-blue-700",
          // Margin between header/content - applied via padding on this wrapper or margin on content? 
          // Using padding-top on wrapper to separate from title bar overlay
          isEditMode && "pt-8" // Space for title bar
        )}
        onClick={(e) => {
          if (isEditMode) {
            e.preventDefault(); // Prevent focus stealing if clicking background
            e.stopPropagation();
            onSelect?.();
          }
        }}
      >
        <WidgetComponent
          {...(widget.props || {})}
          widgetInstanceId={widget.id}
          widgetDefId={widget.widgetId}
          isEditMode={isEditMode}
          onPropsChange={handlePropsChange}
          selectedWidgetId={selectedWidgetId}
          onSelectWidget={onSelectWidget}
          editingWidgetId={editingWidgetId}
          onEditWidget={onEditWidget}
          contextVariables={contextVariables}
          pageContext={pageContext}
          selectedContainerId={selectedContainerId}
          onSelectContainer={onSelectContainer} />
      </div>

      {/* Generic Settings Modal */}
      {
        widgetDefinition.metadata.configSchema && isEditing && (
          <WidgetSettingsManager
            isOpen={!!isEditing} // coerce to boolean although it should be boolean | undefined from comparison
            onClose={() => onEditWidget?.(null)}
            widgetDefinition={widgetDefinition}

            currentProps={widget.props || {}}
            onSave={handleSettingsSave}
            onCancel={handleSettingsCancel}
          />
        )
      }
    </div >
  );
};

export default LayoutContainerEditComponent;
