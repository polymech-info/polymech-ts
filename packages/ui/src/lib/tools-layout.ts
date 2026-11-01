import { z } from 'zod';
import type { RunnableToolFunctionWithParse } from 'openai/lib/RunnableFunction';

type LogFunction = (level: string, message: string, data?: any) => void;
const defaultLog: LogFunction = (level, message, data) => console.log(`[${level}] ${message}`, data);

// ── Embedded widget system documentation (from public/docs/widgets-llm.md) ──
// NOTE: intentionally omits page-level wrapping (content.pages["page-{id}"]) —
// the LLM only generates container+widget fragments; the editor inserts them
// via AddContainerCommand for proper undo/redo support.
const WIDGET_SYSTEM_DOCS = `
# Widget System — Container & Widget Reference

Generate an array of containers, each containing widgets. The editor will handle
insertion, ID assignment, and undo/redo. You only need to produce the structure.

## Available Widgets

### html-widget — HTML Content
Raw HTML with \${var} substitution.
Props: content (HTML string), variables (JSON string), className (Tailwind).

### photo-card — Photo Card
Single image card. Props: pictureId (uuid|null), showHeader (bool), showFooter (bool),
contentDisplay ("below"|"overlay"|"overlay-always"), imageFit ("contain"|"cover").

### photo-grid-widget — Photo Grid (manual)
Grid of selected photos. Props: pictureIds (uuid[]).

### gallery-widget — Gallery
Viewer + filmstrip. Props: pictureIds (uuid[]), thumbnailLayout ("strip"|"grid"),
imageFit, thumbnailsPosition ("top"|"bottom"|"left"|"right"), zoomEnabled (bool).

### page-card — Page Card
Linked page card. Props: pageId (uuid|null), showHeader (bool), showFooter (bool),
contentDisplay ("below"|"overlay"|"overlay-always").

### markdown-text — Text Block
Markdown content. Props: content (string), placeholder (string).

### tabs-widget — Tabs
Each tab holds its own layout. Props: tabs (Tab[]), tabBarPosition ("top"|"bottom"|"left"|"right").
Tab: { id, label, layoutId, layoutData: { id, name, containers:[], createdAt, updatedAt, version } }

### layout-container-widget — Nested Layout
Embeds an independent canvas. Props: nestedPageName (string), showControls (bool).


## Container Schema (what you produce)
{
  columns: 1-4,                  // CSS grid columns
  gap: 16,                       // px gap between cells
  order: number,                 // sort position
  widgets: Widget[],
  children: Container[],         // nested sub-containers (recursive)
  settings: { title: "", showTitle: false, collapsible: false, collapsed: false }
}

## Widget Schema (inside a container)
{
  widgetId: string,              // one of the IDs above, e.g. "markdown-text"
  order: number,
  props: { ... }                 // widget-specific props (see above)
}

All widgets also accept a "variables" object in props for \${varName} substitution.
`.trim();

// ── Zod schemas for validation ──

const ContainerSettingsSchema = z.object({
    title: z.string().default(''),
    showTitle: z.boolean().default(false),
    collapsible: z.boolean().default(false),
    collapsed: z.boolean().default(false),
});

const WidgetSchema = z.object({
    widgetId: z.string(),
    order: z.number().default(0),
    props: z.record(z.string(), z.any()),
});

const ContainerSchema: z.ZodType<any> = z.lazy(() =>
    z.object({
        columns: z.number().min(1).max(4).default(1),
        gap: z.number().default(16),
        order: z.number().default(0),
        widgets: z.array(WidgetSchema).default([]),
        children: z.array(ContainerSchema).default([]),
        settings: ContainerSettingsSchema.default({}),
    })
);

const CreateWidgetsInputSchema = z.object({
    containers: z.array(ContainerSchema).min(1),
    description: z.string().optional(),
});

type CreateWidgetsInput = z.infer<typeof CreateWidgetsInputSchema>;

// ── ID generation helpers ──

function randomId(length = 9): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function assignIds(containers: any[]): any[] {
    const now = Date.now();
    return containers.map((container, ci) => {
        const containerId = `container-${now + ci}-${randomId()}`;
        return {
            ...container,
            id: containerId,
            type: 'container',
            order: container.order ?? ci,
            widgets: (container.widgets || []).map((widget: any, wi: number) => ({
                ...widget,
                id: `widget-${now + ci}-${randomId()}`,
                order: widget.order ?? wi,
            })),
            children: container.children ? assignIds(container.children) : [],
            settings: {
                title: '',
                showTitle: false,
                collapsible: false,
                collapsed: false,
                ...(container.settings || {}),
            },
        };
    });
}
// ── Tool factory ──
//
// Uses RunnableToolFunctionWithParse pattern (same as vfsTools)
// with raw JSON Schema parameters for OpenAI compatibility.

export const createWidgetsTool = (
    addLog: LogFunction = defaultLog,
): RunnableToolFunctionWithParse<CreateWidgetsInput> => ({
    type: 'function',
    function: {
        name: 'create_widgets',
        description:
            'Generate valid widget layout fragments (containers + widgets) that can be inserted into a page. ' +
            'The output must follow the exact container/widget schema described below. ' +
            'You MUST use valid widgetId values and correct props for each widget type.\n\n' +
            WIDGET_SYSTEM_DOCS,
        parameters: {
            type: 'object',
            properties: {
                containers: {
                    type: 'array',
                    description: 'Array of containers with their widgets. This is the layout fragment to insert into the page.',
                    items: {
                        type: 'object',
                        properties: {
                            columns: { type: 'number', description: 'CSS grid columns (1-4). Default: 1.' },
                            gap: { type: 'number', description: 'Gap in px between grid cells. Default: 16.' },
                            order: { type: 'number', description: 'Sort position among sibling containers.' },
                            widgets: {
                                type: 'array',
                                description: 'Widgets inside this container.',
                                items: {
                                    type: 'object',
                                    properties: {
                                        widgetId: { type: 'string', description: 'Registered widget id, e.g. "markdown-text", "photo-card", "html-widget".' },
                                        order: { type: 'number', description: 'Sort order within the container.' },
                                        props: { type: 'object', description: 'Widget-specific props — must match the widget\'s configSchema.' },
                                    },
                                    required: ['widgetId', 'props'],
                                },
                            },
                            children: {
                                type: 'array',
                                description: 'Nested sub-containers (recursive).',
                                items: { type: 'object' },
                            },
                            settings: {
                                type: 'object',
                                description: 'Container display settings.',
                                properties: {
                                    title: { type: 'string' },
                                    showTitle: { type: 'boolean' },
                                    collapsible: { type: 'boolean' },
                                    collapsed: { type: 'boolean' },
                                },
                            },
                        },
                        required: ['widgets'],
                    },
                },
                description: {
                    type: 'string',
                    description: 'Brief description of what was generated (for the user).',
                },
            },
            required: ['containers'],
        } as any,
        parse(input: string): CreateWidgetsInput {
            const raw = JSON.parse(input);
            // Handle case where LLM sends containers as stringified JSON
            if (typeof raw.containers === 'string') {
                try { raw.containers = JSON.parse(raw.containers); } catch { }
            }
            try {
                return CreateWidgetsInputSchema.parse(raw);
            } catch (zodErr: any) {
                // Zod v4 may have breaking schema changes — log and fallback to raw
                console.warn('[tools-layout] Zod parse failed, falling back to raw args:', zodErr?.message || zodErr);
                // Ensure minimal shape so assignIds can work
                if (!Array.isArray(raw.containers)) throw zodErr; // re-throw if truly invalid
                return raw as CreateWidgetsInput;
            }
        },
        function: async (args: CreateWidgetsInput) => {
            try {
                addLog('info', '[LAYOUT-TOOLS] Tool::CreateWidgets called', {
                    containerCount: args.containers.length,
                    totalWidgets: args.containers.reduce((sum, c) => sum + (c.widgets?.length || 0), 0),
                });

                // Assign proper IDs to all containers and widgets
                const hydratedContainers = assignIds(args.containers);

                addLog('info', '[LAYOUT-TOOLS] Created layout fragment', {
                    containers: hydratedContainers.length,
                    description: args.description,
                });

                return JSON.stringify({
                    success: true,
                    action: 'create_widgets',
                    containers: hydratedContainers,
                    description: args.description || 'Layout fragment generated',
                    message: 'Widget layout created successfully. Insert these containers into a page.',
                });
            } catch (error: any) {
                addLog('error', '[LAYOUT-TOOLS] Tool::CreateWidgets failed', error);
                return JSON.stringify({ success: false, error: error.message });
            }
        },
    },
});

// ── Update Widget Tool ──

interface UpdateWidgetInput {
    widgetId: string;
    props: Record<string, any>;
    description?: string;
}

export const updateWidgetTool = (
    addLog: LogFunction = defaultLog,
): RunnableToolFunctionWithParse<UpdateWidgetInput> => ({
    type: 'function',
    function: {
        name: 'update_widget',
        description:
            'Update the props of an existing widget on the page. ' +
            'You need to know the widget instance ID (you can find it from page context). ' +
            'Only supply the props that should change — they will be merged with existing props.\n\n' +
            WIDGET_SYSTEM_DOCS,
        parameters: {
            type: 'object',
            properties: {
                widgetId: {
                    type: 'string',
                    description: 'The instance ID of the widget to update (e.g. "widget-1740123456789-abc123def").',
                },
                props: {
                    type: 'object',
                    description: 'Partial props to merge into the widget. Only include changed fields.',
                },
                description: {
                    type: 'string',
                    description: 'Brief description of the update (for the user).',
                },
            },
            required: ['widgetId', 'props'],
        } as any,
        parse(input: string): UpdateWidgetInput {
            const raw = JSON.parse(input);
            if (!raw.widgetId || typeof raw.widgetId !== 'string') throw new Error('widgetId is required');
            if (!raw.props || typeof raw.props !== 'object') throw new Error('props object is required');
            return raw as UpdateWidgetInput;
        },
        function: async (args: UpdateWidgetInput) => {
            try {
                addLog('info', '[LAYOUT-TOOLS] Tool::UpdateWidget called', {
                    widgetId: args.widgetId,
                    propsKeys: Object.keys(args.props),
                });

                return JSON.stringify({
                    success: true,
                    action: 'update_widget',
                    widgetId: args.widgetId,
                    props: args.props,
                    description: args.description || 'Widget updated',
                    message: `Widget ${args.widgetId} updated successfully.`,
                });
            } catch (error: any) {
                addLog('error', '[LAYOUT-TOOLS] Tool::UpdateWidget failed', error);
                return JSON.stringify({ success: false, error: error.message });
            }
        },
    },
});

// ── Remove Widget Tool ──

interface RemoveWidgetInput {
    widgetId: string;
    description?: string;
}

export const removeWidgetTool = (
    addLog: LogFunction = defaultLog,
): RunnableToolFunctionWithParse<RemoveWidgetInput> => ({
    type: 'function',
    function: {
        name: 'remove_widget',
        description:
            'Remove an existing widget from the page by its instance ID. ' +
            'You need to know the widget instance ID (you can find it from page context). ' +
            'This action is undoable via the editor\'s undo system.',
        parameters: {
            type: 'object',
            properties: {
                widgetId: {
                    type: 'string',
                    description: 'The instance ID of the widget to remove (e.g. "widget-1740123456789-abc123def").',
                },
                description: {
                    type: 'string',
                    description: 'Brief description of why the widget is being removed.',
                },
            },
            required: ['widgetId'],
        } as any,
        parse(input: string): RemoveWidgetInput {
            const raw = JSON.parse(input);
            if (!raw.widgetId || typeof raw.widgetId !== 'string') throw new Error('widgetId is required');
            return raw as RemoveWidgetInput;
        },
        function: async (args: RemoveWidgetInput) => {
            try {
                addLog('info', '[LAYOUT-TOOLS] Tool::RemoveWidget called', {
                    widgetId: args.widgetId,
                });

                return JSON.stringify({
                    success: true,
                    action: 'remove_widget',
                    widgetId: args.widgetId,
                    description: args.description || 'Widget removed',
                    message: `Widget ${args.widgetId} removed successfully.`,
                });
            } catch (error: any) {
                addLog('error', '[LAYOUT-TOOLS] Tool::RemoveWidget failed', error);
                return JSON.stringify({ success: false, error: error.message });
            }
        },
    },
});
