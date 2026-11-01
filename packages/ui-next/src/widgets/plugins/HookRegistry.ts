import type {
  HookContext,
  HookHandler,
  HookName,
  LayoutStore,
} from "@/widgets/types";

type RegisteredHook = {
  pluginId: string;
  priority: number;
  handler: HookHandler<HookName>;
};

export class HookRegistry {
  private readonly hooks = new Map<HookName, RegisteredHook[]>();

  add<T extends HookName>(
    name: T,
    pluginId: string,
    priority: number,
    handler: HookHandler<T>,
  ): void {
    const list = this.hooks.get(name) ?? [];
    list.push({
      pluginId,
      priority,
      handler: handler as HookHandler<HookName>,
    });
    list.sort((a, b) => b.priority - a.priority);
    this.hooks.set(name, list);
  }

  remove<T extends HookName>(
    name: T,
    handler: HookHandler<T>,
  ): void {
    const list = this.hooks.get(name);
    if (!list) return;
    const next = list.filter((h) => h.handler !== handler);
    if (next.length) this.hooks.set(name, next);
    else this.hooks.delete(name);
  }

  getHandlers(name: HookName): RegisteredHook[] {
    return [...(this.hooks.get(name) ?? [])];
  }

  removeHooksForPlugin(pluginId: string): void {
    for (const [name, list] of this.hooks.entries()) {
      const next = list.filter((h) => h.pluginId !== pluginId);
      if (next.length !== list.length) {
        if (next.length) this.hooks.set(name, next);
        else this.hooks.delete(name);
      }
    }
  }

  /** Run pipeline for hooks that transform data (best-effort typing). */
  runSync<T extends HookName>(
    name: T,
    initial: unknown,
    ctx: HookContext,
  ): unknown {
    let acc = initial;
    for (const { handler } of this.getHandlers(name)) {
      const fn = handler as (data: unknown, c: HookContext) => unknown;
      acc = fn(acc, ctx);
      if (acc === false) break;
    }
    return acc;
  }
}

