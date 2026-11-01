import type { ComponentType } from "react";

import type {
  BaseWidgetProps,
  ConfigField,
  HookHandler,
  HookName,
  LayoutStore,
  LayoutStoreAccessor,
  PluginAPI,
  SlotId,
  SlotProps,
} from "@/widgets/types";

import { HookRegistry } from "@/widgets/plugins/HookRegistry";
import { SlotRegistry } from "@/widgets/plugins/SlotRegistry";
import { WidgetRegistry } from "@/widgets/registry/WidgetRegistry";

type CreatePluginAPIParams = {
  widgetRegistry: WidgetRegistry;
  hookRegistry: HookRegistry;
  slotRegistry: SlotRegistry;
  storeAccessor: LayoutStoreAccessor;
  pluginId: string;
  priority: number;
};

export function createPluginAPI({
  widgetRegistry,
  hookRegistry,
  slotRegistry,
  storeAccessor,
  pluginId,
  priority,
}: CreatePluginAPIParams): PluginAPI {
  return {
    registerWidget: (definition) => {
      widgetRegistry.register(definition);
    },

    unregisterWidget: (widgetId) => {
      widgetRegistry.unregister(widgetId);
    },

    modifyWidget: (widgetId, patch) => {
      widgetRegistry.modify(widgetId, patch);
    },

    wrapWidget: (widgetId, wrapper) => {
      const def = widgetRegistry.get(widgetId);
      if (!def) return;
      const Inner = def.component;
      widgetRegistry.modify(widgetId, {
        component: wrapper(Inner) as typeof Inner,
      });
    },

    extendConfig: (widgetId, fields) => {
      const def = widgetRegistry.get(widgetId);
      if (!def) return;
      const prev = def.metadata.configSchema ?? {};
      widgetRegistry.modify(widgetId, {
        metadata: {
          ...def.metadata,
          configSchema: { ...prev, ...fields } as typeof def.metadata.configSchema,
        },
      });
    },

    addHook: <T extends HookName>(name: T, handler: HookHandler<T>) => {
      hookRegistry.add(name, pluginId, priority, handler);
    },

    removeHook: <T extends HookName>(name: T, handler: HookHandler<T>) => {
      hookRegistry.remove(name, handler);
    },

    injectSlot: (slotId: SlotId, component: ComponentType<SlotProps>) => {
      slotRegistry.inject(slotId, pluginId, component);
    },

    getStore: () => storeAccessor.getState(),

    subscribe: <T>(selector: (state: LayoutStore) => T, callback: (value: T) => void) =>
      storeAccessor.subscribe(selector, callback),
  };
}
