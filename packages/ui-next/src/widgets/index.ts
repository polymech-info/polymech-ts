/**
 * Widget / plugin / extension-slot scaffolding (see `packages/ui/docs/widgets-api.md`).
 */

// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  BaseWidgetProps,
  ConfigField,
  HookContext,
  HookHandler,
  HookName,
  LayoutNode,
  LayoutStore,
  LayoutStoreAccessor,
  NodeConstraints,
  NodeLayout,
  PageLayout,
  PluginAPI,
  SlotId,
  SlotProps,
  WidgetDefinition,
  WidgetInstance,
  WidgetMetadata,
  WidgetPlugin,
  WidgetWrapper,
} from "@/widgets/types";

// ─── Registries & plugin system ──────────────────────────────────────────────
export { WidgetRegistry } from "@/widgets/registry/WidgetRegistry";
export { HookRegistry } from "@/widgets/plugins/HookRegistry";
export { SlotRegistry } from "@/widgets/plugins/SlotRegistry";
export { PluginManager } from "@/widgets/plugins/PluginManager";
export { createPluginAPI } from "@/widgets/plugins/createPluginAPI";
export { ExtensionSlot } from "@/widgets/slots/ExtensionSlot";

// ─── Singletons ───────────────────────────────────────────────────────────────
export {
  useLayoutStore,
  widgetRegistry,
  hookRegistry,
  slotRegistry,
  pluginManager,
} from "@/widgets/system";

// ─── Bootstrap ───────────────────────────────────────────────────────────────
export { bootWidgetSystem } from "@/widgets/bootstrap/boot";
export { coreWidgetsPlugin } from "@/widgets/bootstrap/corePlugin";
export { demoToolbarPlugin } from "@/widgets/bootstrap/demoToolbarPlugin";

// ─── Node renderer ───────────────────────────────────────────────────────────
export { NodeRenderer } from "@/widgets/renderer/NodeRenderer";
export type { NodeRendererProps } from "@/widgets/renderer/NodeRenderer";

// ─── Layout nodes ────────────────────────────────────────────────────────────
export { FlexNode } from "@/widgets/nodes/flex/FlexNode";
export type { FlexNodeProps } from "@/widgets/nodes/flex/FlexNode";
export { FlexRowNode } from "@/widgets/nodes/flex/FlexRowNode";
export type { FlexRowNodeProps } from "@/widgets/nodes/flex/FlexRowNode";

// ─── Persistence ─────────────────────────────────────────────────────────────
export type { PagePersistence } from "@/store/persistence/PagePersistence";
export { LocalStoragePagePersistence } from "@/store/persistence/LocalStoragePagePersistence";

// ─── Sample widgets ──────────────────────────────────────────────────────────
export { TextBlockWidget } from "@/widgets/widgets/sample/TextBlockWidget";
export type { TextBlockWidgetProps } from "@/widgets/widgets/sample/TextBlockWidget";
export { ImageWidget } from "@/widgets/widgets/sample/ImageWidget";
export type { ImageWidgetProps, ImageFit } from "@/widgets/widgets/sample/ImageWidget";

// ─── Introspection utilities ──────────────────────────────────────────────────
export {
  findNodesByCapability,
  treeCapabilityMap,
  nodeHasCapability,
} from "@/widgets/utils/introspection";
