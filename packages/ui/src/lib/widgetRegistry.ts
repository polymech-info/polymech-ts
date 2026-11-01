import { WidgetType } from '@polymech/shared';

export interface WidgetMetadata<P = Record<string, any>> {
  id: WidgetType | (string & {});
  name: string;
  category: 'control' | 'display' | 'chart' | 'system' | 'custom' | string;
  description: string;
  icon?: React.ComponentType;
  thumbnail?: string;
  defaultProps?: P;
  configSchema?: Record<string, any>;
  minSize?: { width: number; height: number };
  resizable?: boolean;
  tags?: string[];
}

export interface WidgetDefinition<P = Record<string, any>> {
  component: React.ComponentType<any>;
  metadata: WidgetMetadata<P>;
  previewComponent?: React.ComponentType<P>;
  getNestedLayouts?: (props: P) => { id: string; label: string; layoutId: string }[];
}

class WidgetRegistry {
  private widgets = new Map<string, WidgetDefinition<any>>();

  register<P = Record<string, any>>(definition: WidgetDefinition<P>) {
    if (this.widgets.has(definition.metadata.id)) {
      // Allow overwriting for HMR/Dynamic loading, just log info if needed
      // console.debug(`Updating existing widget registration: '${definition.metadata.id}'`);
    }
    this.widgets.set(definition.metadata.id, definition as WidgetDefinition<any>);
  }

  get(id: string): WidgetDefinition | undefined {
    return this.widgets.get(id);
  }

  getAll(): WidgetDefinition[] {
    return Array.from(this.widgets.values()).sort((a, b) =>
      a.metadata.name.localeCompare(b.metadata.name)
    );
  }

  getByCategory(category: string): WidgetDefinition[] {
    return this.getAll().filter(w => w.metadata.category === category);
  }

  search(query: string): WidgetDefinition[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAll().filter(w =>
      w.metadata.name.toLowerCase().includes(lowercaseQuery) ||
      w.metadata.description.toLowerCase().includes(lowercaseQuery) ||
      w.metadata.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  clear() {
    this.widgets.clear();
  }

  getCount(): number {
    return this.widgets.size;
  }
}

export const widgetRegistry = new WidgetRegistry();
