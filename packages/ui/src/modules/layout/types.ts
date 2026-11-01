import { PageLayout, WidgetInstance, LayoutContainer } from '@/modules/layout/LayoutManager';

export interface CommandContext {
    pageId: string;
    layouts: Map<string, PageLayout>;
    updateLayout: (pageId: string, layout: PageLayout) => void;
    pageMetadata: Map<string, Record<string, any>>;
    updatePageMetadata: (pageId: string, metadata: Record<string, any>) => void;
}

export interface Command {
    id: string;
    type: string;
    timestamp: number;
    execute(context: CommandContext): Promise<void>;
    undo(context: CommandContext): Promise<void>;
}

export interface CommandFactory {
    createAddWidgetCommand(pageId: string, containerId: string, widget: WidgetInstance, index?: number): Command;
    createRemoveWidgetCommand(pageId: string, containerId: string, widget: WidgetInstance, index: number): Command;
    createMoveWidgetCommand(pageId: string, sourceContainerId: string, targetContainerId: string, widgetId: string, oldIndex: number, newIndex: number): Command;
}
