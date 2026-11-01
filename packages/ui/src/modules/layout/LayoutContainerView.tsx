import React from 'react';
import { cn } from '@/lib/utils';
import { LayoutContainer as LayoutContainerType, WidgetInstance } from '@/modules/layout/LayoutManager';
import { widgetRegistry } from '@/lib/widgetRegistry';
import CollapsibleSection from '@/components/CollapsibleSection';
import { LayoutContainer } from './LayoutContainer';
import type { LayoutContainerEditProps } from './LayoutContainerEdit';

export type LayoutContainerViewProps = Omit<
  LayoutContainerEditProps,
  | 'onAddWidget'
  | 'onRemoveWidget'
  | 'onMoveWidget'
  | 'onUpdateColumns'
  | 'onUpdateSettings'
  | 'onAddContainer'
  | 'onRemoveContainer'
  | 'onMoveContainer'
  | 'onEditWidget'
  | 'onFilesDrop'
  | 'canMoveContainerUp'
  | 'canMoveContainerDown'
>;

const LayoutContainerView: React.FC<LayoutContainerViewProps> = ({
  container,
  isEditMode = false,
  pageId,
  selectedContainerId,
  onSelect,
  selectedWidgetId,
  selectedWidgetIds,
  onSelectWidget,
  depth = 0,
  isCompactMode = false,
  contextVariables,
  pageContext,
}) => {
  const maxDepth = 3;

  const getGridClasses = (columns: number) => {
    const baseClass = "grid";
    switch (columns) {
      case 1: return `${baseClass} grid-cols-1`;
      case 2: return `${baseClass} grid-cols-1 md:grid-cols-2`;
      case 3: return `${baseClass} grid-cols-1 md:grid-cols-2 lg:grid-cols-3`;
      case 4: return `${baseClass} grid-cols-1 md:grid-cols-2 lg:grid-cols-4`;
      case 5: return `${baseClass} grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`;
      case 6: return `${baseClass} grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`;
      default:
        return `${baseClass} grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-${Math.min(columns, 12)}`;
    }
  };

  const gridClasses = getGridClasses(container.columns);

  const renderContainerContent = () => (
    <>
      {container.widgets
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((widget, index) => (
          <WidgetItemView
            key={widget.id}
            widget={widget}
            index={index}
            containerId={container.id}
            pageId={pageId}
            selectedWidgetId={selectedWidgetId}
            selectedWidgetIds={selectedWidgetIds}
            onSelectWidget={onSelectWidget}
            contextVariables={contextVariables}
            pageContext={pageContext}
            selectedContainerId={selectedContainerId}
            onSelectContainer={onSelect}
          />
        ))}

      {container.children
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((childContainer) => (
          <div key={childContainer.id} className="col-span-full">
            <LayoutContainer
              container={childContainer}
              isEditMode={false}
              pageId={pageId}
              selectedContainerId={selectedContainerId}
              onSelect={onSelect}
              selectedWidgetId={selectedWidgetId}
              selectedWidgetIds={selectedWidgetIds}
              onSelectWidget={onSelectWidget}
              depth={depth + 1}
              isCompactMode={isCompactMode}
              contextVariables={contextVariables}
              pageContext={pageContext}
            />
          </div>
        ))}

      {container.widgets.length === 0 && container.children.length === 0 && (
        <div className="col-span-full flex items-center justify-center min-h-[80px] text-slate-500 dark:text-slate-400">
          <p className="text-sm"></p>
        </div>
      )}
    </>
  );

  const isContainerEnabled = container.settings?.enabled !== false;

  if (!isContainerEnabled) {
    return null;
  }

  return (
    <div className={cn("space-y-0", container.settings?.customClassName)}>
      <div className="relative transition-all duration-200 min-w-0 overflow-hidden border-transparent">
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
              className={cn(isCompactMode ? "p-1 sm:p-2 min-h-[80px]" : "min-h-[120px]", gridClasses)}
              style={{ gap: `${container.gap}px` }}
            >
              {renderContainerContent()}
            </div>
          </CollapsibleSection>
        ) : (
          <div>
            {container.settings?.showTitle && (
              <div className="px-4 pt-3 pb-1 border-b border-slate-300/30 dark:border-white/10">
                <h3 className="text-sm font-medium text-slate-700 dark:text-white">
                  {container.settings?.title || `Container (${container.columns} col${container.columns !== 1 ? 's' : ''})`}
                </h3>
              </div>
            )}
            <div
              className={cn(isCompactMode ? "p-1 sm:p-2 min-h-[80px]" : "min-h-[120px]", gridClasses)}
              style={{ gap: `${container.gap}px` }}
            >
              {renderContainerContent()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface WidgetItemViewProps {
  widget: WidgetInstance;
  index: number;
  containerId: string;
  pageId: string;
  selectedWidgetId?: string | null;
  selectedWidgetIds?: Set<string>;
  onSelectWidget?: (widgetId: string, pageId?: string) => void;
  contextVariables?: Record<string, any>;
  pageContext?: Record<string, any>;
  selectedContainerId?: string | null;
  onSelectContainer?: (containerId: string, pageId?: string) => void;
}

const WidgetItemView: React.FC<WidgetItemViewProps> = ({
  widget,
  index,
  containerId,
  pageId,
  selectedWidgetId,
  selectedWidgetIds,
  onSelectWidget,
  contextVariables,
  pageContext,
  selectedContainerId,
  onSelectContainer,
}) => {
  const widgetDefinition = widgetRegistry.get(widget.widgetId);

  if (!widgetDefinition) {
    return (
      <div className="relative group border-red-500 bg-red-100 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400 text-sm">
          Widget "{widget.widgetId}" not found in registry
        </p>
      </div>
    );
  }

  const WidgetComponent = widgetDefinition.component;
  const isEnabled = widget.props?.enabled !== false;

  if (!isEnabled) {
    return null;
  }

  return (
    <div className="relative group" id={`widget-item-${widget.id}`}>
      <div
        className={cn(
          "w-full dark:bg-slate-900/10 overflow-hidden transition-all duration-200",
          widget.props?.customClassName || `widget-${widget.id.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          `widget-type-${widget.widgetId}`,
          "border-transparent"
        )}
      >
        <WidgetComponent
          {...(widget.props || {})}
          widgetInstanceId={widget.id}
          widgetDefId={widget.widgetId}
          isEditMode={false}
          onPropsChange={async () => { }}
          selectedWidgetId={selectedWidgetId}
          onSelectWidget={onSelectWidget}
          editingWidgetId={null}
          onEditWidget={() => { }}
          contextVariables={contextVariables}
          pageContext={pageContext}
          selectedContainerId={selectedContainerId}
          onSelectContainer={onSelectContainer}
        />
      </div>
    </div>
  );
};

export default LayoutContainerView;
