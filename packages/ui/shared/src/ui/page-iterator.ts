import {
    LayoutContainer,
    PageLayout,
    RootLayoutData,
    WidgetInstance,
    TabsWidgetProps,
    WidgetType
} from './schemas.js';

type IteratorCallback = (widget: WidgetInstance, context: IterationContext) => void | boolean;

interface IterationContext {
    pageId?: string;
    containerId?: string;
    depth: number;
    path: string[];
}

export const iterateWidgets = (
    data: RootLayoutData | PageLayout | LayoutContainer | null | undefined,
    callback: IteratorCallback,
    context: IterationContext = { depth: 0, path: [] }
) => {
    if (!data) return;

    // 1. RootLayoutData
    if ('pages' in data && typeof data.pages === 'object') {
        const pages = data.pages as Record<string, PageLayout>;
        for (const [pageId, page] of Object.entries(pages)) {
            iterateWidgets(page, callback, {
                ...context,
                pageId,
                path: [...context.path, `page:${pageId}`]
            });
        }
        return;
    }

    // 2. PageLayout
    if ('containers' in data && Array.isArray(data.containers) && !('type' in data)) {
        // It's a PageLayout (has containers, but not type='container')
        // Actually PageLayout has `id`, `name`, `containers`.
        // Let's rely on `containers` check and lack of `widgets` to distinguish from Container if uncertain, 
        // but Typescript types help. Runtime check:
        const page = data as PageLayout;
        if (page.containers) {
            const sortedContainers = [...page.containers].sort((a, b) => (a.order || 0) - (b.order || 0));
            for (const container of sortedContainers) {
                iterateWidgets(container, callback, {
                    ...context,
                    depth: context.depth + 1,
                    path: [...context.path, `container:${container.id}`]
                });
            }
        }
        return;
    }

    // 3. LayoutContainer
    // Check if it has 'type': 'container' or 'widgets'
    if (('type' in data && data.type === 'container') || ('widgets' in data && Array.isArray(data.widgets))) {
        const container = data as LayoutContainer;

        // Process Widgets
        if (container.widgets) {
            const sortedWidgets = [...container.widgets].sort((a, b) => (a.order || 0) - (b.order || 0));
            for (const widget of sortedWidgets) {
                const widgetContext = {
                    ...context,
                    containerId: container.id,
                    path: [...context.path, `widget:${widget.id}`]
                };

                // Invoke callback
                callback(widget, widgetContext);

                // Check for nested layouts in widgets (e.g. Tabs)
                if (widget.widgetId === 'tabs-widget' && widget.props) {
                    const tabsProps = widget.props as TabsWidgetProps;
                    if (tabsProps.tabs && Array.isArray(tabsProps.tabs)) {
                        for (const tab of tabsProps.tabs) {
                            if (tab.layoutData) {
                                // Recursively iterate the tab's layout
                                iterateWidgets(tab.layoutData as PageLayout, callback, {
                                    ...widgetContext,
                                    path: [...widgetContext.path, `tab:${tab.id}`]
                                });
                            }
                        }
                    }
                }
            }
        }

        // Process Child Containers
        if (container.children) {
            const sortedChildren = [...container.children].sort((a, b) => (a.order || 0) - (b.order || 0));
            for (const child of sortedChildren) {
                iterateWidgets(child, callback, {
                    ...context,
                    depth: context.depth + 1,
                    path: [...context.path, `container:${child.id}`]
                });
            }
        }
        return;
    }
};

export const findWidgetsByType = (
    data: RootLayoutData | PageLayout | LayoutContainer | null | undefined,
    type: WidgetType
): WidgetInstance[] => {
    const widgets: WidgetInstance[] = [];
    iterateWidgets(data, (widget) => {
        if (widget.widgetId === type) {
            widgets.push(widget);
        }
    });
    return widgets;
};
