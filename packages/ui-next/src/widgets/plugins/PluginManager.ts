import { createPluginAPI } from "@/widgets/plugins/createPluginAPI";
import { HookRegistry } from "@/widgets/plugins/HookRegistry";
import { SlotRegistry } from "@/widgets/plugins/SlotRegistry";
import { WidgetRegistry } from "@/widgets/registry/WidgetRegistry";
import type { LayoutStoreAccessor, WidgetPlugin } from "@/widgets/types";

export class PluginManager {
  private readonly plugins = new Map<string, WidgetPlugin>();

  constructor(
    private readonly widgetRegistry: WidgetRegistry,
    private readonly hookRegistry: HookRegistry,
    private readonly slotRegistry: SlotRegistry,
    private readonly storeAccessor: LayoutStoreAccessor,
  ) {}

  async register(plugin: WidgetPlugin): Promise<void> {
    const missing = plugin.requires?.filter((dep) => !this.plugins.has(dep));
    if (missing?.length) {
      throw new Error(`Plugin ${plugin.id} missing deps: ${missing.join(", ")}`);
    }

    const api = createPluginAPI({
      widgetRegistry: this.widgetRegistry,
      hookRegistry: this.hookRegistry,
      slotRegistry: this.slotRegistry,
      storeAccessor: this.storeAccessor,
      pluginId: plugin.id,
      priority: plugin.priority ?? 0,
    });

    try {
      await plugin.setup(api);
    } catch (e) {
      console.error(`[widgets] Plugin setup failed: ${plugin.id}`, e);
      throw e;
    }

    this.plugins.set(plugin.id, plugin);
  }

  async unregister(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;
    try {
      plugin.teardown?.();
    } catch (e) {
      console.error(`[widgets] Plugin teardown failed: ${pluginId}`, e);
    }
    this.hookRegistry.removeHooksForPlugin(pluginId);
    this.slotRegistry.clearPlugin(pluginId);
    this.plugins.delete(pluginId);
  }

  getPlugins(): WidgetPlugin[] {
    return [...this.plugins.values()].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
    );
  }

  hasPlugin(id: string): boolean {
    return this.plugins.has(id);
  }
}
