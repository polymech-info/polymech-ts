import type { ComponentType } from "react";

import type { SlotId, SlotProps } from "@/widgets/types";

export type SlotEntry = {
  /** Stable within session — supports multiple injections per plugin */
  entryId: string;
  pluginId: string;
  component: ComponentType<SlotProps>;
};

const EMPTY: readonly SlotEntry[] = [];

/**
 * Holds injected slot components; `subscribe` lets React re-render ExtensionSlot.
 */
export class SlotRegistry {
  private version = 0;
  private readonly slots = new Map<SlotId, SlotEntry[]>();
  private readonly listeners = new Set<() => void>();

  inject(slotId: SlotId, pluginId: string, component: ComponentType<SlotProps>): void {
    const list = this.slots.get(slotId) ?? [];
    const entryId = `${pluginId}:${list.length}:${Date.now()}`;
    list.push({ entryId, pluginId, component });
    this.slots.set(slotId, list);
    this.bump();
  }

  clearPlugin(pluginId: string): void {
    let changed = false;
    for (const [id, list] of this.slots) {
      const next = list.filter((e) => e.pluginId !== pluginId);
      if (next.length !== list.length) {
        changed = true;
        if (next.length) this.slots.set(id, next);
        else this.slots.delete(id);
      }
    }
    if (changed) this.bump();
  }

  get(slotId: SlotId): readonly SlotEntry[] {
    return this.slots.get(slotId) ?? EMPTY;
  }

  getVersion(): number {
    return this.version;
  }

  subscribe = (onStoreChange: () => void): (() => void) => {
    this.listeners.add(onStoreChange);
    return () => this.listeners.delete(onStoreChange);
  };

  private bump(): void {
    this.version += 1;
    this.listeners.forEach((l) => l());
  }
}
