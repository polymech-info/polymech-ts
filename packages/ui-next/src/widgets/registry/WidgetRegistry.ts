import type { BaseWidgetProps, WidgetDefinition } from "@/widgets/types";

export class WidgetRegistry {
  private readonly defs = new Map<string, WidgetDefinition<BaseWidgetProps>>();

  register<P extends BaseWidgetProps>(definition: WidgetDefinition<P>): void {
    const id = definition.metadata.id;
    this.defs.set(id, definition as WidgetDefinition<BaseWidgetProps>);
  }

  unregister(widgetId: string): void {
    this.defs.delete(widgetId);
  }

  get(widgetId: string): WidgetDefinition<BaseWidgetProps> | undefined {
    return this.defs.get(widgetId);
  }

  getAll(): WidgetDefinition<BaseWidgetProps>[] {
    return [...this.defs.values()];
  }

  /** Non-destructive metadata merge + optional component replace */
  modify(widgetId: string, patch: Partial<WidgetDefinition>): void {
    const cur = this.defs.get(widgetId);
    if (!cur) return;
    this.defs.set(widgetId, {
      ...cur,
      ...patch,
      metadata: patch.metadata
        ? { ...cur.metadata, ...patch.metadata }
        : cur.metadata,
    });
  }
}
