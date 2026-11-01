import { Command, CommandContext } from './types';
// Force rebuild

import { WidgetInstance, PageLayout, LayoutContainer, FlexibleContainer, AnyContainer, UnifiedLayoutManager, ColumnDef } from '@/modules/layout/LayoutManager';

// Helper to find a container by ID in the layout tree
const findContainer = (containers: AnyContainer[], id: string): AnyContainer | null => {
    for (const container of containers) {
        if (container.id === id) return container;
        if (container.type === 'container' && container.children) {
            const found = findContainer(container.children, id);
            if (found) return found;
        }
    }
    return null;
};

// Helper to find a LayoutContainer specifically
const findLayoutContainer = (containers: AnyContainer[], id: string): LayoutContainer | null => {
    const found = findContainer(containers, id);
    return found && found.type === 'container' ? found as LayoutContainer : null;
};

// Helper to finding parent container
const findParentContainer = (containers: AnyContainer[], childId: string): LayoutContainer | null => {
    for (const container of containers) {
        if (container.type === 'container') {
            if (container.children.some(c => c.id === childId)) return container;
            const found = findParentContainer(container.children, childId);
            if (found) return found;
        }
    }
    return null;
}

// Helper to find widget location
const findWidgetLocation = (containers: AnyContainer[], widgetId: string): { container: AnyContainer, index: number, widget: WidgetInstance } | null => {
    for (const container of containers) {
        const idx = container.widgets.findIndex(w => w.id === widgetId);
        if (idx !== -1) {
            return { container, index: idx, widget: container.widgets[idx] };
        }
        if (container.type === 'container' && container.children) {
            const found = findWidgetLocation(container.children, widgetId);
            if (found) return found;
        }
    }
    return null;
};

// --- Add Widget Command ---
export class AddWidgetCommand implements Command {
    id: string;
    type = 'ADD_WIDGET';
    timestamp: number;

    private pageId: string;
    private containerId: string;
    private widget: WidgetInstance;
    private index: number;

    constructor(pageId: string, containerId: string, widget: WidgetInstance, index: number = -1) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.containerId = containerId;
        this.widget = widget;
        this.index = index;
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        // Clone layout to avoid mutation
        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const container = findContainer(newLayout.containers, this.containerId);

        if (!container) throw new Error(`Container not found: ${this.containerId}`);

        if (this.index === -1) {
            container.widgets.push(this.widget);
        } else {
            container.widgets.splice(this.index, 0, this.widget);
        }

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }

    async undo(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;

        // Find widget anywhere (robust against moves)
        const location = findWidgetLocation(newLayout.containers, this.widget.id);

        if (location) {
            location.container.widgets.splice(location.index, 1);
            newLayout.updatedAt = Date.now();
            context.updateLayout(this.pageId, newLayout);
        } else {
            console.warn(`Widget ${this.widget.id} not found for undo add`);
        }
    }
}

// --- Remove Widget Command ---
export class RemoveWidgetCommand implements Command {
    id: string;
    type = 'REMOVE_WIDGET';
    timestamp: number;

    private pageId: string;
    private widgetId: string;

    // State capture for undo
    private containerId: string | null = null;
    private index: number = -1;
    private widget: WidgetInstance | null = null;

    constructor(pageId: string, widgetId: string) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.widgetId = widgetId;
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        // 1. Capture state BEFORE modification
        const location = findWidgetLocation(layout.containers, this.widgetId);

        if (!location) {
            console.warn(`Widget ${this.widgetId} not found for removal`);
            return;
        }

        this.containerId = location.container.id;
        this.index = location.index;
        this.widget = location.widget;

        // 2. Perform Removal
        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const newLocation = findWidgetLocation(newLayout.containers, this.widgetId);

        if (newLocation) {
            newLocation.container.widgets.splice(newLocation.index, 1);
            newLayout.updatedAt = Date.now();
            context.updateLayout(this.pageId, newLayout);
        }
    }

    async undo(context: CommandContext): Promise<void> {
        if (!this.containerId || !this.widget || this.index === -1) {
            throw new Error("Cannot undo remove: State was not captured correctly");
        }

        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const container = findContainer(newLayout.containers, this.containerId);

        if (!container) throw new Error(`Original container ${this.containerId} not found`);

        // Restore widget at original index
        // Ensure index is valid
        if (this.index > container.widgets.length) {
            container.widgets.push(this.widget);
        } else {
            container.widgets.splice(this.index, 0, this.widget);
        }

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }
}

// --- Update Widget Settings Command ---
export class UpdateWidgetSettingsCommand implements Command {
    id: string;
    type = 'UPDATE_WIDGET_SETTINGS';
    timestamp: number;

    private pageId: string;
    private widgetId: string;
    private newSettings: Record<string, any>; // Store full new settings or partial? Partial is what comes in.

    // State capture for undo
    private oldSettings: Record<string, any> | null = null;

    constructor(pageId: string, widgetId: string, newSettings: Record<string, any>) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.widgetId = widgetId;
        this.newSettings = newSettings;
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        // 1. Capture state (snapshot of current props) BEFORE modification
        // We need to find the widget in the CURRENT layout to get old props
        const location = findWidgetLocation(layout.containers, this.widgetId);

        if (!location) {
            console.warn(`Widget ${this.widgetId} not found for update`);
            return;
        }

        // Only capture oldSettings the FIRST time execute is called (or if we want to support re-execution)
        // Since we create a NEW command instance for every user action, this is fine.
        // But for Redo, we don't want to recapture 'oldSettings' from the *already updated* state if we were in a weird state.
        // Actually, Redo implies we are going from Undo -> Redo.
        // Undo restored oldSettings. So Redo will see oldSettings.
        // So capturing it again is fine, OR we check if it's null.
        if (!this.oldSettings) {
            this.oldSettings = JSON.parse(JSON.stringify(location.widget.props || {}));
        }

        // 2. Perform Update
        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const newLocation = findWidgetLocation(newLayout.containers, this.widgetId);

        if (newLocation) {
            // merge
            newLocation.widget.props = { ...newLocation.widget.props, ...this.newSettings };
            newLayout.updatedAt = Date.now();
            context.updateLayout(this.pageId, newLayout);
        }
    }

    async undo(context: CommandContext): Promise<void> {
        if (!this.oldSettings) {
            console.warn("Cannot undo update: State was not captured");
            return;
        }

        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const location = findWidgetLocation(newLayout.containers, this.widgetId);

        if (location) {
            // Restore exact old props
            location.widget.props = this.oldSettings;
            newLayout.updatedAt = Date.now();
            context.updateLayout(this.pageId, newLayout);
        } else {
            console.warn(`Widget ${this.widgetId} not found for undo update`);
        }
    }
}
// --- Update Page Parent Command ---
export class UpdatePageParentCommand implements Command {
    id: string;
    type = 'UPDATE_PAGE_PARENT';
    timestamp: number;

    private pageId: string;
    private oldParent: { id: string | null, title?: string, slug?: string } | null;
    private newParent: { id: string | null, title?: string, slug?: string } | null;
    private onUpdate?: (parent: { id: string | null, title?: string, slug?: string } | null) => void;

    constructor(
        pageId: string,
        oldParent: { id: string | null, title?: string, slug?: string } | null,
        newParent: { id: string | null, title?: string, slug?: string } | null,
        onUpdate?: (parent: { id: string | null, title?: string, slug?: string } | null) => void
    ) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.oldParent = oldParent;
        this.newParent = newParent;
        this.onUpdate = onUpdate;
    }

    async execute(context: CommandContext): Promise<void> {
        // Update local metadata state through context
        context.updatePageMetadata(this.pageId, { parent: this.newParent?.id ?? null });

        if (this.onUpdate) this.onUpdate(this.newParent);
    }

    async undo(context: CommandContext): Promise<void> {
        // Revert local metadata state
        context.updatePageMetadata(this.pageId, { parent: this.oldParent?.id ?? null });

        if (this.onUpdate) this.onUpdate(this.oldParent);
    }
}

// --- Update Page Meta Command ---
export class UpdatePageMetaCommand implements Command {
    id: string;
    type = 'UPDATE_PAGE_META';
    timestamp: number;

    private pageId: string;
    private oldMeta: Record<string, any>;
    private newMeta: Record<string, any>;
    private onUpdate?: (meta: Record<string, any>) => void;

    constructor(
        pageId: string,
        oldMeta: Record<string, any>,
        newMeta: Record<string, any>,
        onUpdate?: (meta: Record<string, any>) => void
    ) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.oldMeta = oldMeta;
        this.newMeta = newMeta;
        this.onUpdate = onUpdate;
    }

    async execute(context: CommandContext): Promise<void> {
        context.updatePageMetadata(this.pageId, this.newMeta);
        if (this.onUpdate) this.onUpdate(this.newMeta);
    }

    async undo(context: CommandContext): Promise<void> {
        context.updatePageMetadata(this.pageId, this.oldMeta);
        if (this.onUpdate) this.onUpdate(this.oldMeta);
    }
}

// --- Add Container Command ---
export class AddContainerCommand implements Command {
    id: string;
    type = 'ADD_CONTAINER';
    timestamp: number;

    private pageId: string;
    private parentContainerId?: string;
    private container: LayoutContainer;

    constructor(pageId: string, container: LayoutContainer, parentContainerId?: string) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.container = container;
        this.parentContainerId = parentContainerId;
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;

        if (this.parentContainerId) {
            const parent = findLayoutContainer(newLayout.containers, this.parentContainerId);
            if (parent) {
                this.container.order = parent.children.length;
                parent.children.push(this.container);
            }
        } else {
            this.container.order = newLayout.containers.length;
            newLayout.containers.push(this.container);
        }

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }

    async undo(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;

        const remove = (containers: AnyContainer[]): boolean => {
            const idx = containers.findIndex(c => c.id === this.container.id);
            if (idx !== -1) {
                containers.splice(idx, 1);
                containers.forEach((c, i) => c.order = i);
                return true;
            }
            for (const c of containers) {
                if (c.type === 'container' && remove(c.children)) return true;
            }
            return false;
        };

        remove(newLayout.containers);
        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }
}

// --- Batch Add Containers Command ---
// Adds multiple containers in a single execute() against one layout snapshot.
// Avoids React state-batching issue where sequential AddContainerCommand calls
// each read the same stale snapshot and only the last one survives.
export class BatchAddContainersCommand implements Command {
    id: string;
    type = 'BATCH_ADD_CONTAINERS';
    timestamp: number;

    private pageId: string;
    private containers: LayoutContainer[];

    constructor(pageId: string, containers: LayoutContainer[]) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.containers = containers;
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;

        for (const container of this.containers) {
            container.order = newLayout.containers.length;
            newLayout.containers.push(container);
        }

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }

    async undo(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;

        const idsToRemove = new Set(this.containers.map(c => c.id));
        newLayout.containers = newLayout.containers.filter(c => !idsToRemove.has(c.id));
        newLayout.containers.forEach((c, i) => c.order = i);

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }
}

// --- Remove Container Command ---
export class RemoveContainerCommand implements Command {
    id: string;
    type = 'REMOVE_CONTAINER';
    timestamp: number;

    private pageId: string;
    private containerId: string;

    // State capture
    private parentId: string | null = null;
    private index: number = -1;
    private container: AnyContainer | null = null;

    constructor(pageId: string, containerId: string) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.containerId = containerId;
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        // Capture state
        const findAndCapture = (containers: AnyContainer[], parentId: string | null) => {
            for (let i = 0; i < containers.length; i++) {
                if (containers[i].id === this.containerId) {
                    this.parentId = parentId;
                    this.index = i;
                    this.container = JSON.parse(JSON.stringify(containers[i])); // Deep clone
                    return true;
                }
                if (containers[i].type === 'container') {
                    if (findAndCapture((containers[i] as LayoutContainer).children, containers[i].id)) return true;
                }
            }
            return false;
        };

        if (findAndCapture(layout.containers, null)) {
            const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
            newLayout.updatedAt = Date.now();
            UnifiedLayoutManager.removeContainer(newLayout, this.containerId, true);
            context.updateLayout(this.pageId, newLayout);
        } else {
            console.warn(`Container ${this.containerId} not found for removal`);
        }
    }

    async undo(context: CommandContext): Promise<void> {
        if (!this.container || this.index === -1) {
            console.warn("Cannot undo remove container: State not captured");
            return;
        }

        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;

        if (this.parentId === null) {
            // Root container
            if (this.index >= newLayout.containers.length) {
                newLayout.containers.push(this.container);
            } else {
                newLayout.containers.splice(this.index, 0, this.container);
            }
            newLayout.containers.forEach((c, i) => c.order = i);
        } else {
            const parent = findLayoutContainer(newLayout.containers, this.parentId);
            if (parent) {
                if (this.index >= parent.children.length) {
                    parent.children.push(this.container as LayoutContainer);
                } else {
                    parent.children.splice(this.index, 0, this.container as LayoutContainer);
                }
                parent.children.forEach((c, i) => c.order = i);
            }
        }

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }
}

// --- Move Container Command ---
export class MoveContainerCommand implements Command {
    id: string;
    type = 'MOVE_CONTAINER';
    timestamp: number;

    private pageId: string;
    private containerId: string;
    private direction: 'up' | 'down';

    constructor(pageId: string, containerId: string, direction: 'up' | 'down') {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.containerId = containerId;
        this.direction = direction;
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) return;

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        if (UnifiedLayoutManager.moveRootContainer(newLayout, this.containerId, this.direction)) {
            newLayout.updatedAt = Date.now();
            context.updateLayout(this.pageId, newLayout);
        }
    }

    async undo(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) return;

        const reverseDirection = this.direction === 'up' ? 'down' : 'up';
        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        if (UnifiedLayoutManager.moveRootContainer(newLayout, this.containerId, reverseDirection)) {
            newLayout.updatedAt = Date.now();
            context.updateLayout(this.pageId, newLayout);
        }
    }
}

// --- Move Widget Command ---
export class MoveWidgetCommand implements Command {
    id: string;
    type = 'MOVE_WIDGET';
    timestamp: number;

    private pageId: string;
    private widgetId: string;
    private direction: 'up' | 'down' | 'left' | 'right';

    constructor(pageId: string, widgetId: string, direction: 'up' | 'down' | 'left' | 'right') {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.widgetId = widgetId;
        this.direction = direction;
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) return;

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const moved = UnifiedLayoutManager.moveWidgetInContainer(newLayout, this.widgetId, this.direction)
            || UnifiedLayoutManager.moveFlexWidget(newLayout, this.widgetId, this.direction);
        if (moved) {
            newLayout.updatedAt = Date.now();
            context.updateLayout(this.pageId, newLayout);
        }
    }

    async undo(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) return;

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;

        let reverseDirection: 'up' | 'down' | 'left' | 'right' = 'up';
        switch (this.direction) {
            case 'up': reverseDirection = 'down'; break;
            case 'down': reverseDirection = 'up'; break;
            case 'left': reverseDirection = 'right'; break;
            case 'right': reverseDirection = 'left'; break;
        }

        const moved = UnifiedLayoutManager.moveWidgetInContainer(newLayout, this.widgetId, reverseDirection)
            || UnifiedLayoutManager.moveFlexWidget(newLayout, this.widgetId, reverseDirection);
        if (moved) {
            newLayout.updatedAt = Date.now();
            context.updateLayout(this.pageId, newLayout);
        }
    }
}

// --- Move Widget To Target Command (DnD cross-container) ---
export class MoveWidgetToTargetCommand implements Command {
    id: string;
    type = 'MOVE_WIDGET_TO_TARGET';
    timestamp: number;

    private pageId: string;
    private widgetId: string;
    private target: { containerId: string; index?: number; rowId?: string; column?: number };
    private originalPosition: { containerId: string; index: number; rowId?: string; column?: number } | null = null;

    constructor(
        pageId: string,
        widgetId: string,
        target: { containerId: string; index?: number; rowId?: string; column?: number }
    ) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.widgetId = widgetId;
        this.target = target;
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) return;

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const original = UnifiedLayoutManager.moveWidgetToTarget(newLayout, this.widgetId, this.target);
        if (original) {
            this.originalPosition = original;
            newLayout.updatedAt = Date.now();
            context.updateLayout(this.pageId, newLayout);
        }
    }

    async undo(context: CommandContext): Promise<void> {
        if (!this.originalPosition) return;

        const layout = context.layouts.get(this.pageId);
        if (!layout) return;

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const result = UnifiedLayoutManager.moveWidgetToTarget(newLayout, this.widgetId, this.originalPosition);
        if (result) {
            newLayout.updatedAt = Date.now();
            context.updateLayout(this.pageId, newLayout);
        }
    }
}

// --- Update Container Columns Command ---
export class UpdateContainerColumnsCommand implements Command {
    id: string;
    type = 'UPDATE_CONTAINER_COLUMNS';
    timestamp: number;

    private pageId: string;
    private containerId: string;
    private newColumns: number;
    private oldColumns: number | null = null;

    constructor(pageId: string, containerId: string, columns: number) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.containerId = containerId;
        this.newColumns = columns;
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) return;

        // Capture old
        if (this.oldColumns === null) {
            const container = findLayoutContainer(layout.containers, this.containerId);
            if (container) this.oldColumns = container.columns;
        }

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        if (UnifiedLayoutManager.updateContainerColumns(newLayout, this.containerId, this.newColumns)) {
            newLayout.updatedAt = Date.now();
            context.updateLayout(this.pageId, newLayout);
        }
    }

    async undo(context: CommandContext): Promise<void> {
        if (this.oldColumns === null) return;

        const layout = context.layouts.get(this.pageId);
        if (!layout) return;

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        if (UnifiedLayoutManager.updateContainerColumns(newLayout, this.containerId, this.oldColumns)) {
            newLayout.updatedAt = Date.now();
            context.updateLayout(this.pageId, newLayout);
        }
    }
}

// --- Update Container Settings Command ---
export class UpdateContainerSettingsCommand implements Command {
    id: string;
    type = 'UPDATE_CONTAINER_SETTINGS';
    timestamp: number;

    private pageId: string;
    private containerId: string;
    private newSettings: Partial<LayoutContainer['settings']>;
    private oldSettings: Partial<LayoutContainer['settings']> | null = null;

    constructor(pageId: string, containerId: string, settings: Partial<LayoutContainer['settings']>) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.containerId = containerId;
        this.newSettings = settings;
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) return;

        // Capture old
        if (this.oldSettings === null) {
            const container = findContainer(layout.containers, this.containerId);
            if (container) this.oldSettings = { ...container.settings };
        }

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        if (UnifiedLayoutManager.updateContainerSettings(newLayout, this.containerId, this.newSettings)) {
            newLayout.updatedAt = Date.now();
            context.updateLayout(this.pageId, newLayout);
        }
    }

    async undo(context: CommandContext): Promise<void> {
        if (this.oldSettings === null) return;

        const layout = context.layouts.get(this.pageId);
        if (!layout) return;

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        if (UnifiedLayoutManager.updateContainerSettings(newLayout, this.containerId, this.oldSettings)) {
            newLayout.updatedAt = Date.now();
            context.updateLayout(this.pageId, newLayout);
        }
    }
}

// --- Rename Widget Command ---
export class RenameWidgetCommand implements Command {
    id: string;
    type = 'RENAME_WIDGET';
    timestamp: number;

    private pageId: string;
    private oldId: string;
    private newId: string;

    constructor(pageId: string, oldId: string, newId: string) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.oldId = oldId;
        this.newId = newId;
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        if (UnifiedLayoutManager.renameWidget(newLayout, this.oldId, this.newId)) {
            newLayout.updatedAt = Date.now();
            context.updateLayout(this.pageId, newLayout);
        } else {
            throw new Error(`Failed to rename widget: ${this.newId} might already exist or widget not found`);
        }
    }

    async undo(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) return;

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        if (UnifiedLayoutManager.renameWidget(newLayout, this.newId, this.oldId)) {
            newLayout.updatedAt = Date.now();
            context.updateLayout(this.pageId, newLayout);
        }
    }
}

// --- Replace Layout Command ---
export class ReplaceLayoutCommand implements Command {
    id: string;
    type = 'REPLACE_LAYOUT';
    timestamp: number;

    private pageId: string;
    private newLayout: PageLayout;
    private oldLayout: PageLayout | null = null;

    constructor(pageId: string, newLayout: PageLayout) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.newLayout = newLayout;
    }

    async execute(context: CommandContext): Promise<void> {
        const currentLayout = context.layouts.get(this.pageId);
        // If current layout not found, we might be importing for the first time or initializing.
        // But for undo history, we need something to undo TO. 
        // If no current layout, maybe we just set it. 
        // But context usually requires existing key.
        // Let's assume layout exists if we are in editor.

        if (currentLayout) {
            this.oldLayout = JSON.parse(JSON.stringify(currentLayout));
        }

        // Apply new layout
        const layoutToApply = JSON.parse(JSON.stringify(this.newLayout)) as PageLayout;
        layoutToApply.id = this.pageId;
        layoutToApply.updatedAt = Date.now();

        context.updateLayout(this.pageId, layoutToApply);
    }

    async undo(context: CommandContext): Promise<void> {
        if (this.oldLayout) {
            this.oldLayout.updatedAt = Date.now();
            context.updateLayout(this.pageId, this.oldLayout);
        }
    }
}

// --- Paste Widgets Command ---
export class PasteWidgetsCommand implements Command {
    id: string;
    type = 'PASTE_WIDGETS';
    timestamp: number;

    private pageId: string;
    private containerId: string;
    private widgets: WidgetInstance[];
    private pastedIds: string[] = [];

    constructor(pageId: string, containerId: string, widgets: WidgetInstance[]) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.containerId = containerId;
        // Deep clone and assign new IDs
        this.widgets = widgets.map(w => {
            const suffix = crypto.randomUUID().slice(0, 6);
            const newId = `${w.id.replace(/-copy-[a-f0-9]+$/, '')}-copy-${suffix}`;
            return { ...JSON.parse(JSON.stringify(w)), id: newId };
        });
        this.pastedIds = this.widgets.map(w => w.id);
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const container = findContainer(newLayout.containers, this.containerId);

        if (!container) throw new Error(`Container not found: ${this.containerId}`);

        for (const widget of this.widgets) {
            container.widgets.push(JSON.parse(JSON.stringify(widget)));
        }

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }

    async undo(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;

        for (const pastedId of this.pastedIds) {
            const location = findWidgetLocation(newLayout.containers, pastedId);
            if (location) {
                location.container.widgets.splice(location.index, 1);
            }
        }

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }
}

// --- Paste Containers Command ---
export class PasteContainersCommand implements Command {
    id: string;
    type = 'PASTE_CONTAINERS';
    timestamp: number;

    private pageId: string;
    private containers: LayoutContainer[];
    private insertIndex: number; // -1 means append
    private pastedIds: string[] = [];

    constructor(pageId: string, containers: LayoutContainer[], insertIndex: number = -1) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.insertIndex = insertIndex;

        // Deep clone containers with new IDs
        const cloneContainer = (c: LayoutContainer): LayoutContainer => {
            const suffix = crypto.randomUUID().slice(0, 6);
            return {
                ...JSON.parse(JSON.stringify(c)),
                id: `${c.id.replace(/-copy-[a-f0-9]+$/, '')}-copy-${suffix}`,
                widgets: c.widgets.map(w => ({
                    ...JSON.parse(JSON.stringify(w)),
                    id: `${w.id.replace(/-copy-[a-f0-9]+$/, '')}-copy-${crypto.randomUUID().slice(0, 6)}`
                })),
                children: c.children ? c.children.map(cloneContainer) : []
            };
        };

        this.containers = containers.map(cloneContainer);
        this.pastedIds = this.containers.map(c => c.id);
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;

        if (this.insertIndex >= 0 && this.insertIndex < newLayout.containers.length) {
            // Insert after the given index
            newLayout.containers.splice(this.insertIndex + 1, 0, ...this.containers.map(c => JSON.parse(JSON.stringify(c))));
        } else {
            // Append at end
            for (const container of this.containers) {
                newLayout.containers.push(JSON.parse(JSON.stringify(container)));
            }
        }

        // Reorder
        newLayout.containers.forEach((c, i) => c.order = i);
        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }

    async undo(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const idsToRemove = new Set(this.pastedIds);
        newLayout.containers = newLayout.containers.filter(c => !idsToRemove.has(c.id));
        newLayout.containers.forEach((c, i) => c.order = i);

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }
}


// --- Add Flexible Container Command ---
export class AddFlexContainerCommand implements Command {
    id: string;
    type = 'ADD_FLEX_CONTAINER';
    timestamp: number;

    private pageId: string;
    private container: FlexibleContainer;

    constructor(pageId: string, container: FlexibleContainer) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.container = container;
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        this.container.order = newLayout.containers.length;
        newLayout.containers.push(this.container);

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }

    async undo(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        newLayout.containers = newLayout.containers.filter(c => c.id !== this.container.id);
        newLayout.containers.forEach((c, i) => c.order = i);

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }
}

// --- Flex Add Row Command ---
export class FlexAddRowCommand implements Command {
    id: string;
    type = 'FLEX_ADD_ROW';
    timestamp: number;

    private pageId: string;
    private containerId: string;
    private rowId: string;

    constructor(pageId: string, containerId: string, rowId: string) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.containerId = containerId;
        this.rowId = rowId;
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const container = findContainer(newLayout.containers, this.containerId);
        if (!container || container.type !== 'flex-container') return;

        (container as FlexibleContainer).rows.push({
            id: this.rowId,
            columns: [{ width: 1, unit: 'fr' }, { width: 1, unit: 'fr' }],
            sizing: 'constrained',
        });

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }

    async undo(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const container = findContainer(newLayout.containers, this.containerId);
        if (!container || container.type !== 'flex-container') return;

        const fc = container as FlexibleContainer;
        fc.rows = fc.rows.filter(r => r.id !== this.rowId);

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }
}

// --- Flex Remove Row Command ---
export class FlexRemoveRowCommand implements Command {
    id: string;
    type = 'FLEX_REMOVE_ROW';
    timestamp: number;

    private pageId: string;
    private containerId: string;
    private rowId: string;
    private capturedRow: any = null;
    private capturedIndex: number = -1;

    constructor(pageId: string, containerId: string, rowId: string) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.containerId = containerId;
        this.rowId = rowId;
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        // Capture state before modification
        const origContainer = findContainer(layout.containers, this.containerId);
        if (!origContainer || origContainer.type !== 'flex-container') return;
        const fc = origContainer as FlexibleContainer;
        const idx = fc.rows.findIndex(r => r.id === this.rowId);
        if (idx === -1) return;
        this.capturedRow = JSON.parse(JSON.stringify(fc.rows[idx]));
        this.capturedIndex = idx;

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const newContainer = findContainer(newLayout.containers, this.containerId) as FlexibleContainer;
        newContainer.rows.splice(idx, 1);

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }

    async undo(context: CommandContext): Promise<void> {
        if (!this.capturedRow || this.capturedIndex === -1) return;

        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const container = findContainer(newLayout.containers, this.containerId) as FlexibleContainer;
        if (!container) return;

        container.rows.splice(this.capturedIndex, 0, this.capturedRow);

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }
}

// --- Flex Add Column Command ---
export class FlexAddColumnCommand implements Command {
    id: string;
    type = 'FLEX_ADD_COLUMN';
    timestamp: number;

    private pageId: string;
    private containerId: string;
    private rowId: string;

    constructor(pageId: string, containerId: string, rowId: string) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.containerId = containerId;
        this.rowId = rowId;
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const container = findContainer(newLayout.containers, this.containerId) as FlexibleContainer;
        if (!container) return;

        const row = container.rows.find(r => r.id === this.rowId);
        if (!row) return;

        row.columns.push({ width: 1, unit: 'fr' });

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }

    async undo(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const container = findContainer(newLayout.containers, this.containerId) as FlexibleContainer;
        if (!container) return;

        const row = container.rows.find(r => r.id === this.rowId);
        if (!row || row.columns.length <= 1) return;

        row.columns.pop();

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }
}

// --- Flex Remove Column Command ---
export class FlexRemoveColumnCommand implements Command {
    id: string;
    type = 'FLEX_REMOVE_COLUMN';
    timestamp: number;

    private pageId: string;
    private containerId: string;
    private rowId: string;
    private columnIndex: number;
    private capturedColumn: any = null;
    private capturedWidgets: any[] = [];

    constructor(pageId: string, containerId: string, rowId: string, columnIndex: number) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.containerId = containerId;
        this.rowId = rowId;
        this.columnIndex = columnIndex;
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        // Capture before modification
        const origContainer = findContainer(layout.containers, this.containerId) as FlexibleContainer;
        if (!origContainer) return;
        const origRow = origContainer.rows.find(r => r.id === this.rowId);
        if (!origRow || this.columnIndex >= origRow.columns.length) return;
        this.capturedColumn = JSON.parse(JSON.stringify(origRow.columns[this.columnIndex]));

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const container = findContainer(newLayout.containers, this.containerId) as FlexibleContainer;
        const row = container.rows.find(r => r.id === this.rowId);
        if (!row || row.columns.length <= 1) return;

        row.columns.splice(this.columnIndex, 1);

        // Capture widgets in the deleted column before removing them
        this.capturedWidgets = JSON.parse(JSON.stringify(
            container.widgets.filter((w: any) => w.rowId === this.rowId && w.column === this.columnIndex)
        ));

        // Remove widgets in the deleted column and shift higher columns down
        container.widgets = container.widgets.filter(
            (w: any) => !(w.rowId === this.rowId && w.column === this.columnIndex)
        );
        container.widgets.forEach((w: any) => {
            if (w.rowId === this.rowId && w.column > this.columnIndex) {
                w.column -= 1;
            }
        });

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }

    async undo(context: CommandContext): Promise<void> {
        if (!this.capturedColumn) return;

        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const container = findContainer(newLayout.containers, this.containerId) as FlexibleContainer;
        if (!container) return;

        const row = container.rows.find(r => r.id === this.rowId);
        if (!row) return;

        // Shift higher columns back up before re-inserting
        container.widgets.forEach((w: any) => {
            if (w.rowId === this.rowId && w.column >= this.columnIndex) {
                w.column += 1;
            }
        });

        // Restore column definition and captured widgets
        row.columns.splice(this.columnIndex, 0, this.capturedColumn);
        container.widgets.push(...JSON.parse(JSON.stringify(this.capturedWidgets)));

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }
}

// ─── Flex: Set columns preset ───────────────────────────────────────────

export class FlexSetColumnsPresetCommand implements Command {
    id: string;
    type = 'FLEX_SET_COLUMNS_PRESET';
    timestamp: number;

    private pageId: string;
    private containerId: string;
    private rowId: string;
    private newColumns: ColumnDef[];
    private capturedColumns: ColumnDef[] | null = null;

    constructor(pageId: string, containerId: string, rowId: string, newColumns: ColumnDef[]) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.containerId = containerId;
        this.rowId = rowId;
        this.newColumns = newColumns;
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        // Capture current columns for undo
        const origContainer = findContainer(layout.containers, this.containerId) as FlexibleContainer;
        if (!origContainer) return;
        const origRow = origContainer.rows.find(r => r.id === this.rowId);
        if (!origRow) return;
        this.capturedColumns = JSON.parse(JSON.stringify(origRow.columns));

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const container = findContainer(newLayout.containers, this.containerId) as FlexibleContainer;
        const row = container.rows.find(r => r.id === this.rowId);
        if (!row) return;

        row.columns = JSON.parse(JSON.stringify(this.newColumns));

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }

    async undo(context: CommandContext): Promise<void> {
        if (!this.capturedColumns) return;

        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const container = findContainer(newLayout.containers, this.containerId) as FlexibleContainer;
        if (!container) return;

        const row = container.rows.find(r => r.id === this.rowId);
        if (!row) return;

        row.columns = JSON.parse(JSON.stringify(this.capturedColumns));

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }
}

// ─── Flex: Move row up/down ─────────────────────────────────────────────

export class FlexMoveRowCommand implements Command {
    id: string;
    type = 'FLEX_MOVE_ROW';
    timestamp: number;

    private pageId: string;
    private containerId: string;
    private rowId: string;
    private direction: 'up' | 'down';

    constructor(pageId: string, containerId: string, rowId: string, direction: 'up' | 'down') {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.containerId = containerId;
        this.rowId = rowId;
        this.direction = direction;
    }

    private swap(context: CommandContext, dir: 'up' | 'down'): void {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const container = findContainer(newLayout.containers, this.containerId) as FlexibleContainer;
        if (!container) return;

        const idx = container.rows.findIndex(r => r.id === this.rowId);
        if (idx === -1) return;

        const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= container.rows.length) return;

        // Swap
        [container.rows[idx], container.rows[targetIdx]] = [container.rows[targetIdx], container.rows[idx]];

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }

    async execute(context: CommandContext): Promise<void> {
        this.swap(context, this.direction);
    }

    async undo(context: CommandContext): Promise<void> {
        this.swap(context, this.direction === 'up' ? 'down' : 'up');
    }
}

// ─── Flex: Set row sizing mode ──────────────────────────────────────────

export class FlexSetRowSizingCommand implements Command {
    id: string;
    type = 'FLEX_SET_ROW_SIZING';
    timestamp: number;

    private pageId: string;
    private containerId: string;
    private rowId: string;
    private newSizing: 'constrained' | 'unconstrained';
    private capturedSizing: 'constrained' | 'unconstrained' | undefined;

    constructor(pageId: string, containerId: string, rowId: string, newSizing: 'constrained' | 'unconstrained') {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.containerId = containerId;
        this.rowId = rowId;
        this.newSizing = newSizing;
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const origContainer = findContainer(layout.containers, this.containerId) as FlexibleContainer;
        if (!origContainer) return;
        const origRow = origContainer.rows.find(r => r.id === this.rowId);
        if (!origRow) return;
        this.capturedSizing = origRow.sizing;

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const container = findContainer(newLayout.containers, this.containerId) as FlexibleContainer;
        const row = container.rows.find(r => r.id === this.rowId);
        if (!row) return;

        row.sizing = this.newSizing;

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }

    async undo(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const container = findContainer(newLayout.containers, this.containerId) as FlexibleContainer;
        if (!container) return;

        const row = container.rows.find(r => r.id === this.rowId);
        if (!row) return;

        row.sizing = this.capturedSizing;

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }
}

// ─── Flex: Set row padding ──────────────────────────────────────────────

export class FlexSetRowPaddingCommand implements Command {
    id: string;
    type = 'FLEX_SET_ROW_PADDING';
    timestamp: number;

    private pageId: string;
    private containerId: string;
    private rowId: string;
    private newPadding: string | undefined;
    private capturedPadding: string | undefined;

    constructor(pageId: string, containerId: string, rowId: string, newPadding: string | undefined) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.containerId = containerId;
        this.rowId = rowId;
        this.newPadding = newPadding;
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const origContainer = findContainer(layout.containers, this.containerId) as FlexibleContainer;
        if (!origContainer) return;
        const origRow = origContainer.rows.find(r => r.id === this.rowId);
        if (!origRow) return;
        this.capturedPadding = origRow.padding;

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const container = findContainer(newLayout.containers, this.containerId) as FlexibleContainer;
        const row = container.rows.find(r => r.id === this.rowId);
        if (!row) return;

        row.padding = this.newPadding;

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }

    async undo(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const container = findContainer(newLayout.containers, this.containerId) as FlexibleContainer;
        if (!container) return;

        const row = container.rows.find(r => r.id === this.rowId);
        if (!row) return;

        row.padding = this.capturedPadding;

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }
}

// ─── Flex: Duplicate row ────────────────────────────────────────────────

export class FlexDuplicateRowCommand implements Command {
    id: string;
    type = 'FLEX_DUPLICATE_ROW';
    timestamp: number;

    private pageId: string;
    private containerId: string;
    private rowId: string;
    private newRowId: string | null = null;

    constructor(pageId: string, containerId: string, rowId: string) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.containerId = containerId;
        this.rowId = rowId;
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const container = findContainer(newLayout.containers, this.containerId) as FlexibleContainer;
        if (!container) return;

        const idx = container.rows.findIndex(r => r.id === this.rowId);
        if (idx === -1) return;

        const sourceRow = container.rows[idx];
        this.newRowId = UnifiedLayoutManager.generateRowId();

        // Clone row definition with new ID
        const clonedRow = JSON.parse(JSON.stringify(sourceRow));
        clonedRow.id = this.newRowId;

        // Clone widgets that belong to this row
        const sourceWidgets = container.widgets.filter((w: any) => w.rowId === this.rowId);
        const clonedWidgets = sourceWidgets.map((w: any) => {
            const clone = JSON.parse(JSON.stringify(w));
            clone.id = crypto.randomUUID();
            clone.rowId = this.newRowId;
            return clone;
        });

        container.rows.splice(idx + 1, 0, clonedRow);
        container.widgets.push(...clonedWidgets);

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }

    async undo(context: CommandContext): Promise<void> {
        if (!this.newRowId) return;

        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const container = findContainer(newLayout.containers, this.containerId) as FlexibleContainer;
        if (!container) return;

        // Remove cloned row
        container.rows = container.rows.filter(r => r.id !== this.newRowId);
        // Remove cloned widgets
        container.widgets = container.widgets.filter((w: any) => w.rowId !== this.newRowId);

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }
}

// ─── Flex: Duplicate column ─────────────────────────────────────────────

export class FlexDuplicateColumnCommand implements Command {
    id: string;
    type = 'FLEX_DUPLICATE_COLUMN';
    timestamp: number;

    private pageId: string;
    private containerId: string;
    private rowId: string;
    private columnIndex: number;

    constructor(pageId: string, containerId: string, rowId: string, columnIndex: number) {
        this.id = crypto.randomUUID();
        this.timestamp = Date.now();
        this.pageId = pageId;
        this.containerId = containerId;
        this.rowId = rowId;
        this.columnIndex = columnIndex;
    }

    async execute(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const container = findContainer(newLayout.containers, this.containerId) as FlexibleContainer;
        if (!container) return;

        const row = container.rows.find(r => r.id === this.rowId);
        if (!row || this.columnIndex >= row.columns.length) return;

        // Clone column definition
        const clonedCol = JSON.parse(JSON.stringify(row.columns[this.columnIndex]));
        row.columns.splice(this.columnIndex + 1, 0, clonedCol);

        // Clone widgets in that column, shift to new column index
        const newColIdx = this.columnIndex + 1;
        const sourceWidgets = container.widgets.filter(
            (w: any) => w.rowId === this.rowId && w.column === this.columnIndex
        );
        const clonedWidgets = sourceWidgets.map((w: any) => {
            const clone = JSON.parse(JSON.stringify(w));
            clone.id = crypto.randomUUID();
            clone.column = newColIdx;
            return clone;
        });

        // Shift existing widgets in columns after the duplicated one
        container.widgets.forEach((w: any) => {
            if (w.rowId === this.rowId && w.column > this.columnIndex) {
                w.column += 1;
            }
        });

        container.widgets.push(...clonedWidgets);

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }

    async undo(context: CommandContext): Promise<void> {
        const layout = context.layouts.get(this.pageId);
        if (!layout) throw new Error(`Layout not found: ${this.pageId}`);

        const newLayout = JSON.parse(JSON.stringify(layout)) as PageLayout;
        const container = findContainer(newLayout.containers, this.containerId) as FlexibleContainer;
        if (!container) return;

        const row = container.rows.find(r => r.id === this.rowId);
        if (!row) return;

        const removedColIdx = this.columnIndex + 1;

        // Remove duplicated column
        row.columns.splice(removedColIdx, 1);

        // Remove widgets in the duplicated column
        container.widgets = container.widgets.filter(
            (w: any) => !(w.rowId === this.rowId && w.column === removedColIdx)
        );

        // Shift widgets back
        container.widgets.forEach((w: any) => {
            if (w.rowId === this.rowId && w.column > removedColIdx) {
                w.column -= 1;
            }
        });

        newLayout.updatedAt = Date.now();
        context.updateLayout(this.pageId, newLayout);
    }
}
