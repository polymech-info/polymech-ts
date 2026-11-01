/**
 * Process-wide widget system singletons.
 * For tests, instantiate PluginManager + registries manually.
 */
import { PluginManager } from "@/widgets/plugins/PluginManager";
import { HookRegistry } from "@/widgets/plugins/HookRegistry";
import { SlotRegistry } from "@/widgets/plugins/SlotRegistry";
import { WidgetRegistry } from "@/widgets/registry/WidgetRegistry";
import { layoutStoreAccessor } from "@/store/useLayoutStore";

export { useLayoutStore } from "@/store/useLayoutStore";

export const widgetRegistry = new WidgetRegistry();
export const hookRegistry = new HookRegistry();
export const slotRegistry = new SlotRegistry();

export const pluginManager = new PluginManager(
  widgetRegistry,
  hookRegistry,
  slotRegistry,
  layoutStoreAccessor,
);
