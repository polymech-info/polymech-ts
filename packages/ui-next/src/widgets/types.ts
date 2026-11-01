/**
 * Types aligned with `packages/ui/docs/widgets-api.md` (§1, §2, §13, §14).
 * Intentionally minimal — extend as the host app gains real layout stores.
 */
import type { ComponentType, ReactElement, ReactNode } from "react";

// ─── Node model (§14) ──────────────────────────────────────────────────────

export interface NodeLayout {
  display: "flex" | "grid" | "block" | "none";
  columns?: number;
  gap?: number;
  direction?: "row" | "column";
  align?: "stretch" | "start" | "center" | "end";
}

export interface NodeConstraints {
  canHaveChildren: boolean;
  allowedChildTypes?: string[];
  maxChildren?: number;
  draggable?: boolean;
  deletable?: boolean;
}

/** A single element in the layout tree — replaces LayoutContainer + WidgetInstance. */
export interface LayoutNode {
  id: string;
  /** Registry key: 'flex' | 'flex-row' | 'text-block' | 'image' | … */
  type: string;
  props: Record<string, unknown>;
  children: LayoutNode[];
  parentId: string | null;
  layout?: NodeLayout;
}

export interface PageLayout {
  id: string;
  name: string;
  root: LayoutNode;
  version: string;
  createdAt: number;
  updatedAt: number;
}

// ─── Widget props (§2) ─────────────────────────────────────────────────────

export interface BaseWidgetProps {
  widgetInstanceId: string;
  widgetDefId: string;
  isEditMode: boolean;
  enabled?: boolean;
  onPropsChange: (partial: Record<string, unknown>) => Promise<void>;
  selectedWidgetId?: string | null;
  onSelectWidget?: (widgetId: string, pageId?: string) => void;
  editingWidgetId?: string | null;
  onEditWidget?: (widgetId: string | null) => void;
  selectedContainerId?: string | null;
  onSelectContainer?: (containerId: string, pageId?: string) => void;
  contextVariables?: Record<string, unknown>;
  pageContext?: Record<string, unknown>;
  customClassName?: string;
  /** Injected by NodeRenderer — the node's id (equals widgetInstanceId in node mode). */
  nodeId?: string;
  /** Injected by NodeRenderer — layout hints for structural nodes. */
  layout?: NodeLayout;
  /** Populated by NodeRenderer for nodes with canHaveChildren: true. */
  children?: ReactNode;
}

export type WidgetCategory =
  | "control"
  | "display"
  | "layout"
  | "chart"
  | "system"
  | "custom";

export type WidgetCapability =
  | "nested-layout"
  | "translatable"
  | "data-bound"
  | "interactive"
  | "exportable"
  /** Widget primarily displays or edits textual content. */
  | "text"
  /** Widget primarily displays or edits image/media content. */
  | "image";

/** Property editor field — full union lives in widgets-api §3 */
export interface ConfigField {
  type: string;
  label: string;
  description?: string;
  default?: unknown;
  group?: string;
  order?: number;
  [key: string]: unknown;
}

export type ConfigSchema<P extends Record<string, unknown>> = Partial<
  Record<keyof P | string, ConfigField>
>;

export interface WidgetMetadata<P extends BaseWidgetProps = BaseWidgetProps> {
  id: string;
  name: string;
  category: WidgetCategory;
  description: string;
  icon?: ComponentType;
  thumbnail?: string;
  defaultProps?: Partial<P>;
  configSchema?: ConfigSchema<P & Record<string, unknown>>;
  minSize?: { width: number; height: number };
  resizable?: boolean;
  tags?: string[];
  capabilities?: WidgetCapability[];
  maxInstances?: number;
}

export interface WidgetDefinition<P extends BaseWidgetProps = BaseWidgetProps> {
  component: ComponentType<P>;
  metadata: WidgetMetadata<P>;
  editComponent?: React.LazyExoticComponent<ComponentType<P>>;
  previewComponent?: ComponentType<P>;
  validate?: (props: P) => Record<string, string> | null;
  /** Node model: structural constraints evaluated at runtime (not persisted). */
  constraints?: NodeConstraints;
}

export interface WidgetInstance {
  id: string;
  widgetId: string;
  props?: Record<string, unknown>;
  order?: number;
}

// ─── Plugins & hooks (§13) ───────────────────────────────────────────────────

/** Read-only snapshot exposed to plugins via PluginAPI.getStore(). */
export type LayoutStore = {
  pages: Record<string, PageLayout>;
};

export interface HookContext {
  pluginId: string;
  pageId: string;
  isEditMode: boolean;
  store: Readonly<LayoutStore>;
}

export type HookName =
  | "widget:beforeRender"
  | "widget:afterRender"
  | "widget:beforeSave"
  | "widget:afterSave"
  | "widget:beforeAdd"
  | "widget:afterAdd"
  | "widget:beforeRemove"
  | "widget:afterRemove"
  | "container:beforeRender"
  | "container:afterRender"
  | "container:beforeSave"
  | "layout:beforeHydrate"
  | "layout:afterHydrate"
  | "layout:beforeSave"
  | "layout:afterSave"
  | "editor:beforeDrop"
  | "editor:widgetPalette"
  | "editor:contextMenu";

/** Slot identifiers from widgets-api §13 — extend as product adds chrome */
export type SlotId =
  | "editor:toolbar:start"
  | "editor:toolbar:end"
  | "editor:sidebar:top"
  | "editor:sidebar:bottom"
  | "editor:panel:right:top"
  | "editor:panel:right:bottom"
  | "widget:toolbar"
  | "container:toolbar"
  | "container:empty"
  | "page:header"
  | "page:footer";

export interface SlotProps {
  pageId: string;
  isEditMode: boolean;
  selectedWidgetId?: string | null;
  selectedContainerId?: string | null;
}

export type WidgetWrapper = <P extends BaseWidgetProps>(
  Component: ComponentType<P>,
) => ComponentType<P>;

/** Minimal accessor interface passed into PluginManager / createPluginAPI. */
export interface LayoutStoreAccessor {
  getState: () => Readonly<LayoutStore>;
  subscribe: <T>(
    selector: (state: LayoutStore) => T,
    callback: (value: T) => void,
  ) => () => void;
}

export interface PluginAPI {
  registerWidget: <P extends BaseWidgetProps>(definition: WidgetDefinition<P>) => void;
  unregisterWidget: (widgetId: string) => void;
  modifyWidget: (widgetId: string, patch: Partial<WidgetDefinition>) => void;
  wrapWidget: (widgetId: string, wrapper: WidgetWrapper) => void;
  extendConfig: (
    widgetId: string,
    fields: Record<string, ConfigField>,
  ) => void;
  addHook: <T extends HookName>(name: T, handler: HookHandler<T>) => void;
  removeHook: <T extends HookName>(name: T, handler: HookHandler<T>) => void;
  injectSlot: (
    slotId: SlotId,
    component: ComponentType<SlotProps>,
  ) => void;
  getStore: () => Readonly<LayoutStore>;
  subscribe: <T>(
    selector: (state: LayoutStore) => T,
    callback: (value: T) => void,
  ) => () => void;
}

export interface WidgetPlugin {
  id: string;
  name: string;
  version: string;
  priority?: number;
  requires?: string[];
  setup: (api: PluginAPI) => void | Promise<void>;
  teardown?: () => void;
}

/** Narrow hook handler typing — expand per hook as needed */
export type HookHandler<T extends HookName> =
  T extends "editor:widgetPalette"
    ? (
        widgets: WidgetDefinition[],
        ctx: HookContext,
      ) => WidgetDefinition[]
    : T extends "widget:beforeRender"
      ? (
          props: Record<string, unknown>,
          widget: WidgetInstance,
          ctx: HookContext,
        ) => Record<string, unknown> | false
      : T extends "widget:afterRender"
        ? (
            element: ReactElement,
            widget: WidgetInstance,
            ctx: HookContext,
          ) => ReactElement
        : (data: unknown, ctx: HookContext) => unknown;
