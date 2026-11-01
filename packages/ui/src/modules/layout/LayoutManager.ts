import { getLayout, createLayout, updateLayout } from './client-layouts';
import { widgetRegistry } from '@/lib/widgetRegistry';
import { updatePage } from '@/modules/pages/client-pages';

export interface WidgetInstance {
  id: string;
  widgetId: string; // References the widget registry ID
  props?: Record<string, any>;
  order?: number;
  // Flexible Container placement (only used inside FlexibleContainer)
  rowId?: string;
  column?: number;
  // Tracks which snippet this widget was instantiated from
  snippetId?: string;
}

export interface LayoutContainer {
  id: string;
  type: 'container';
  columns: number;
  gap: number;
  widgets: WidgetInstance[];
  children: LayoutContainer[];
  order?: number;
  settings?: {
    collapsible?: boolean;
    collapsed?: boolean;
    title?: string;
    showTitle?: boolean;
    customClassName?: string;
    enabled?: boolean;
  };
}

// Flexible Container: row-based layout with adjustable columns
export interface ColumnDef {
  width: number;
  unit: 'fr' | 'px' | 'rem' | '%';
  minWidth?: number;
}

export interface RowDef {
  id: string;
  columns: ColumnDef[];
  gap?: number;
  sizing?: 'constrained' | 'unconstrained';
  cellAlignments?: ('stretch' | 'start' | 'center' | 'end')[];
  padding?: string; // Tailwind padding class e.g. 'p-2', 'p-4'
}

export interface FlexibleContainer {
  id: string;
  type: 'flex-container';
  rows: RowDef[];
  widgets: WidgetInstance[];
  gap: number;
  order?: number;
  settings?: LayoutContainer['settings'];
}

export type AnyContainer = LayoutContainer | FlexibleContainer;

export interface PageLayout {
  id: string;
  name: string;
  containers: AnyContainer[];
  createdAt: number;
  updatedAt: number;
  loadedBundles?: string[];
  rootTemplate?: string;
}

export interface RootLayoutData {
  pages: Record<string, PageLayout>;
  version: string;
  lastUpdated: number;
}



export class UnifiedLayoutManager {
  private static readonly VERSION = '1.0.0';

  // Type guards
  static isLayoutContainer(c: AnyContainer): c is LayoutContainer {
    return c.type === 'container';
  }

  static isFlexibleContainer(c: AnyContainer): c is FlexibleContainer {
    return c.type === 'flex-container';
  }

  // Helper: get LayoutContainers only (for methods that only operate on old containers)
  static getLayoutContainers(containers: AnyContainer[]): LayoutContainer[] {
    return containers.filter((c): c is LayoutContainer => c.type === 'container');
  }

  // Generate unique IDs
  static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateContainerId(): string {
    return `container-${this.generateId()}`;
  }

  static generateWidgetId(): string {
    return `widget-${this.generateId()}`;
  }

  static generateRowId(): string {
    return `row-${this.generateId()}`;
  }

  // Create a standalone widget instance (for Command pattern)
  static createWidgetInstance(widgetId: string): WidgetInstance {
    let defaultProps = {};
    const widgetDef = widgetRegistry.get(widgetId);
    if (widgetDef && widgetDef.metadata.defaultProps) {
      defaultProps = { ...widgetDef.metadata.defaultProps };
    }

    return {
      id: this.generateWidgetId(),
      widgetId,
      props: defaultProps,
      order: 0
    };
  }

  // Get all widgets in a layout (recursive, supports both container types)
  static getAllWidgets(layout: PageLayout): WidgetInstance[] {
    const widgets: WidgetInstance[] = [];
    const collect = (containers: AnyContainer[]) => {
      containers.forEach(c => {
        widgets.push(...c.widgets);
        if (this.isLayoutContainer(c)) {
          collect(c.children);
        }
      });
    };
    collect(layout.containers);
    return widgets;
  }

  // Load root data from storage (database-only, no localStorage)
  static async loadRootData(pageId?: string): Promise<RootLayoutData> {
    if (!pageId) {
      return { pages: {}, version: this.VERSION, lastUpdated: Date.now() };
    }

    try {
      const isPage = pageId.startsWith('page-');
      const isLayout = pageId.startsWith('layout-') || pageId.startsWith('tabs-');
      if (isPage) {
        const actualId = pageId.replace('page-', '');
        const { fetchPageDetailsById } = await import('@/modules/pages/client-pages');
        const data = await fetchPageDetailsById(actualId);

        if (data && data.page && data.page.content) {
          let content = data.page.content;
          if (typeof content === 'string') {
            try { content = JSON.parse(content); } catch (e) { /* ignore */ }
          }
          // Ensure it has the structure we expect, or wrap it
          // If content is just the PageLayout object
          if ((content as any).id && (content as any).containers) {
            return {
              pages: { [pageId]: content as PageLayout },
              version: this.VERSION,
              lastUpdated: Date.now()
            };
          }
          return content as RootLayoutData;
        }
      } else if (isLayout) {
        const layoutId = pageId.replace(/^(layout-|tabs-)/, '');
        try {
          const { data } = await getLayout(layoutId);
          const layoutJson = data?.layout_json;

          if (layoutJson) {
            return {
              pages: { [pageId]: layoutJson as PageLayout },
              version: this.VERSION,
              lastUpdated: Date.now()
            };
          }
        } catch (e) {
          console.warn('Layout not found or failed to load:', layoutId);
        }
      }
    } catch (error) {
      console.error('Failed to load layouts from database:', error);
    }

    // Return default structure
    return {
      pages: {},
      version: this.VERSION,
      lastUpdated: Date.now()
    };
  }

  // Save root data to storage (database-only, no localStorage)
  static async saveRootData(data: RootLayoutData, pageId?: string, metadata?: Record<string, any>): Promise<void> {
    if (!pageId) return;

    try {
      const isPage = pageId.startsWith('page-');
      const isLayout = pageId.startsWith('layout-') || pageId.startsWith('tabs-');

      if (isPage) {
        const actualId = pageId.replace('page-', '');
        await updatePage(actualId, {
          content: data,
          updated_at: new Date().toISOString(),
          ...(metadata || {})
        });
      } else if (isLayout) {
        const layoutJson = data.pages?.[pageId];
        if (layoutJson) {
          const layoutId = pageId.replace(/^(layout-|tabs-)/, '');
          const layoutData = {
            id: layoutId,
            layout_json: layoutJson,
            meta: metadata,
            name: metadata?.title || `Layout ${pageId}`
          };

          // Upsert logic
          try {
            let exists = false;
            try {
              await getLayout(layoutId);
              exists = true;
            } catch (e) {
              // Assuming 404 or failure means we should try create
            }

            if (exists) {
              await updateLayout(layoutId, layoutData);
            } else {
              await createLayout(layoutData);
            }
          } catch (error) {
            console.error('Failed to save layout via API', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to save layouts to database:', error);
    }
  }


  // Manual save to API
  static async saveToApi(data?: RootLayoutData): Promise<boolean> {
    try {
      const dataToSave = data || await this.loadRootData();
      dataToSave.lastUpdated = Date.now();
      return false;
    } catch (error) {
      console.error('Failed to save layouts to API:', error);
      return false;
    }
  }

  // Get or create page layout (database-only)
  static async getPageLayout(pageId: string, defaultName?: string): Promise<PageLayout> {
    // Load from database
    const rootData = await this.loadRootData(pageId);

    if (!rootData.pages[pageId]) {
      // Create new page layout
      rootData.pages[pageId] = {
        id: pageId,
        name: defaultName || `Page ${pageId}`,
        containers: [
          {
            id: this.generateContainerId(),
            type: 'container',
            columns: 1,
            gap: 16,
            widgets: [],
            children: [],
            order: 0
          }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Save the new layout to database immediately
      await this.savePageLayout(rootData.pages[pageId]);
    }

    return rootData.pages[pageId];
  }

  // Save page layout (database-only)
  static async savePageLayout(layout: PageLayout, metadata?: Record<string, any>): Promise<void> {
    layout.updatedAt = Date.now();

    // Create a minimal RootLayoutData for just this page
    const pageData: RootLayoutData = {
      pages: { [layout.id]: layout },
      version: this.VERSION,
      lastUpdated: Date.now()
    };

    // Save directly to database
    await this.saveRootData(pageData, layout.id, metadata);
  }

  // Find container by ID in layout (recursive, supports both container types)
  static findContainer(containers: AnyContainer[], containerId: string): AnyContainer | null {
    for (const container of containers) {
      if (container.id === containerId) {
        return container;
      }
      if (this.isLayoutContainer(container)) {
        const found = this.findContainer(container.children, containerId);
        if (found) return found;
      }
    }
    return null;
  }

  // Find a LayoutContainer specifically (narrows type)
  static findLayoutContainer(containers: AnyContainer[], containerId: string): LayoutContainer | null {
    const found = this.findContainer(containers, containerId);
    return found && this.isLayoutContainer(found) ? found : null;
  }

  // Find a FlexibleContainer specifically (narrows type)
  static findFlexContainer(containers: AnyContainer[], containerId: string): FlexibleContainer | null {
    const found = this.findContainer(containers, containerId);
    return found && this.isFlexibleContainer(found) ? found : null;
  }

  // Calculate insertion index based on column target
  static calculateWidgetInsertionIndex(container: LayoutContainer, targetColumn?: number): number {
    let order = container.widgets.length;

    if (targetColumn !== undefined && targetColumn >= 0 && targetColumn < container.columns) {
      const occupiedPositionsInColumn = container.widgets
        .map((_, index) => index)
        .filter(index => index % container.columns === targetColumn);

      let targetRow = 0;
      while (occupiedPositionsInColumn.includes(targetRow * container.columns + targetColumn)) {
        targetRow++;
      }

      order = targetRow * container.columns + targetColumn;

      if (order > container.widgets.length) {
        order = container.widgets.length;
      }
    }
    return order;
  }

  // Add widget to specific container
  static addWidgetToContainer(
    layout: PageLayout,
    containerId: string,
    widgetId: string,
    targetColumn?: number
  ): WidgetInstance {
    const container = this.findContainer(layout.containers, containerId);

    if (!container) {
      throw new Error(`Container ${containerId} not found`);
    }

    let order = container.widgets.length;

    // Column targeting only applies to LayoutContainer
    if (this.isLayoutContainer(container) && targetColumn !== undefined && targetColumn >= 0 && targetColumn < container.columns) {
      const occupiedPositionsInColumn = container.widgets
        .map((_, index) => index)
        .filter(index => index % container.columns === targetColumn);

      let targetRow = 0;
      while (occupiedPositionsInColumn.includes(targetRow * container.columns + targetColumn)) {
        targetRow++;
      }

      order = targetRow * container.columns + targetColumn;

      if (order > container.widgets.length) {
        order = container.widgets.length;
      }
    }

    // Get default props from registry if available
    let defaultProps = {};
    const widgetDef = widgetRegistry.get(widgetId);
    if (widgetDef && widgetDef.metadata.defaultProps) {
      defaultProps = { ...widgetDef.metadata.defaultProps };
    }

    const newWidget: WidgetInstance = {
      id: this.generateWidgetId(),
      widgetId,
      props: defaultProps,
      order
    };

    container.widgets.splice(order, 0, newWidget);
    container.widgets.forEach((w, i) => w.order = i);

    return newWidget;
  }



  // Remove widget from container
  static removeWidgetFromContainer(layout: PageLayout, widgetInstanceId: string): boolean {
    const removeFromContainers = (containers: AnyContainer[]): boolean => {
      for (const container of containers) {
        const widgetIndex = container.widgets.findIndex(w => w.id === widgetInstanceId);
        if (widgetIndex >= 0) {
          container.widgets.splice(widgetIndex, 1);
          container.widgets.forEach((w, i) => w.order = i);
          return true;
        }
        if (this.isLayoutContainer(container) && removeFromContainers(container.children)) {
          return true;
        }
      }
      return false;
    };

    return removeFromContainers(layout.containers);
  }



  // Update widget props
  static updateWidgetProps(layout: PageLayout, widgetInstanceId: string, props: Record<string, any>): boolean {
    const findAndUpdateWidget = (containers: AnyContainer[]): boolean => {
      for (const container of containers) {
        const widget = container.widgets.find(w => w.id === widgetInstanceId);
        if (widget) {
          widget.props = { ...widget.props, ...props };
          return true;
        }
        if (this.isLayoutContainer(container) && findAndUpdateWidget(container.children)) {
          return true;
        }
      }
      return false;
    };

    return findAndUpdateWidget(layout.containers);
  }

  // Rename widget (change instance ID)
  static renameWidget(layout: PageLayout, oldId: string, newId: string): boolean {
    // 1. Check if newId already exists
    const findWidget = (containers: AnyContainer[]): boolean => {
      for (const container of containers) {
        if (container.widgets.some(w => w.id === newId)) {
          return true;
        }
        if (this.isLayoutContainer(container) && findWidget(container.children)) {
          return true;
        }
      }
      return false;
    };

    if (findWidget(layout.containers)) {
      console.warn(`Cannot rename widget: ID ${newId} already exists`);
      return false;
    }

    // 2. Find and rename
    const findAndRename = (containers: AnyContainer[]): boolean => {
      for (const container of containers) {
        const widget = container.widgets.find(w => w.id === oldId);
        if (widget) {
          widget.id = newId;
          return true;
        }
        if (this.isLayoutContainer(container) && findAndRename(container.children)) {
          return true;
        }
      }
      return false;
    };

    return findAndRename(layout.containers);
  }



  // Update container columns (LayoutContainer only)
  static updateContainerColumns(layout: PageLayout, containerId: string, columns: number): boolean {
    const container = this.findLayoutContainer(layout.containers, containerId);

    if (container) {
      container.columns = Math.max(1, Math.min(12, columns));
      return true;
    }
    return false;
  }



  // Update container gap
  static async updateContainerGap(pageId: string, containerId: string, gap: number): Promise<void> {
    const layout = await this.getPageLayout(pageId);
    const container = this.findContainer(layout.containers, containerId);

    if (container) {
      container.gap = Math.max(0, gap);
      await this.savePageLayout(layout);
    }
  }

  // Update container settings
  static updateContainerSettings(layout: PageLayout, containerId: string, settings: Partial<LayoutContainer['settings']>): boolean {
    const container = this.findContainer(layout.containers, containerId);

    if (container) {
      container.settings = { ...container.settings, ...settings };
      return true;
    }
    return false;
  }



  // Add new container
  static addContainer(
    layout: PageLayout,
    parentContainerId?: string,
    columns: number = 1
  ): LayoutContainer {
    const newContainer: LayoutContainer = {
      id: this.generateContainerId(),
      type: 'container',
      columns,
      gap: 16,
      widgets: [],
      children: [],
      order: 0
    };

    if (parentContainerId) {
      const parentContainer = this.findLayoutContainer(layout.containers, parentContainerId);
      if (parentContainer) {
        newContainer.order = parentContainer.children.length;
        parentContainer.children.push(newContainer);
      }
    } else {
      newContainer.order = layout.containers.length;
      layout.containers.push(newContainer);
    }

    return newContainer;
  }

  // Add new FlexibleContainer
  static addFlexibleContainer(
    layout: PageLayout,
  ): FlexibleContainer {
    const newContainer: FlexibleContainer = {
      id: this.generateContainerId(),
      type: 'flex-container',
      rows: [{
        id: this.generateRowId(),
        columns: [{ width: 1, unit: 'fr' }, { width: 1, unit: 'fr' }],
        sizing: 'constrained',
      }],
      widgets: [],
      gap: 16,
      order: layout.containers.length
    };

    layout.containers.push(newContainer);
    return newContainer;
  }



  // Remove container
  static removeContainer(layout: PageLayout, containerId: string, allowRemoveLastContainer: boolean = false): boolean {
    // Don't allow removing the last root container (unless explicitly allowed)
    if (!allowRemoveLastContainer && layout.containers.length === 1 && layout.containers[0].id === containerId) {
      return false;
    }

    // Remove from root containers
    const originalLength = layout.containers.length;
    layout.containers = layout.containers.filter(c => c.id !== containerId);

    // Remove from nested containers (recursive)
    const removeFromChildren = (containers: AnyContainer[]) => {
      containers.forEach(container => {
        if (this.isLayoutContainer(container)) {
          container.children = container.children.filter(c => c.id !== containerId);
          removeFromChildren(container.children);
        }
      });
    };

    removeFromChildren(layout.containers);

    // Return true if something was removed
    return layout.containers.length !== originalLength;
  }

  // Move a root-level container up or down
  static moveRootContainer(layout: PageLayout, containerId: string, direction: 'up' | 'down'): boolean {
    const containerIndex = layout.containers.findIndex(c => c.id === containerId);

    if (containerIndex === -1) {
      return false; // Container not found at root level
    }

    const targetIndex = direction === 'up' ? containerIndex - 1 : containerIndex + 1;

    // Check if the move is within the bounds of the array
    if (targetIndex < 0 || targetIndex >= layout.containers.length) {
      return false;
    }

    // Swap the container with its target
    const temp = layout.containers[containerIndex];
    layout.containers[containerIndex] = layout.containers[targetIndex];
    layout.containers[targetIndex] = temp;

    // After swapping, update the order property for all root containers
    layout.containers.forEach((container, index) => {
      container.order = index;
    });

    return true;
  }



  // Move widget in any direction within its container (grid-aware)
  static moveWidgetInContainer(
    layout: PageLayout,
    widgetInstanceId: string,
    direction: 'up' | 'down' | 'left' | 'right'
  ): boolean {

    // Find the widget and its container (LayoutContainer only — grid movement is LC-specific)
    const findWidgetContainer = (containers: AnyContainer[]): LayoutContainer | null => {
      for (const container of containers) {
        if (this.isLayoutContainer(container)) {
          if (container.widgets.some(w => w.id === widgetInstanceId)) {
            return container;
          }
          const found = findWidgetContainer(container.children);
          if (found) return found;
        }
      }
      return null;
    };

    const container = findWidgetContainer(layout.containers);
    if (!container) return false;

    const widgetIndex = container.widgets.findIndex(w => w.id === widgetInstanceId);
    if (widgetIndex === -1) return false;

    const { columns } = container;
    const totalWidgets = container.widgets.length;

    let targetIndex = -1;

    switch (direction) {
      case 'up':
        targetIndex = widgetIndex - columns;
        break;
      case 'down':
        targetIndex = widgetIndex + columns;
        break;
      case 'left':
        // Prevent wrapping from first to last column
        if (widgetIndex % columns !== 0) {
          targetIndex = widgetIndex - 1;
        }
        break;
      case 'right':
        // Prevent wrapping from last to first column
        if ((widgetIndex + 1) % columns !== 0) {
          targetIndex = widgetIndex + 1;
        }
        break;
    }

    // Check if target is valid
    if (targetIndex >= 0 && targetIndex < totalWidgets) {
      // Perform the swap
      [container.widgets[widgetIndex], container.widgets[targetIndex]] =
        [container.widgets[targetIndex], container.widgets[widgetIndex]];

      // Update order values
      container.widgets.forEach((w, i) => w.order = i);
      return true;
    }

    return false;
  }

  // Move widget directionally within a FlexibleContainer
  static moveFlexWidget(
    layout: PageLayout,
    widgetInstanceId: string,
    direction: 'up' | 'down' | 'left' | 'right'
  ): boolean {
    // Find the widget and its flex container
    const findWidgetFlexContainer = (containers: AnyContainer[]): FlexibleContainer | null => {
      for (const container of containers) {
        if (this.isFlexibleContainer(container)) {
          if (container.widgets.some(w => w.id === widgetInstanceId)) {
            return container;
          }
        }
        if (this.isLayoutContainer(container)) {
          const found = findWidgetFlexContainer(container.children);
          if (found) return found;
        }
      }
      return null;
    };

    const container = findWidgetFlexContainer(layout.containers);
    if (!container) return false;

    const widget = container.widgets.find(w => w.id === widgetInstanceId);
    if (!widget || !widget.rowId || widget.column === undefined) return false;

    const rowIndex = container.rows.findIndex(r => r.id === widget.rowId);
    if (rowIndex === -1) return false;

    const currentRow = container.rows[rowIndex];

    switch (direction) {
      case 'left': {
        if (widget.column <= 0) return false;
        widget.column -= 1;
        return true;
      }
      case 'right': {
        if (widget.column >= currentRow.columns.length - 1) return false;
        widget.column += 1;
        return true;
      }
      case 'up': {
        if (rowIndex <= 0) return false;
        const targetRow = container.rows[rowIndex - 1];
        // Clamp column to target row's column count
        widget.rowId = targetRow.id;
        widget.column = Math.min(widget.column, targetRow.columns.length - 1);
        return true;
      }
      case 'down': {
        if (rowIndex >= container.rows.length - 1) return false;
        const targetRow = container.rows[rowIndex + 1];
        widget.rowId = targetRow.id;
        widget.column = Math.min(widget.column, targetRow.columns.length - 1);
        return true;
      }
    }

    return false;
  }

  // Drag-and-drop: move a widget to a specific target location (cross-container)
  // Returns the original position for undo, or null if the move failed.
  static moveWidgetToTarget(
    layout: PageLayout,
    widgetInstanceId: string,
    target: { containerId: string; index?: number; rowId?: string; column?: number }
  ): { containerId: string; index: number; rowId?: string; column?: number } | null {
    // Find widget and source container
    let sourceContainer: AnyContainer | null = null;
    let widget: WidgetInstance | null = null;
    let sourceIndex = -1;

    const findWidget = (containers: AnyContainer[]): boolean => {
      for (const c of containers) {
        const idx = c.widgets.findIndex(w => w.id === widgetInstanceId);
        if (idx >= 0) {
          sourceContainer = c;
          widget = c.widgets[idx];
          sourceIndex = idx;
          return true;
        }
        if (this.isLayoutContainer(c) && findWidget(c.children)) return true;
      }
      return false;
    };
    if (!findWidget(layout.containers) || !widget || !sourceContainer) return null;

    // Capture original position for undo
    const original: { containerId: string; index: number; rowId?: string; column?: number } = {
      containerId: sourceContainer.id,
      index: sourceIndex,
      rowId: (widget as WidgetInstance).rowId,
      column: (widget as WidgetInstance).column,
    };

    // Remove from source
    sourceContainer.widgets.splice(sourceIndex, 1);
    sourceContainer.widgets.forEach((w, i) => w.order = i);

    // Find target container
    const targetContainer = this.findContainer(layout.containers, target.containerId);
    if (!targetContainer) return null;

    // Assign flex placement or clear it
    const w = widget as WidgetInstance;
    if (target.rowId !== undefined) {
      w.rowId = target.rowId;
      w.column = target.column ?? 0;
    } else {
      // Moving to a regular container — clear flex props
      delete w.rowId;
      delete w.column;
    }

    // Insert at target
    const insertIndex = target.index !== undefined
      ? Math.min(target.index, targetContainer.widgets.length)
      : targetContainer.widgets.length;
    targetContainer.widgets.splice(insertIndex, 0, w);
    targetContainer.widgets.forEach((wi, i) => wi.order = i);

    return original;
  }

  // Get grid position of a widget (row, column)
  static getWidgetGridPosition(
    layout: PageLayout,
    widgetInstanceId: string
  ): { row: number; col: number; containerColumns: number } | null {
    // Find the widget and its container (LayoutContainer only)
    const findWidgetContainer = (containers: AnyContainer[]): LayoutContainer | null => {
      for (const container of containers) {
        if (this.isLayoutContainer(container)) {
          if (container.widgets.some(w => w.id === widgetInstanceId)) {
            return container;
          }
          const found = findWidgetContainer(container.children);
          if (found) return found;
        }
      }
      return null;
    };

    const container = findWidgetContainer(layout.containers);
    if (!container) return null;

    const widgetIndex = container.widgets.findIndex(w => w.id === widgetInstanceId);
    if (widgetIndex === -1) return null;

    const row = Math.floor(widgetIndex / container.columns);
    const col = widgetIndex % container.columns;

    return { row, col, containerColumns: container.columns };
  }

  // Move widget to specific grid position (row, column)
  static moveWidgetToGridPosition(
    layout: PageLayout,
    widgetInstanceId: string,
    targetRow: number,
    targetCol: number
  ): boolean {
    // Find the widget and its container (LayoutContainer only)
    const findWidgetContainer = (containers: AnyContainer[]): LayoutContainer | null => {
      for (const container of containers) {
        if (this.isLayoutContainer(container)) {
          if (container.widgets.some(w => w.id === widgetInstanceId)) {
            return container;
          }
          const found = findWidgetContainer(container.children);
          if (found) return found;
        }
      }
      return null;
    };

    const container = findWidgetContainer(layout.containers);
    if (!container) return false;

    const widgetIndex = container.widgets.findIndex(w => w.id === widgetInstanceId);
    if (widgetIndex === -1) return false;

    // Validate target position
    if (targetRow < 0 || targetCol < 0 || targetCol >= container.columns) {
      return false;
    }

    const targetIndex = targetRow * container.columns + targetCol;

    // Don't move to the same position
    if (targetIndex === widgetIndex) {
      return false;
    }

    // For positions beyond current widget array, we can extend the array
    // But we need to ensure we don't create gaps
    if (targetIndex >= container.widgets.length) {
      // Only allow if it's the next logical position (no gaps)
      if (targetIndex > container.widgets.length) {
        return false;
      }
    }

    // Move the widget
    const widget = container.widgets.splice(widgetIndex, 1)[0];

    if (targetIndex >= container.widgets.length) {
      // Append at the end
      container.widgets.push(widget);
    } else {
      // Insert at target position
      container.widgets.splice(targetIndex, 0, widget);
    }

    // Update order values
    container.widgets.forEach((w, i) => w.order = i);

    return true;
  }



  // Move widget within container or between containers (existing method for drag-drop)
  static async moveWidget(
    pageId: string,
    widgetInstanceId: string,
    targetContainerId: string,
    newOrder: number
  ): Promise<void> {
    const layout = await this.getPageLayout(pageId);

    // First, remove widget from current location
    let widget: WidgetInstance | null = null;
    const removeFromContainers = (containers: AnyContainer[]): boolean => {
      for (const container of containers) {
        const widgetIndex = container.widgets.findIndex(w => w.id === widgetInstanceId);
        if (widgetIndex >= 0) {
          widget = container.widgets.splice(widgetIndex, 1)[0];
          // Reorder remaining widgets
          container.widgets.forEach((w, i) => w.order = i);
          return true;
        }
        if (this.isLayoutContainer(container) && removeFromContainers(container.children)) {
          return true;
        }
      }
      return false;
    };

    const wasRemoved = removeFromContainers(layout.containers);
    if (wasRemoved && widget) {
      // Add to target container
      const targetContainer = this.findContainer(layout.containers, targetContainerId);
      if (targetContainer) {
        const widgetToMove = widget as WidgetInstance;
        widgetToMove.order = Math.max(0, Math.min(newOrder, targetContainer.widgets.length));
        targetContainer.widgets.splice(widgetToMove.order, 0, widgetToMove);
        // Reorder all widgets in target container
        targetContainer.widgets.forEach((w, i) => w.order = i);
      }
    }

    await this.savePageLayout(layout);
  }

  // Get container widget count (including nested)
  static getContainerWidgetCount(container: AnyContainer): number {
    let count = container.widgets.length;
    if (this.isLayoutContainer(container)) {
      container.children.forEach(child => {
        count += this.getContainerWidgetCount(child);
      });
    }
    return count;
  }

  // Export layout to JSON
  // Export layout to JSON
  static async exportPageLayout(pageId: string): Promise<string> {
    const layout = await this.getPageLayout(pageId);
    return JSON.stringify(layout, null, 2);
  }

  // Parse layout from JSON (Pure, no side effects)
  static parseLayoutJSON(jsonData: string, targetPageId?: string): PageLayout {
    try {
      const parsedData = JSON.parse(jsonData) as PageLayout;

      // Basic validation
      if (!parsedData.id || !parsedData.containers) {
        throw new Error('Invalid layout data for import.');
      }

      // Check for widget count for debugging
      let widgetCount = 0;
      const countWidgets = (containers: AnyContainer[]) => {
        containers.forEach(c => {
          widgetCount += c.widgets.length;
          if (this.isLayoutContainer(c)) countWidgets(c.children);
        });
      };
      countWidgets(parsedData.containers);

      // Sanitization: Ensure all widget IDs are unique within the imported layout
      const seenIds = new Set<string>();
      const sanitizeIds = (containers: AnyContainer[]) => {
        containers.forEach(container => {
          container.widgets.forEach(widget => {
            if (seenIds.has(widget.id)) {
              const newId = this.generateWidgetId();
              console.warn(`[ULM] Found duplicate widget ID ${widget.id} during import. Regenerating to ${newId}`);
              widget.id = newId;
            }
            seenIds.add(widget.id);
          });
          if (this.isLayoutContainer(container)) sanitizeIds(container.children);
        });
      };
      sanitizeIds(parsedData.containers);

      // Ensure the ID in the JSON matches the target pageId if provided
      if (targetPageId && parsedData.id !== targetPageId) {
        console.warn(`[ULM] Mismatch between target pageId (${targetPageId}) and imported ID (${parsedData.id}). Overwriting ID.`);
        parsedData.id = targetPageId;
      }

      return parsedData;
    } catch (e) {
      console.error("Failed to parse layout JSON", e);
      throw e;
    }
  }

  // Import layout from JSON (Saves to DB)
  static async importPageLayout(pageId: string, jsonData: string): Promise<PageLayout> {
    try {
      const parsedData = this.parseLayoutJSON(jsonData, pageId);

      // Load the existing root data
      const rootData = await this.loadRootData(pageId);

      // Update the specific page layout
      rootData.pages[pageId] = parsedData;
      rootData.lastUpdated = Date.now();

      // Save the updated root data
      await this.saveRootData(rootData, pageId);

      return parsedData;
    } catch (error) {
      console.error(`[ULM] Error importing page layout for ${pageId}:`, error);
      throw error;
    }
  }

  // Clean up invalid widgets from layout
  static async cleanupInvalidWidgets(pageId: string, validWidgetIds: Set<string>): Promise<void> {
    const layout = await this.getPageLayout(pageId);
    let hasChanges = false;

    const cleanContainers = (containers: AnyContainer[]) => {
      containers.forEach(container => {
        const originalLength = container.widgets.length;
        container.widgets = container.widgets.filter(widget => validWidgetIds.has(widget.widgetId));
        if (container.widgets.length !== originalLength) {
          hasChanges = true;
          container.widgets.forEach((w, i) => w.order = i);
        }
        if (this.isLayoutContainer(container)) cleanContainers(container.children);
      });
    };

    cleanContainers(layout.containers);

    if (hasChanges) {
      await this.savePageLayout(layout);
    }
  }

  // Convenience methods for common layouts
  static async getPlaygroundLayout(): Promise<PageLayout> {
    return await this.getPageLayout('playground-layout', 'Playground Layout');
  }

  static async getDashboardLayout(): Promise<PageLayout> {
    return await this.getPageLayout('dashboard-layout', 'Dashboard Layout');
  }
}
