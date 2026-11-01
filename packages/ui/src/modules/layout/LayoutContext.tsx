import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { UnifiedLayoutManager, PageLayout, WidgetInstance, LayoutContainer, FlexibleContainer } from '@/modules/layout/LayoutManager';
import { HistoryManager } from '@/modules/layout/HistoryManager';
import { Command } from '@/modules/layout/types';
import {
  AddWidgetCommand,
  RemoveWidgetCommand,
  UpdateWidgetSettingsCommand,
  AddContainerCommand,
  RemoveContainerCommand,
  MoveContainerCommand,
  MoveWidgetCommand,
  UpdateContainerColumnsCommand,
  UpdateContainerSettingsCommand,
  RenameWidgetCommand,
  ReplaceLayoutCommand,
  AddFlexContainerCommand
} from '@/modules/layout/commands';


interface LayoutContextType {
  // Generic page management
  loadPageLayout: (pageId: string, defaultName?: string) => Promise<void>;
  getLoadedPageLayout: (pageId: string) => PageLayout | null;
  clearPageLayout: (pageId: string) => Promise<void>;

  // Generic page actions
  addWidgetToPage: (pageId: string, containerId: string, widgetId: string, targetColumn?: number, rowId?: string, initialProps?: Record<string, any>) => Promise<WidgetInstance>;
  removeWidgetFromPage: (pageId: string, widgetInstanceId: string) => Promise<void>;
  moveWidgetInPage: (pageId: string, widgetInstanceId: string, direction: 'up' | 'down' | 'left' | 'right') => Promise<void>;
  updatePageContainerColumns: (pageId: string, containerId: string, columns: number) => Promise<void>;
  updatePageContainerSettings: (pageId: string, containerId: string, settings: Partial<LayoutContainer['settings']>) => Promise<void>;
  addPageContainer: (pageId: string, parentContainerId?: string) => Promise<LayoutContainer>;
  addFlexPageContainer: (pageId: string) => Promise<FlexibleContainer>;
  removePageContainer: (pageId: string, containerId: string) => Promise<void>;
  movePageContainer: (pageId: string, containerId: string, direction: 'up' | 'down') => Promise<void>;
  updateWidgetProps: (pageId: string, widgetInstanceId: string, props: Record<string, any>) => Promise<void>;
  renameWidget: (pageId: string, widgetInstanceId: string, newId: string) => Promise<boolean>;
  exportPageLayout: (pageId: string) => Promise<string>;
  importPageLayout: (pageId: string, jsonData: string) => Promise<PageLayout>;
  hydratePageLayout: (pageId: string, layout: PageLayout) => void;

  // Manual save
  saveToApi: () => Promise<boolean>;

  // History Actions
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
  executeCommand: (command: Command) => Promise<void>;

  // State
  isLoading: boolean;
  loadedPages: Map<string, PageLayout>;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

interface LayoutProviderProps {
  children: ReactNode;
}

export const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
  const [loadedPages, setLoadedPages] = useState<Map<string, PageLayout>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // History State
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Pending Metadata State
  const [pendingMetadata, setPendingMetadata] = useState<Map<string, Record<string, any>>>(new Map());

  const updateLayoutCallback = useCallback((pageId: string, layout: PageLayout) => {
    setLoadedPages(prev => new Map(prev).set(pageId, layout));
    // UnifiedLayoutManager.savePageLayout(layout).catch(e => console.error("Failed to persist layout update", e));
  }, []);

  const updatePageMetadataCallback = useCallback((pageId: string, metadata: Record<string, any>) => {
    setPendingMetadata(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(pageId) || {};
      newMap.set(pageId, { ...existing, ...metadata });
      return newMap;
    });
  }, []);

  const [historyManager] = useState(() => new HistoryManager({
    pageId: '',
    layouts: loadedPages,
    updateLayout: updateLayoutCallback,
    pageMetadata: pendingMetadata,
    updatePageMetadata: updatePageMetadataCallback
  }));

  // Update history manager context when state changes
  useEffect(() => {
    // We need to update the context inside historyManager so it has access to latest state
    // but HistoryManager doesn't preserve context reference, it uses it per execute/undo/redo.
    // However, for 'executeCommand' prop below, we construct a fresh context.
  }, [loadedPages, pendingMetadata, updateLayoutCallback, updatePageMetadataCallback]);


  const updateHistoryState = useCallback(() => {
    setCanUndo(historyManager.canUndo());
    setCanRedo(historyManager.canRedo());
  }, [historyManager]);

  useEffect(() => {
    updateHistoryState();
  }, [historyManager, loadedPages, pendingMetadata]);

  // Load layout
  const loadPageLayout = useCallback(async (pageId: string, defaultName?: string) => {
    try {
      const layout = await UnifiedLayoutManager.getPageLayout(pageId, defaultName);
      setLoadedPages(prev => new Map(prev).set(pageId, layout));
    } catch (e) {
      console.error("Failed to load page layout", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getLoadedPageLayout = useCallback((pageId: string) => {
    return loadedPages.get(pageId) || null;
  }, [loadedPages]);

  const clearPageLayout = useCallback(async (pageId: string) => {
    setLoadedPages(prev => {
      const next = new Map(prev);
      next.delete(pageId);
      return next;
    });
  }, []);

  // Widget Actions
  const addWidgetToPage = useCallback(async (pageId: string, containerId: string, widgetId: string, targetColumn?: number, rowId?: string, initialProps?: Record<string, any>) => {
    const layout = loadedPages.get(pageId);
    if (!layout) throw new Error("Layout not loaded");

    const widgetInstance = UnifiedLayoutManager.createWidgetInstance(widgetId);
    if (initialProps) {
      widgetInstance.props = { ...widgetInstance.props, ...initialProps };
    }

    // For flex containers, set cell placement
    if (rowId) {
      widgetInstance.rowId = rowId;
      widgetInstance.column = targetColumn ?? 0;
    }

    // Use Command for Undo/Redo
    const command = new AddWidgetCommand(pageId, containerId, widgetInstance, -1);
    await historyManager.execute(command, {
      pageId,
      layouts: loadedPages,
      updateLayout: updateLayoutCallback,
      pageMetadata: pendingMetadata,
      updatePageMetadata: updatePageMetadataCallback
    });
    updateHistoryState();
    return widgetInstance;
  }, [loadedPages, historyManager, updateLayoutCallback, pendingMetadata, updatePageMetadataCallback, updateHistoryState]);

  const removeWidgetFromPage = useCallback(async (pageId: string, widgetInstanceId: string) => {
    const command = new RemoveWidgetCommand(pageId, widgetInstanceId);
    await historyManager.execute(command, {
      pageId,
      layouts: loadedPages,
      updateLayout: updateLayoutCallback,
      pageMetadata: pendingMetadata,
      updatePageMetadata: updatePageMetadataCallback
    });
    updateHistoryState();
  }, [loadedPages, historyManager, updateLayoutCallback, pendingMetadata, updatePageMetadataCallback, updateHistoryState]);

  const updateWidgetProps = useCallback(async (pageId: string, widgetInstanceId: string, props: Record<string, any>) => {
    const propsKeys = Object.keys(props);
    const isTabSync = propsKeys.includes('tabs');
    if (isTabSync) {
      console.log('[LayoutContext updateWidgetProps] TAB SYNC-BACK received', {
        pageId, widgetInstanceId, timestamp: Date.now(),
        loadedPagesKeys: [...loadedPages.keys()],
        parentLayoutUpdatedAt: loadedPages.get(pageId)?.updatedAt,
        props
      });
    }
    const command = new UpdateWidgetSettingsCommand(pageId, widgetInstanceId, props);
    await historyManager.execute(command, {
      pageId,
      layouts: loadedPages,
      updateLayout: updateLayoutCallback,
      pageMetadata: pendingMetadata,
      updatePageMetadata: updatePageMetadataCallback
    });
    updateHistoryState();
  }, [loadedPages, historyManager, updateLayoutCallback, pendingMetadata, updatePageMetadataCallback, updateHistoryState]);

  // Other Actions (Direct Update for now)
  const moveWidgetInPage = useCallback(async (pageId: string, widgetInstanceId: string, direction: 'up' | 'down' | 'left' | 'right') => {
    const layout = loadedPages.get(pageId);
    if (!layout) return;

    const command = new MoveWidgetCommand(pageId, widgetInstanceId, direction);
    await historyManager.execute(command, {
      pageId,
      layouts: loadedPages,
      updateLayout: updateLayoutCallback,
      pageMetadata: pendingMetadata,
      updatePageMetadata: updatePageMetadataCallback
    });
    updateHistoryState();
  }, [loadedPages, historyManager, updateLayoutCallback, pendingMetadata, updatePageMetadataCallback, updateHistoryState]);

  const updatePageContainerColumns = useCallback(async (pageId: string, containerId: string, columns: number) => {
    const layout = loadedPages.get(pageId);
    if (!layout) return;
    const command = new UpdateContainerColumnsCommand(pageId, containerId, columns);
    await historyManager.execute(command, {
      pageId,
      layouts: loadedPages,
      updateLayout: updateLayoutCallback,
      pageMetadata: pendingMetadata,
      updatePageMetadata: updatePageMetadataCallback
    });
    updateHistoryState();
  }, [loadedPages, historyManager, updateLayoutCallback, pendingMetadata, updatePageMetadataCallback, updateHistoryState]);

  const updatePageContainerSettings = useCallback(async (pageId: string, containerId: string, settings: Partial<LayoutContainer['settings']>) => {
    const layout = loadedPages.get(pageId);
    if (!layout) return;
    const command = new UpdateContainerSettingsCommand(pageId, containerId, settings);
    await historyManager.execute(command, {
      pageId,
      layouts: loadedPages,
      updateLayout: updateLayoutCallback,
      pageMetadata: pendingMetadata,
      updatePageMetadata: updatePageMetadataCallback
    });
    updateHistoryState();
  }, [loadedPages, historyManager, updateLayoutCallback, pendingMetadata, updatePageMetadataCallback, updateHistoryState]);

  const addPageContainer = useCallback(async (pageId: string, parentContainerId?: string) => {
    const layout = loadedPages.get(pageId);
    if (!layout) throw new Error("Layout not loaded");
    // Create container instance first (pure)
    // UnifiedLayoutManager.addContainer mutates, checking if we can generate detached container?
    // We can't easily generate detached container with UnifiedLayoutManager.addContainer without a layout.
    // So we manually create it here or use a helper that doesn't attach.
    // UnifiedLayoutManager.generateContainerId is static.

    // Manual creation to follow command pattern:
    const newContainer: LayoutContainer = {
      id: UnifiedLayoutManager.generateContainerId(),
      type: 'container',
      columns: 1,
      gap: 16,
      widgets: [],
      children: [],
      order: 0 // Command execution will set order
    };

    const command = new AddContainerCommand(pageId, newContainer, parentContainerId);
    await historyManager.execute(command, {
      pageId,
      layouts: loadedPages,
      updateLayout: updateLayoutCallback,
      pageMetadata: pendingMetadata,
      updatePageMetadata: updatePageMetadataCallback
    });
    updateHistoryState();
    return newContainer;
  }, [loadedPages, historyManager, updateLayoutCallback, pendingMetadata, updatePageMetadataCallback, updateHistoryState]);

  const addFlexPageContainer = useCallback(async (pageId: string) => {
    const layout = loadedPages.get(pageId);
    if (!layout) throw new Error("Layout not loaded");

    const newContainer: FlexibleContainer = {
      id: UnifiedLayoutManager.generateContainerId(),
      type: 'flex-container',
      rows: [{
        id: UnifiedLayoutManager.generateRowId(),
        columns: [{ width: 1, unit: 'fr' }, { width: 1, unit: 'fr' }],
        sizing: 'constrained',
      }],
      widgets: [],
      gap: 16,
      order: 0,
    };

    const command = new AddFlexContainerCommand(pageId, newContainer);
    await historyManager.execute(command, {
      pageId,
      layouts: loadedPages,
      updateLayout: updateLayoutCallback,
      pageMetadata: pendingMetadata,
      updatePageMetadata: updatePageMetadataCallback
    });
    updateHistoryState();
    return newContainer;
  }, [loadedPages, historyManager, updateLayoutCallback, pendingMetadata, updatePageMetadataCallback, updateHistoryState]);

  const removePageContainer = useCallback(async (pageId: string, containerId: string) => {
    const layout = loadedPages.get(pageId);
    if (!layout) return;
    const command = new RemoveContainerCommand(pageId, containerId);
    await historyManager.execute(command, {
      pageId,
      layouts: loadedPages,
      updateLayout: updateLayoutCallback,
      pageMetadata: pendingMetadata,
      updatePageMetadata: updatePageMetadataCallback
    });
    updateHistoryState();
  }, [loadedPages, historyManager, updateLayoutCallback, pendingMetadata, updatePageMetadataCallback, updateHistoryState]);

  const movePageContainer = useCallback(async (pageId: string, containerId: string, direction: 'up' | 'down') => {
    const layout = loadedPages.get(pageId);
    if (!layout) return;
    const command = new MoveContainerCommand(pageId, containerId, direction);
    await historyManager.execute(command, {
      pageId,
      layouts: loadedPages,
      updateLayout: updateLayoutCallback,
      pageMetadata: pendingMetadata,
      updatePageMetadata: updatePageMetadataCallback
    });
    updateHistoryState();
  }, [loadedPages, historyManager, updateLayoutCallback, pendingMetadata, updatePageMetadataCallback, updateHistoryState]);

  const renameWidget = useCallback(async (pageId: string, widgetInstanceId: string, newId: string) => {
    const layout = loadedPages.get(pageId);
    if (!layout) return false;
    const command = new RenameWidgetCommand(pageId, widgetInstanceId, newId);
    await historyManager.execute(command, {
      pageId,
      layouts: loadedPages,
      updateLayout: updateLayoutCallback,
      pageMetadata: pendingMetadata,
      updatePageMetadata: updatePageMetadataCallback
    });
    updateHistoryState();
    return true; // Command execution is async void, we assume success if no throw
  }, [loadedPages, historyManager, updateLayoutCallback, pendingMetadata, updatePageMetadataCallback, updateHistoryState]);

  const exportPageLayout = useCallback(async (pageId: string) => {
    return UnifiedLayoutManager.exportPageLayout(pageId);
  }, []);

  const importPageLayout = useCallback(async (pageId: string, jsonData: string) => {
    // Use parseLayoutJSON (pure) then execute ReplaceLayoutCommand
    const parsedLayout = UnifiedLayoutManager.parseLayoutJSON(jsonData, pageId);

    const command = new ReplaceLayoutCommand(pageId, parsedLayout);
    await historyManager.execute(command, {
      pageId,
      layouts: loadedPages,
      updateLayout: updateLayoutCallback,
      pageMetadata: pendingMetadata,
      updatePageMetadata: updatePageMetadataCallback
    });
    updateHistoryState();
    return parsedLayout;
  }, [loadedPages, historyManager, updateLayoutCallback, pendingMetadata, updatePageMetadataCallback, updateHistoryState]);

  const hydratePageLayout = useCallback((pageId: string, layout: PageLayout) => {
    setLoadedPages(prev => new Map(prev).set(pageId, layout));
    setIsLoading(false);
  }, []);

  const saveToApi = useCallback(async (): Promise<boolean> => {
    return true;
  }, []);

  const undo = async () => {
    await historyManager.undo({
      pageId: '',
      layouts: loadedPages,
      updateLayout: updateLayoutCallback,
      pageMetadata: pendingMetadata,
      updatePageMetadata: updatePageMetadataCallback
    });
    updateHistoryState();
  };

  const redo = async () => {
    await historyManager.redo({
      pageId: '',
      layouts: loadedPages,
      updateLayout: updateLayoutCallback,
      pageMetadata: pendingMetadata,
      updatePageMetadata: updatePageMetadataCallback
    });
    updateHistoryState();
  };

  const clearHistory = useCallback(() => {
    historyManager.clear();
    updateHistoryState();
  }, [historyManager, updateHistoryState]);

  return (
    <LayoutContext.Provider value={{
      // ... existing values ...
      loadPageLayout,
      getLoadedPageLayout,
      clearPageLayout,
      addWidgetToPage,
      removeWidgetFromPage,
      moveWidgetInPage,
      updatePageContainerColumns,
      updatePageContainerSettings,
      addPageContainer,
      addFlexPageContainer,
      removePageContainer,
      movePageContainer,
      updateWidgetProps,
      renameWidget,
      saveToApi,
      exportPageLayout,
      importPageLayout,
      hydratePageLayout,
      isLoading,
      loadedPages,
      undo,
      redo,
      canUndo,
      canRedo,
      clearHistory,
      executeCommand: async (command: Command) => {
        await historyManager.execute(command, {
          pageId: '',
          layouts: loadedPages,
          updateLayout: updateLayoutCallback,
          pageMetadata: pendingMetadata,
          updatePageMetadata: updatePageMetadataCallback
        });
        updateHistoryState();
      }
    }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = (): LayoutContextType => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};
