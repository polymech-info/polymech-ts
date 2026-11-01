import React, { useEffect, useMemo } from 'react';
import { GenericCanvas } from '@/modules/layout/GenericCanvas';
import { useLayout } from '@/modules/layout/LayoutContext';
import { PageLayout } from '@/modules/layout/LayoutManager';

interface LayoutContainerWidgetProps {
  widgetInstanceId: string;
  onPropsChange: (props: Record<string, any>) => void;
  isEditMode?: boolean;
  // Props from widget settings
  nestedPageId?: string;
  nestedPageName?: string;
  showControls?: boolean;
  nestedLayoutData?: PageLayout;
  selectedWidgetId?: string | null;
  onSelectWidget?: (id: string, pageId?: string) => void;
  editingWidgetId?: string | null;
  onEditWidget?: (id: string | null) => void;
  contextVariables?: Record<string, any>;
}

const LayoutContainerWidget: React.FC<LayoutContainerWidgetProps> = ({
  widgetInstanceId,
  onPropsChange,
  isEditMode = false,
  nestedPageId,
  nestedPageName = 'Nested Canvas',
  showControls = false,
  nestedLayoutData,
  selectedWidgetId,
  onSelectWidget,
  editingWidgetId,
  onEditWidget,
  contextVariables,
}) => {
  const { loadedPages } = useLayout();

  // Generate a unique pageId for the nested canvas if it doesn't exist.
  const uniqueNestedPageId = useMemo(() => {
    if (nestedPageId) {
      return nestedPageId;
    }
    const newId = `nested-layout-${widgetInstanceId}`;
    return newId;
  }, [nestedPageId, widgetInstanceId]);

  // If a new ID was generated, save it back to the widget's props.
  useEffect(() => {
    if (!nestedPageId) {
      setTimeout(() => {
        onPropsChange({ nestedPageId: uniqueNestedPageId });
      }, 0);
    }
  }, [nestedPageId, uniqueNestedPageId, onPropsChange]);

  // Sync Layout Data back to props (Persist nested layout changes)
  useEffect(() => {
    if (uniqueNestedPageId && isEditMode) {
      const currentLayout = loadedPages.get(uniqueNestedPageId);
      if (currentLayout) {
        const propTimestamp = nestedLayoutData?.updatedAt || 0;
        if (currentLayout.updatedAt > propTimestamp) {
          const layoutChanged = JSON.stringify(currentLayout) !== JSON.stringify(nestedLayoutData);
          if (layoutChanged) {
            onPropsChange({ nestedLayoutData: currentLayout });
          }
        }
      }
    }
  }, [uniqueNestedPageId, loadedPages, isEditMode, onPropsChange, nestedLayoutData]);


  if (!nestedPageId) {
    return <div className="p-4 text-center text-slate-500">Initializing nested layout...</div>;
  }

  return (
    <GenericCanvas
      pageId={uniqueNestedPageId}
      pageName={nestedPageName}
      isEditMode={isEditMode}
      showControls={showControls}
      className="p-0"
      initialLayout={nestedLayoutData}
      selectedWidgetId={selectedWidgetId}
      onSelectWidget={onSelectWidget}
      editingWidgetId={editingWidgetId}
      onEditWidget={onEditWidget}
      contextVariables={contextVariables}
    />
  );
};

export default LayoutContainerWidget;
