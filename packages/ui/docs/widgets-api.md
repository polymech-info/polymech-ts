# Widget & Container API — Complete Interface Proposal

> This document proposes a unified, type-safe API for the widget/container system.
> It consolidates current patterns from the codebase and introduces missing lifecycle hooks,
> nested layout management, and a proper context contract.

---

## 1. Widget Definition (Registry)

**Current**: [src/lib/widgetRegistry.ts](../src/lib/widgetRegistry.ts) · [src/lib/registerWidgets.ts](../src/lib/registerWidgets.ts)

```ts
interface WidgetDefinition<P extends BaseWidgetProps = BaseWidgetProps> {
  /** React component — receives merged props + context */
  component: React.ComponentType<P>;
  /** Edit-mode-only component (optional, lazy-loaded) */
  editComponent?: React.LazyExoticComponent<React.ComponentType<P>>;
  /** Static metadata for palette, search, AI layout generation */
  metadata: WidgetMetadata<P>;
  /** Preview thumbnail component for drag preview */
  previewComponent?: React.ComponentType<P>;

  // ─── Nested Layout Support ───
  /** Declare sub-layouts this widget manages (tabs, accordion panels, etc.) */
  getNestedLayouts?: (props: P) => NestedLayoutRef[];
  /** How nested layout data is embedded — determines save strategy */
  nestedLayoutStrategy?: 'embedded' | 'linked';

  // ─── Lifecycle Hooks ───
  /** Called once when widget is first added to a container */
  onInit?: (context: WidgetLifecycleContext) => Partial<P> | void;
  /** Called before the parent layout saves — return final props */
  onBeforeSave?: (props: P, context: WidgetLifecycleContext) => P;
  /** Called when widget is removed from a container */
  onDestroy?: (props: P, context: WidgetLifecycleContext) => void;
  /** Validate props — return error messages or null */
  validate?: (props: P) => Record<string, string> | null;

  // ─── Translation ───
  /** List prop keys that contain translatable content */
  translatableProps?: (keyof P)[];
  /** Custom extraction for complex nested translatable content */
  extractTranslatableContent?: (props: P) => TranslatableEntry[];

  // ─── Export ───
  /** Render to static HTML for email/PDF export */
  renderStatic?: (props: P, context: ExportContext) => string;
}
```

### Widget Metadata

```ts
interface WidgetMetadata<P = Record<string, any>> {
  id: string;                          // Unique registry key, e.g. 'tabs-widget'
  name: string;                        // Display name (translatable)
  category: WidgetCategory;            // Palette grouping
  description: string;                 // Tooltip/search description
  icon?: React.ComponentType;          // Lucide icon component
  thumbnail?: string;                  // Image URL for visual palette
  defaultProps?: Partial<P>;           // Initial values on widget creation
  configSchema?: ConfigSchema<P>;      // Property editor definition
  minSize?: { width: number; height: number };
  resizable?: boolean;
  tags?: string[];                     // Search/AI discovery tags

  // ─── New ───
  /** Widget capabilities for container-level feature gating */
  capabilities?: WidgetCapability[];
  /** Maximum instances per page (e.g. 1 for 'home' widget) */
  maxInstances?: number;
  /** Restrict to specific container types */
  allowedContainers?: ContainerType[];
}

type WidgetCategory = 'control' | 'display' | 'layout' | 'chart' | 'system' | 'custom';
type WidgetCapability = 'nested-layout' | 'translatable' | 'data-bound' | 'interactive' | 'exportable';
```

---

## 2. Widget Props Contract

**Current**: Props are spread as `{...(widget.props || {})}` in [src/modules/layout/LayoutContainerEdit.tsx](../src/modules/layout/LayoutContainerEdit.tsx) (line 776)

```ts
/** Every widget component receives these props — non-negotiable */
interface BaseWidgetProps {
  // ─── Identity ───
  widgetInstanceId: string;            // Unique instance ID within layout
  widgetDefId: string;                 // Registry ID (e.g. 'tabs-widget')

  // ─── Mode ───
  isEditMode: boolean;                 // View vs Edit mode
  enabled?: boolean;                   // Soft-disable (grayed out in edit, hidden in view)

  // ─── Mutations ───
  onPropsChange: (partial: Record<string, any>) => Promise<void>;

  // ─── Selection (edit mode) ───
  selectedWidgetId?: string | null;
  onSelectWidget?: (widgetId: string, pageId?: string) => void;
  editingWidgetId?: string | null;
  onEditWidget?: (widgetId: string | null) => void;
  selectedContainerId?: string | null;
  onSelectContainer?: (containerId: string, pageId?: string) => void;

  // ─── Data ───
  contextVariables?: Record<string, any>;   // Page-level template variables
  pageContext?: Record<string, any>;        // Page metadata (slug, locale, etc.)

  // ─── Styling ───
  customClassName?: string;            // User-defined Tailwind classes
}
```

### Specialized Prop Interfaces (examples)

```ts
interface TabsWidgetProps extends BaseWidgetProps {
  tabs: TabDef[];
  activeTabId?: string;
  orientation?: 'horizontal' | 'vertical';
  tabBarPosition?: 'top' | 'bottom' | 'left' | 'right';
  tabBarClassName?: string;
  contentClassName?: string;
}

interface TabDef {
  id: string;
  label: string;
  icon?: string;
  layoutId: string;
  layoutData?: PageLayout;             // Embedded layout (source of truth for save)
}
```

---

## 3. Config Schema (Property Editor)

**Current**: `configSchema` in each widget registration in [src/lib/registerWidgets.ts](../src/lib/registerWidgets.ts)

```ts
type ConfigSchema<P> = {
  [K in keyof Partial<P>]: ConfigField;
} & {
  /** Virtual fields that map to multiple props (e.g. mountAndPath → mount + path) */
  [virtualKey: string]: ConfigField;
};

interface ConfigField {
  type: ConfigFieldType;
  label: string;
  description?: string;
  default?: any;

  // ─── Conditional visibility ───
  /** Only show this field when condition is met */
  showWhen?: { field: string; equals: any } | ((props: any) => boolean);
  /** Disable editing when condition is met */
  disableWhen?: { field: string; equals: any };

  // ─── Type-specific options ───
  options?: { value: string; label: string }[];    // for 'select'
  min?: number; max?: number; step?: number;       // for 'number'/'range'
  multiSelect?: boolean;                           // for 'imagePicker'
  mountKey?: string; pathKey?: string;             // for 'vfsPicker'

  // ─── Validation ───
  required?: boolean;
  pattern?: RegExp;
  customValidate?: (value: any, allProps: any) => string | null;

  // ─── Groups ───
  group?: string;                      // Visual grouping in property panel
  order?: number;                      // Sort order within group
}

type ConfigFieldType =
  | 'text' | 'number' | 'boolean' | 'select' | 'selectWithText'
  | 'color' | 'range' | 'classname' | 'markdown'
  | 'imagePicker' | 'pagePicker' | 'vfsPicker'
  | 'tabs-editor' | 'json'
  | 'component';   // Custom React component as editor
```

---

## 4. Widget Instance (Stored in Layout)

**Current**: [src/modules/layout/LayoutManager.ts](../src/modules/layout/LayoutManager.ts) (line 5)

```ts
interface WidgetInstance {
  id: string;                          // Unique per layout
  widgetId: string;                    // References WidgetDefinition.metadata.id
  props?: Record<string, any>;         // Serialized props (JSON-safe)
  order?: number;                      // Sort order within container

  // ─── Flex Container placement ───
  rowId?: string;
  column?: number;

  // ─── Provenance ───
  snippetId?: string;                  // Tracks which snippet spawned this widget
  createdAt?: number;                  // For undo history / conflict resolution
}
```

---

## 5. Container Types

**Current**: [src/modules/layout/LayoutManager.ts](../src/modules/layout/LayoutManager.ts) (lines 17-61)

```ts
type ContainerType = 'container' | 'flex-container';

/** Traditional grid container */
interface LayoutContainer {
  id: string;
  type: 'container';
  columns: number;
  gap: number;
  widgets: WidgetInstance[];
  children: LayoutContainer[];         // Recursive nesting
  order?: number;
  settings?: ContainerSettings;
}

/** Row-based flex container with adjustable columns */
interface FlexibleContainer {
  id: string;
  type: 'flex-container';
  rows: RowDef[];
  widgets: WidgetInstance[];           // Widgets reference rowId + column
  gap: number;
  order?: number;
  settings?: ContainerSettings;
}

type AnyContainer = LayoutContainer | FlexibleContainer;

interface ContainerSettings {
  collapsible?: boolean;
  collapsed?: boolean;
  title?: string;
  showTitle?: boolean;
  customClassName?: string;
  enabled?: boolean;

  // ─── New ───
  /** Background color/gradient */
  background?: string;
  /** Padding override (Tailwind class) */
  padding?: string;
  /** Max width constraint */
  maxWidth?: string;
  /** Visibility conditions */
  visibleWhen?: VisibilityCondition;
}

interface VisibilityCondition {
  /** 'always' | 'authenticated' | 'role:admin' | custom expression */
  rule: string;
  /** Invert the condition */
  negate?: boolean;
}
```

### Row Definition (FlexContainer)

```ts
interface RowDef {
  id: string;
  columns: ColumnDef[];
  gap?: number;
  sizing?: 'constrained' | 'unconstrained';
  cellAlignments?: ('stretch' | 'start' | 'center' | 'end')[];
  padding?: string;
}

interface ColumnDef {
  width: number;
  unit: 'fr' | 'px' | 'rem' | '%';
  minWidth?: number;
}
```

---

## 6. Page Layout (Top-Level)

**Current**: [src/modules/layout/LayoutManager.ts](../src/modules/layout/LayoutManager.ts) (line 63)

```ts
interface PageLayout {
  id: string;
  name: string;
  containers: AnyContainer[];
  createdAt: number;
  updatedAt: number;
  loadedBundles?: string[];
  rootTemplate?: string;

  // ─── New ───
  /** Schema version for migration */
  version: string;
  /** Layout-level metadata */
  meta?: {
    description?: string;
    thumbnail?: string;
    /** Lock layout from editing */
    locked?: boolean;
  };
}

interface RootLayoutData {
  pages: Record<string, PageLayout>;
  version: string;
  lastUpdated: number;
}
```

---

## 7. Nested Layout Management

**Current**: `getNestedLayouts` + SYNC-BACK pattern in [src/components/widgets/TabsWidget.tsx](../src/components/widgets/TabsWidget.tsx)

### Problem Space

Widgets like Tabs, Accordions, and LayoutContainerWidget manage **sub-layouts** — independent `PageLayout` trees embedded as props. The current system uses a SYNC-BACK effect to bridge `loadedPages` (live editing state) back to widget props (persistence), which causes [race conditions](./nested-ex.md).

### Proposed: NestedLayoutManager

```ts
interface NestedLayoutRef {
  id: string;                          // Semantic ID (e.g. 'tab-1')
  label: string;                       // Display label
  layoutId: string;                    // Key in loadedPages
}

/** Provided by LayoutContext to widgets that declare nested layouts */
interface NestedLayoutManager {
  /** Register a sub-layout — hydrates from embedded data, returns cleanup */
  register(layoutId: string, initialData?: PageLayout): () => void;
  /** Check if a layout has been authoritatively hydrated */
  isHydrated(layoutId: string): boolean;
  /** Get current layout data for serialization (save path) */
  getLayoutData(layoutId: string): PageLayout | undefined;
  /** Subscribe to layout changes (replaces SYNC-BACK polling) */
  onLayoutChange(layoutId: string, callback: (layout: PageLayout) => void): () => void;
}
```

### Usage in TabsWidget (proposed)

```tsx
const TabsWidget: React.FC<TabsWidgetProps> = ({ tabs, isEditMode, onPropsChange }) => {
  const { nestedLayouts } = useLayout();

  // Register all tab layouts on mount
  useEffect(() => {
    if (!isEditMode) return;
    const cleanups = tabs.map(t =>
      nestedLayouts.register(t.layoutId, t.layoutData)
    );
    return () => cleanups.forEach(fn => fn());
  }, [tabs.length]); // Only re-register when tabs are added/removed

  // Subscribe to changes — replaces SYNC-BACK
  useEffect(() => {
    if (!isEditMode) return;
    const unsubs = tabs.map(t =>
      nestedLayouts.onLayoutChange(t.layoutId, (layout) => {
        onPropsChange({
          tabs: tabs.map(tab =>
            tab.layoutId === t.layoutId ? { ...tab, layoutData: layout } : tab
          )
        });
      })
    );
    return () => unsubs.forEach(fn => fn());
  }, [tabs]);

  return (
    <GenericCanvas
      pageId={currentTab.layoutId}
      initialLayout={currentTab.layoutData}
      isEditMode={isEditMode}
    />
  );
};
```

**Key difference**: No polling. No timestamp comparison. The `onLayoutChange` callback fires only on **real mutations** (widget add/remove/move/prop-change), not on hydration.

---

## 8. Widget Lifecycle Context

```ts
interface WidgetLifecycleContext {
  /** Current page ID */
  pageId: string;
  /** Current locale */
  locale: string;
  /** Access to the layout manager */
  layout: {
    addWidget: (containerId: string, widgetId: string, props?: any) => Promise<void>;
    removeWidget: (containerId: string, widgetInstanceId: string) => Promise<void>;
    getContainer: (containerId: string) => AnyContainer | undefined;
  };
  /** Access to nested layout manager (if widget has nested layouts) */
  nestedLayouts?: NestedLayoutManager;
  /** User info */
  user?: { id: string; role: string };
}
```

---

## 9. Container Rendering Contract

**Current**: [src/modules/layout/LayoutContainerEdit.tsx](../src/modules/layout/LayoutContainerEdit.tsx) · [src/modules/layout/LayoutContainerView.tsx](../src/modules/layout/LayoutContainerView.tsx)

```ts
/** Props passed to container renderers */
interface ContainerRendererProps {
  container: AnyContainer;
  pageId: string;
  isEditMode: boolean;
  depth: number;                       // Nesting depth (for styling/limits)

  // ─── Edit mode only ───
  onAddWidget?: (widgetId: string, snippetId?: string) => void;
  onRemoveWidget?: (widgetInstanceId: string) => void;
  onMoveWidget?: (widgetInstanceId: string, direction: Direction) => void;
  onReorderWidget?: (widgetInstanceId: string, newIndex: number) => void;

  // ─── Selection ───
  selectedWidgetId?: string | null;
  onSelectWidget?: (widgetId: string) => void;
  editingWidgetId?: string | null;
  onEditWidget?: (widgetId: string | null) => void;
  selectedContainerId?: string | null;
  onSelectContainer?: (containerId: string) => void;

  // ─── Context ───
  contextVariables?: Record<string, any>;
  pageContext?: Record<string, any>;
}

type Direction = 'up' | 'down' | 'left' | 'right';
```

---

## 10. Layout Context API

**Current**: [src/modules/layout/LayoutContext.tsx](../src/modules/layout/LayoutContext.tsx)

```ts
interface LayoutContextValue {
  // ─── State ───
  loadedPages: Map<string, PageLayout>;
  isLoading: boolean;
  /** Tracks which layouts have been authoritatively hydrated */
  hydratedIds: ReadonlySet<string>;

  // ─── Page Operations ───
  loadPageLayout: (pageId: string, pageName?: string) => Promise<void>;
  hydratePageLayout: (pageId: string, layout: PageLayout) => void;
  savePageLayout: (pageId: string) => Promise<void>;

  // ─── Container Operations ───
  addPageContainer: (pageId: string, type?: ContainerType) => Promise<void>;
  removePageContainer: (pageId: string, containerId: string) => Promise<void>;
  updateContainerSettings: (pageId: string, containerId: string, settings: Partial<ContainerSettings>) => Promise<void>;

  // ─── Widget Operations ───
  addWidget: (pageId: string, containerId: string, widgetId: string, props?: any, snippetId?: string) => Promise<string>;
  removeWidget: (pageId: string, containerId: string, widgetInstanceId: string) => Promise<void>;
  moveWidget: (pageId: string, widgetInstanceId: string, direction: Direction) => Promise<void>;
  updateWidgetProps: (pageId: string, widgetInstanceId: string, props: Record<string, any>) => Promise<void>;
  renameWidget: (pageId: string, widgetInstanceId: string, name: string) => Promise<void>;

  // ─── Nested Layout Management ───
  nestedLayouts: NestedLayoutManager;
}
```

---

## 11. Export Context

```ts
interface ExportContext {
  format: 'html' | 'email' | 'pdf' | 'amp';
  locale: string;
  baseUrl: string;
  /** Resolve asset URLs (images, etc.) */
  resolveAsset: (path: string) => string;
  /** Current page context */
  page: { slug: string; title: string; locale: string };
}
```

---

## File Map

| Interface | Current Location | Status |
|-----------|-----------------|--------|
| `WidgetDefinition` | [src/lib/widgetRegistry.ts](../src/lib/widgetRegistry.ts) | Extend |
| `WidgetMetadata` | [src/lib/widgetRegistry.ts](../src/lib/widgetRegistry.ts) | Extend |
| `WidgetInstance` | [src/modules/layout/LayoutManager.ts](../src/modules/layout/LayoutManager.ts) | Minor additions |
| `LayoutContainer` | [src/modules/layout/LayoutManager.ts](../src/modules/layout/LayoutManager.ts) | Extend settings |
| `FlexibleContainer` | [src/modules/layout/LayoutManager.ts](../src/modules/layout/LayoutManager.ts) | Stable |
| `PageLayout` | [src/modules/layout/LayoutManager.ts](../src/modules/layout/LayoutManager.ts) | Add version/meta |
| `ConfigSchema` | inline in [src/lib/registerWidgets.ts](../src/lib/registerWidgets.ts) | Extract to types |
| `NestedLayoutManager` | — | **New** |
| `WidgetLifecycleContext` | — | **New** |
| `BaseWidgetProps` | implicit in [src/modules/layout/LayoutContainerEdit.tsx](../src/modules/layout/LayoutContainerEdit.tsx) | **Extract** |
| Widget registrations | [src/lib/registerWidgets.ts](../src/lib/registerWidgets.ts) | Adopt new types |
| Container rendering | [src/modules/layout/LayoutContainerEdit.tsx](../src/modules/layout/LayoutContainerEdit.tsx) | Formalize contract |
| Layout context | [src/modules/layout/LayoutContext.tsx](../src/modules/layout/LayoutContext.tsx) | Add `nestedLayouts` |

---

## 12. State Management — Escaping Callback Hell

### The Problem

The current system passes **13+ props** through every widget instance ([LayoutContainerEdit.tsx](../src/modules/layout/LayoutContainerEdit.tsx) lines 775-788):

```tsx
<WidgetComponent
  {...(widget.props || {})}
  widgetInstanceId={widget.id}        // identity
  widgetDefId={widget.widgetId}       // identity
  isEditMode={isEditMode}             // mode
  onPropsChange={handlePropsChange}   // callback
  selectedWidgetId={selectedWidgetId} // state (global)
  onSelectWidget={onSelectWidget}     // callback
  editingWidgetId={editingWidgetId}   // state (global)
  onEditWidget={onEditWidget}         // callback
  contextVariables={contextVariables} // data
  pageContext={pageContext}           // data
  selectedContainerId={...}           // state (global)
  onSelectContainer={...}             // callback
/>
```

Every nesting level (Container → Widget → TabsWidget → GenericCanvas → Container → Widget) re-spreads all callbacks. This causes:
- Re-render cascades (any selection change re-renders every widget)
- Stale closures in deeply nested effects
- Race conditions (the SYNC-BACK bug)
- Unmaintainable component signatures

### Option A: Preact Signals

Signals are **reactive primitives** that bypass React's render cycle. A signal write only re-renders components that directly read it.

```ts
// layoutSignals.ts
import { signal, computed, effect } from '@preact/signals-react';

export const selectedWidgetId = signal<string | null>(null);
export const editingWidgetId = signal<string | null>(null);
export const loadedPages = signal(new Map<string, PageLayout>());
export const hydratedIds = signal(new Set<string>());

// Derived — no useEffect needed
export const currentLayout = computed(() =>
  loadedPages.value.get(currentPageId.value)
);

// Replace SYNC-BACK with a simple effect
effect(() => {
  const pages = loadedPages.value;
  // Fires only when loadedPages actually changes — no polling
});
```

Widget component — zero callback props:

```tsx
const TabsWidget = ({ tabs, widgetInstanceId }) => {
  const isSelected = selectedWidgetId.value === widgetInstanceId;
  const handleClick = () => { selectedWidgetId.value = widgetInstanceId; };
  // No onSelectWidget, onPropsChange, etc.
};
```

| Pros | Cons |
|------|------|
| Zero callbacks, zero prop drilling | New paradigm — team adoption overhead |
| Surgical re-renders (only readers update) | Mutable state — harder to debug than React DevTools |
| `effect()` replaces SYNC-BACK entirely | Suspense/concurrent mode not fully compatible |
| Tiny bundle (~1KB) | Signal chains harder to trace than component tree |

**Reference projects using Signals:**
- [Preact Signals for React](https://github.com/preactjs/signals) — Official adapter
- [Signia](https://github.com/tldraw/signia) — tldraw's signal library (powers their canvas)
- [Solid.js](https://www.solidjs.com/) — Framework built entirely on signals (inspiration, not direct use)

---

### Option B: Zustand Store ⭐ recommended

A thin external store replaces all callback+state props. Widgets subscribe to **slices** — only re-render when their specific data changes.

```ts
// useLayoutStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface LayoutStore {
  // ─── State ───
  loadedPages: Map<string, PageLayout>;
  hydratedIds: Set<string>;
  selectedWidgetId: string | null;
  editingWidgetId: string | null;
  selectedContainerId: string | null;
  isEditMode: boolean;

  // ─── Actions (replace callbacks) ───
  selectWidget: (id: string | null) => void;
  editWidget: (id: string | null) => void;
  selectContainer: (id: string | null) => void;
  updateWidgetProps: (pageId: string, widgetId: string, props: Record<string, any>) => Promise<void>;
  hydrateLayout: (pageId: string, layout: PageLayout) => void;
  saveLayout: (pageId: string) => Promise<void>;
}

export const useLayoutStore = create<LayoutStore>()(
  subscribeWithSelector((set, get) => ({
    loadedPages: new Map(),
    hydratedIds: new Set(),
    selectedWidgetId: null,
    editingWidgetId: null,
    selectedContainerId: null,
    isEditMode: false,

    selectWidget: (id) => set({ selectedWidgetId: id }),
    editWidget: (id) => set({ editingWidgetId: id }),
    selectContainer: (id) => set({ selectedContainerId: id }),

    hydrateLayout: (pageId, layout) => {
      const pages = new Map(get().loadedPages);
      pages.set(pageId, layout);
      const hydrated = new Set(get().hydratedIds);
      hydrated.add(pageId);
      set({ loadedPages: pages, hydratedIds: hydrated });
    },

    updateWidgetProps: async (pageId, widgetId, props) => {
      const pages = new Map(get().loadedPages);
      const layout = pages.get(pageId);
      if (!layout) return;
      // ... mutate widget props in layout ...
      layout.updatedAt = Date.now();
      pages.set(pageId, { ...layout });
      set({ loadedPages: pages });
    },

    saveLayout: async (pageId) => { /* persist to backend */ },
  }))
);
```

Widget component — **4 props instead of 18**:

```tsx
const TabsWidget: React.FC<{ tabs: TabDef[]; widgetInstanceId: string }> = ({ tabs, widgetInstanceId }) => {
  // Selector-based — only re-renders when THIS widget's selection state changes
  const isSelected = useLayoutStore(s => s.selectedWidgetId === widgetInstanceId);
  const isEditMode = useLayoutStore(s => s.isEditMode);
  const selectWidget = useLayoutStore(s => s.selectWidget);
  const updateProps = useLayoutStore(s => s.updateWidgetProps);

  // Replace SYNC-BACK with subscribe (outside React render cycle)
  useEffect(() => {
    if (!isEditMode) return;
    return useLayoutStore.subscribe(
      s => s.loadedPages,
      (pages) => {
        // Only fires when loadedPages reference changes
        tabs.forEach(t => {
          const layout = pages.get(t.layoutId);
          if (layout && isRealMutation(layout, t.layoutData)) {
            updateProps(parentPageId, widgetInstanceId, {
              tabs: tabs.map(tab =>
                tab.layoutId === t.layoutId ? { ...tab, layoutData: layout } : tab
              )
            });
          }
        });
      }
    );
  }, [tabs, isEditMode]);
};
```

Container passes only identity props:

```tsx
// Before: 18 props
<WidgetComponent {...widget.props} widgetInstanceId={...} widgetDefId={...}
  isEditMode={...} onPropsChange={...} selectedWidgetId={...}
  onSelectWidget={...} editingWidgetId={...} onEditWidget={...}
  contextVariables={...} pageContext={...} selectedContainerId={...}
  onSelectContainer={...} />

// After: 4 props — everything else comes from the store
<WidgetComponent {...widget.props} widgetInstanceId={widget.id}
  widgetDefId={widget.widgetId} isEditMode={isEditMode} />
```

| Pros | Cons |
|------|------|
| Familiar React patterns, tiny API surface | Still React re-renders (selector-gated) |
| `subscribeWithSelector` replaces SYNC-BACK | Map/Set equality needs careful handling |
| Works with Suspense + concurrent mode | Zustand middleware stack can grow complex |
| Incremental migration — replace consumers one at a time | Extra dependency (~1.5KB) |
| Time-travel debugging with devtools middleware | — |

**Reference projects using Zustand:**
- [Zustand](https://github.com/pmndrs/zustand) — Docs, recipes, middleware patterns
- [tldraw](https://github.com/tldraw/tldraw) — Canvas editor with Zustand + Signia for state
- [Excalidraw](https://github.com/excalidraw/excalidraw) — Whiteboard with similar widget/element model
- [React Flow](https://github.com/xyflow/xyflow) — Node graph editor, Zustand-based state for nodes/edges
- [Plate.js](https://github.com/udecode/plate) — Plugin-based editor with Zustand stores per plugin
- [BuilderIO](https://github.com/BuilderIO/builder) — Visual page builder with widget registry patterns

---

### Option C: Context + useReducer (zero dependencies)

Keep React context but replace callbacks with actions:

```ts
type LayoutAction =
  | { type: 'SELECT_WIDGET'; widgetId: string | null; pageId?: string }
  | { type: 'EDIT_WIDGET'; widgetId: string | null }
  | { type: 'SELECT_CONTAINER'; containerId: string | null }
  | { type: 'UPDATE_PROPS'; pageId: string; widgetId: string; props: Record<string, any> }
  | { type: 'HYDRATE_LAYOUT'; pageId: string; layout: PageLayout };

// Split contexts to avoid re-render cascade
const LayoutStateContext = React.createContext<LayoutState>(null!);
const LayoutDispatchContext = React.createContext<React.Dispatch<LayoutAction>>(null!);

// Widget uses dispatch — stable reference, never changes
const dispatch = useLayoutDispatch();
dispatch({ type: 'SELECT_WIDGET', widgetId: id });
```

| Pros | Cons |
|------|------|
| Zero dependencies | Context still re-renders all consumers on state change |
| Standard React pattern | Must split into ~4 contexts to prevent cascade |
| Easy to type | No selector-based subscriptions (need `use-context-selector` polyfill) |
| — | More boilerplate than Zustand |

**Reference projects using Context+Reducer:**
- [use-context-selector](https://github.com/dai-shi/use-context-selector) — Selector API for React Context (by Zustand's author)
- [Lexical](https://github.com/facebook/lexical) — Facebook's editor, plugin-based with context commands
- [Gutenberg](https://github.com/WordPress/gutenberg) — WordPress block editor, registry + Redux stores

---

### Comparison

| | Signals | Zustand ⭐ | Context+Reducer |
|---|---------|---------|-----------------|
| **Migration effort** | High (paradigm shift) | Medium (incremental) | Low (refactor) |
| **Re-renders** | Only signal readers | Only selector matches | All context consumers |
| **SYNC-BACK fix** | `effect()` — built in | `subscribe()` — external | Still needs guard |
| **Suspense compat** | ⚠️ Partial | ✅ Full | ✅ Full |
| **Debugging** | Signal graph | Redux DevTools | React DevTools |
| **Bundle** | ~1KB | ~1.5KB | 0KB |
| **Callback props removed** | All | All | All (via dispatch) |
| **Deep nesting** | ✅ Flat access | ✅ Flat access | ✅ Flat access |

---

## 13. Plugin System — Modify, Inject, Extend

Plugins allow internal teams and third-party packages to modify existing widgets, inject new ones, extend container behavior, and hook into the layout lifecycle — without touching core code.

### Plugin Definition

```ts
interface WidgetPlugin {
  /** Unique plugin identifier (e.g. 'polymech:analytics', 'acme:custom-charts') */
  id: string;
  /** Human-readable name */
  name: string;
  /** Semver version */
  version: string;
  /** Plugin priority — higher priority plugins run first (default: 0) */
  priority?: number;
  /** Required capabilities — plugin won't load if missing */
  requires?: string[];

  // ─── Registration ───
  /** Called once during app bootstrap — register widgets, hooks, slots */
  setup: (api: PluginAPI) => void | Promise<void>;
  /** Called on hot reload / plugin unload — clean up */
  teardown?: () => void;
}
```

### Plugin API

The `PluginAPI` is the only interface plugins interact with. It gates all access.

```ts
interface PluginAPI {
  // ─── Widget Registry ───
  /** Register a new widget */
  registerWidget: <P>(definition: WidgetDefinition<P>) => void;
  /** Remove a widget from the registry */
  unregisterWidget: (widgetId: string) => void;
  /** Modify an existing widget's definition (non-destructive merge) */
  modifyWidget: (widgetId: string, patch: Partial<WidgetDefinition>) => void;
  /** Wrap an existing widget's component with a HOC */
  wrapWidget: (widgetId: string, wrapper: WidgetWrapper) => void;
  /** Extend a widget's configSchema with additional fields */
  extendConfig: (widgetId: string, fields: Record<string, ConfigField>) => void;

  // ─── Hooks Pipeline ───
  /** Register a hook that runs at a specific lifecycle point */
  addHook: <T extends HookName>(name: T, handler: HookHandler<T>) => void;
  /** Remove a previously registered hook */
  removeHook: <T extends HookName>(name: T, handler: HookHandler<T>) => void;

  // ─── Slot Injection ───
  /** Inject React content into named slots in the editor UI */
  injectSlot: (slotId: SlotId, component: React.ComponentType<SlotProps>) => void;

  // ─── Container Extensions ───
  /** Register a custom container type */
  registerContainerType: (type: string, renderer: ContainerRenderer) => void;
  /** Add settings fields to existing container types */
  extendContainerSettings: (type: ContainerType, fields: Record<string, ConfigField>) => void;

  // ─── Store Access ───
  /** Read-only access to layout store (Zustand) */
  getStore: () => Readonly<LayoutStore>;
  /** Subscribe to store changes */
  subscribe: <T>(selector: (state: LayoutStore) => T, callback: (value: T) => void) => () => void;
}
```

---

### Hook Pipeline

Hooks are the primary extension mechanism. They form a **pipeline** — each hook handler can inspect, modify, or short-circuit data flowing through the system.

```ts
type HookName =
  // Widget lifecycle
  | 'widget:beforeRender'      // Modify props before widget renders
  | 'widget:afterRender'       // Wrap rendered output (e.g. add analytics wrapper)
  | 'widget:beforeSave'        // Transform props before persisting
  | 'widget:afterSave'         // Side effects after save (analytics, sync, etc.)
  | 'widget:beforeAdd'         // Intercept widget addition (validation, defaults)
  | 'widget:afterAdd'          // Side effects after widget added
  | 'widget:beforeRemove'      // Confirmation, cleanup
  | 'widget:afterRemove'       // Side effects after removal
  // Container lifecycle
  | 'container:beforeRender'   // Modify container before rendering children
  | 'container:afterRender'    // Wrap container output
  | 'container:beforeSave'     // Transform container data before persist
  // Layout lifecycle
  | 'layout:beforeHydrate'     // Modify layout data during hydration
  | 'layout:afterHydrate'      // Side effects after hydration
  | 'layout:beforeSave'        // Final transform before full layout save
  | 'layout:afterSave'         // Side effects after save
  // Editor
  | 'editor:beforeDrop'        // Validate/modify drag-drop operations
  | 'editor:widgetPalette'     // Filter/reorder palette widget list
  | 'editor:contextMenu';      // Add items to right-click context menus

interface HookContext {
  pluginId: string;
  pageId: string;
  isEditMode: boolean;
  store: Readonly<LayoutStore>;
}

// Type-safe handler signatures per hook
type HookHandler<T extends HookName> =
  T extends 'widget:beforeRender'
    ? (props: Record<string, any>, widget: WidgetInstance, ctx: HookContext) => Record<string, any>
  : T extends 'widget:afterRender'
    ? (element: React.ReactElement, widget: WidgetInstance, ctx: HookContext) => React.ReactElement
  : T extends 'widget:beforeAdd'
    ? (widgetId: string, props: Record<string, any>, ctx: HookContext) => Record<string, any> | false
  : T extends 'editor:widgetPalette'
    ? (widgets: WidgetDefinition[], ctx: HookContext) => WidgetDefinition[]
  : T extends 'editor:contextMenu'
    ? (items: ContextMenuItem[], widget: WidgetInstance, ctx: HookContext) => ContextMenuItem[]
  : (data: any, ctx: HookContext) => any;
```

#### Hook Execution Order

Hooks run in **priority order** (higher first), then registration order within same priority:

```
Plugin A (priority: 10) → Plugin B (priority: 5) → Plugin C (priority: 0)
```

A hook handler can **short-circuit** by returning `false` (for `before*` hooks) or by not calling `next()` in an async pipeline.

---

### Widget Modification

Modify an existing widget without replacing it:

```ts
// Plugin: Add "analytics" toggle to every ImageWidget
const analyticsPlugin: WidgetPlugin = {
  id: 'polymech:analytics',
  name: 'Analytics Tracking',
  version: '1.0.0',

  setup(api) {
    // 1. Add a config field to ImageWidget
    api.extendConfig('image-widget', {
      trackClicks: {
        type: 'boolean',
        label: 'Track Clicks',
        default: false,
        group: 'Analytics',
      },
      trackingLabel: {
        type: 'text',
        label: 'Event Label',
        showWhen: { field: 'trackClicks', equals: true },
        group: 'Analytics',
      },
    });

    // 2. Wrap the widget to inject click tracking
    api.wrapWidget('image-widget', (WrappedComponent) => {
      return function TrackedImage(props) {
        const handleClick = () => {
          if (props.trackClicks) {
            analytics.track('image_click', { label: props.trackingLabel });
          }
        };
        return (
          <div onClick={handleClick}>
            <WrappedComponent {...props} />
          </div>
        );
      };
    });
  }
};
```

---

### Widget Injection

Register entirely new widgets:

```ts
const chartPlugin: WidgetPlugin = {
  id: 'acme:charts',
  name: 'Advanced Charts',
  version: '2.0.0',

  setup(api) {
    api.registerWidget({
      component: React.lazy(() => import('./AcmeBarChart')),
      metadata: {
        id: 'acme-bar-chart',
        name: 'Bar Chart (Acme)',
        category: 'chart',
        description: 'Interactive bar chart with drill-down',
        tags: ['chart', 'analytics', 'acme'],
        defaultProps: { dataSource: '', orientation: 'vertical' },
        configSchema: {
          dataSource: { type: 'text', label: 'Data Endpoint', required: true },
          orientation: { type: 'select', label: 'Orientation', options: [
            { value: 'vertical', label: 'Vertical' },
            { value: 'horizontal', label: 'Horizontal' },
          ]},
        },
      },
    });
  }
};
```

---

### Widget Extension (Inheritance)

Extend an existing widget to create a variant:

```ts
setup(api) {
  const baseImage = api.getStore()./* get widget def somehow */;

  // Create a "Hero Image" that extends ImageWidget with extra defaults
  api.registerWidget({
    component: React.lazy(() => import('./HeroImage')),
    metadata: {
      id: 'hero-image',
      name: 'Hero Image',
      category: 'display',
      description: 'Full-bleed hero image with overlay text',
      tags: ['hero', 'image', 'banner'],
      defaultProps: {
        width: '100%',
        height: '50vh',
        objectFit: 'cover',
        overlayText: '',
        overlayPosition: 'center',
      },
      configSchema: {
        // Inherit image fields + add overlay
        ...baseImageConfigSchema,
        overlayText: { type: 'markdown', label: 'Overlay Text', group: 'Overlay' },
        overlayPosition: { type: 'select', label: 'Position', group: 'Overlay', options: [
          { value: 'top-left', label: 'Top Left' },
          { value: 'center', label: 'Center' },
          { value: 'bottom-right', label: 'Bottom Right' },
        ]},
      },
    },
  });
}
```

---

### Slot Injection

Plugins can inject UI into predefined **slots** in the editor chrome:

```ts
type SlotId =
  | 'editor:toolbar:start'         // Left side of top toolbar
  | 'editor:toolbar:end'           // Right side of top toolbar
  | 'editor:sidebar:top'           // Above widget palette
  | 'editor:sidebar:bottom'        // Below widget palette
  | 'editor:panel:right:top'       // Top of right properties panel
  | 'editor:panel:right:bottom'    // Bottom of right properties panel
  | 'widget:toolbar'               // Per-widget toolbar (green bar)
  | 'container:toolbar'            // Per-container toolbar
  | 'container:empty'              // Shown inside empty containers
  | 'page:header'                  // Above page content
  | 'page:footer';                 // Below page content

interface SlotProps {
  pageId: string;
  isEditMode: boolean;
  selectedWidgetId?: string | null;
  selectedContainerId?: string | null;
}
```

Example: Inject a "Page Analytics" button into the toolbar:

```ts
setup(api) {
  api.injectSlot('editor:toolbar:end', ({ pageId }) => (
    <Button onClick={() => openAnalytics(pageId)} variant="ghost" size="sm">
      <BarChart3 className="h-4 w-4 mr-1" /> Analytics
    </Button>
  ));
}
```

---

### Container Plugins

Register custom container types:

```ts
setup(api) {
  // Register a "carousel-container" that renders children in a swiper
  api.registerContainerType('carousel-container', {
    renderer: CarouselContainerRenderer,
    editRenderer: CarouselContainerEditRenderer,
    icon: GalleryHorizontal,
    label: 'Carousel',
    defaultSettings: {
      autoplay: false,
      interval: 5000,
      showDots: true,
    },
    settingsSchema: {
      autoplay: { type: 'boolean', label: 'Autoplay' },
      interval: { type: 'number', label: 'Interval (ms)', showWhen: { field: 'autoplay', equals: true } },
      showDots: { type: 'boolean', label: 'Show Dots' },
    },
  });
}
```

---

### Permission Gating

Plugins can restrict widget availability based on user roles, page context, or feature flags:

```ts
setup(api) {
  // Filter palette based on user role
  api.addHook('editor:widgetPalette', (widgets, ctx) => {
    const user = ctx.store.user;
    return widgets.filter(w => {
      // Hide admin-only widgets from regular users
      if (w.metadata.tags?.includes('admin-only') && user?.role !== 'admin') return false;
      // Hide premium widgets from free-tier
      if (w.metadata.tags?.includes('premium') && !user?.isPremium) return false;
      return true;
    });
  });

  // Prevent dropping restricted widgets
  api.addHook('editor:beforeDrop', (dropData, ctx) => {
    if (isRestricted(dropData.widgetId, ctx.store.user)) {
      toast.error('Upgrade required');
      return false; // Short-circuit — block the drop
    }
    return dropData;
  });
}
```

---

### Plugin Lifecycle & Registration

```ts
// pluginManager.ts
class PluginManager {
  private plugins = new Map<string, WidgetPlugin>();
  private api: PluginAPI;

  constructor(registry: WidgetRegistry, store: LayoutStore) {
    this.api = createPluginAPI(registry, store);
  }

  async register(plugin: WidgetPlugin): Promise<void> {
    // Validate requirements
    if (plugin.requires?.some(dep => !this.plugins.has(dep))) {
      throw new Error(`Plugin ${plugin.id} missing deps: ${plugin.requires}`);
    }
    // Run setup
    await plugin.setup(this.api);
    this.plugins.set(plugin.id, plugin);
  }

  async unregister(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    plugin?.teardown?.();
    this.plugins.delete(pluginId);
  }

  getPlugins(): WidgetPlugin[] {
    return [...this.plugins.values()]
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }
}

// Bootstrap — app entry
const pluginManager = new PluginManager(widgetRegistry, layoutStore);

// Core widgets (always loaded)
await pluginManager.register(coreWidgetsPlugin);

// Optional plugins (lazy loaded, feature-flagged)
if (features.analytics) {
  const { analyticsPlugin } = await import('./plugins/analytics');
  await pluginManager.register(analyticsPlugin);
}

// User-installed plugins (dynamic import from config)
for (const pluginUrl of userPluginManifest) {
  const mod = await import(/* @vite-ignore */ pluginUrl);
  await pluginManager.register(mod.default);
}
```

---

### Plugin Isolation & Safety

| Concern | Strategy |
|---------|----------|
| **Performance** | Plugins that throw don't crash the editor — wrap `setup()` in try/catch |
| **Conflicts** | Two plugins modifying the same widget — resolved by priority order |
| **Memory** | `teardown()` must clean up subscriptions, timers, DOM listeners |
| **Security** | `PluginAPI` is a **capability-limited facade** — no direct store mutation |
| **Versioning** | `requires` field enables dependency resolution at registration time |
| **HMR** | `unregister` + `register` cycle on hot reload (Vite-compatible) |

---

### Current Registry → Plugin Bridge

The existing [widgetRegistry](../src/lib/widgetRegistry.ts) already supports `register()` with overwrite semantics (line 28-32). Wrapping the existing `registerWidgets()` call ([src/lib/registerWidgets.ts](../src/lib/registerWidgets.ts)) as a core plugin is a mechanical refactor:

```ts
// Before
import { registerAllWidgets } from '@/lib/registerWidgets';
registerAllWidgets();

// After
import { coreWidgetsPlugin } from '@/plugins/core-widgets';
await pluginManager.register(coreWidgetsPlugin);
```

---

## 14. Unified Node Model — Collapsing Widgets and Containers

### Why the distinction is problematic

The current system has **two separate type hierarchies**:

```
PageLayout
  └── Container (grid | flex-container)     ← structural
        ├── WidgetInstance (leaf)            ← content
        └── Container (nested, recursive)   ← structural again
              └── WidgetInstance ...
```

This works until a **widget needs to be a container** — TabsWidget, AccordionWidget, LayoutContainerWidget all manage sub-layouts internally. They're widgets pretending to be containers, which creates:

- The SYNC-BACK race condition ([nested-ex.md](./nested-ex.md))
- Separate code paths for adding widgets vs adding containers
- `addWidget()` + `addPageContainer()` + `removeWidget()` + `removePageContainer()` — doubled API surface
- Container rendering ([LayoutContainerEdit.tsx](../src/modules/layout/LayoutContainerEdit.tsx)) vs widget rendering — two renderers for one recursive tree
- Embedded `layoutData` in widget props — a layout-within-a-layout, invisible to the parent tree

### Current data shape (two types)

```ts
// Container — knows about grid/flex, owns widgets
interface LayoutContainer {
  id: string;
  type: 'container' | 'flex-container';
  columns: number;
  gap: number;
  widgets: WidgetInstance[];         // ← flat child array
  children: LayoutContainer[];      // ← recursive containers only
  settings?: ContainerSettings;
}

// Widget — leaf node, can't have children (officially)
interface WidgetInstance {
  id: string;
  widgetId: string;                 // registry key
  props?: Record<string, any>;     // may secretly contain layoutData!
}
```

### Proposed: Single Node type

Every element in the tree — containers, widgets, tab panes, rows — is just a `Node`:

```ts
interface Node {
  id: string;
  type: string;                    // 'flex' | 'grid' | 'image' | 'tabs' | 'tab-pane' | 'markdown'
  props: Record<string, any>;      // type-specific config
  children: Node[];                // ← replaces BOTH Container.widgets AND Container.children
  parentId: string | null;

  // Layout hints (replaces Container-specific fields)
  layout?: NodeLayout;

  // Constraints (from registry, not stored — computed at runtime)
  // constraints?: NodeConstraints;
}

interface NodeLayout {
  display: 'flex' | 'grid' | 'block' | 'none';
  columns?: number;
  gap?: number;
  rows?: RowDef[];
  direction?: 'row' | 'column';
  align?: 'stretch' | 'start' | 'center' | 'end';
}

interface NodeConstraints {
  canHaveChildren: boolean;
  allowedChildTypes?: string[];
  maxChildren?: number;
  draggable: boolean;
  deletable: boolean;
}
```

### What collapses

| Before (two-type) | After (unified) |
|----|-----|
| `LayoutContainer` + `FlexibleContainer` + `WidgetInstance` | `Node` |
| `Container.widgets[]` | `Node.children[]` |
| `Container.children[]` (recursive containers) | `Node.children[]` (same array) |
| TabsWidget with embedded `layoutData` per tab | TabsNode with `children: [TabPaneNode, ...]` |
| SYNC-BACK effect | Gone — children are part of the tree |
| `addWidget()` + `addPageContainer()` | `addChild(parentId, node)` |
| Container renderer + Widget renderer | One recursive renderer |
| `NestedLayoutManager` (§7) | Not needed — nested layouts don't exist |

### TabsWidget: Before vs After

**Before** — widget with embedded layouts, SYNC-BACK, hydration races:

```ts
{
  id: 'w1',
  widgetId: 'tabs-widget',
  props: {
    tabs: [
      { id: 'tab-1', label: 'About', layoutId: 'tab-layout-1',
        layoutData: { containers: [{ widgets: [...] }] } },  // layout-in-a-layout
      { id: 'tab-2', label: 'Contact', layoutId: 'tab-layout-2',
        layoutData: { containers: [{ widgets: [...] }] } },
    ]
  }
}
```

**After** — node with children, zero indirection:

```ts
{
  id: 'w1',
  type: 'tabs',
  props: { activeTab: 'tab-1', orientation: 'horizontal' },
  children: [
    {
      id: 'tp1', type: 'tab-pane',
      props: { label: 'About' },
      layout: { display: 'flex', direction: 'column', gap: 16 },
      children: [
        { id: 'n1', type: 'markdown', props: { content: '...' }, children: [] },
        { id: 'n2', type: 'image', props: { src: '...' }, children: [] },
      ]
    },
    {
      id: 'tp2', type: 'tab-pane',
      props: { label: 'Contact' },
      layout: { display: 'flex', direction: 'column', gap: 16 },
      children: [
        { id: 'n3', type: 'contact-form', props: {}, children: [] },
      ]
    },
  ]
}
```

No `layoutData`. No `loadedPages` for sub-layouts. No SYNC-BACK. The tree **is** the layout.

### FlexibleContainer + PhotoCards: Before vs After

A real-world page: a flex container with two rows — row 1 has a hero image spanning full width, row 2 has three PhotoCards in a 1fr 1fr 1fr grid.

**Before** — [FlexibleContainerRenderer.tsx](../src/modules/layout/FlexibleContainerRenderer.tsx) / [FlexContainerView.tsx](../src/modules/layout/FlexContainerView.tsx) with [PhotoCard.tsx](../src/components/PhotoCard.tsx):

```ts
// Page content stored in DB — container + widgetInstances, cells addressed by rowId:column
{
  containers: [{
    id: 'fc1',
    type: 'flex-container',
    gap: 16,
    rows: [
      { id: 'r1', columns: [{ width: 1, unit: 'fr' }], sizing: 'unconstrained' },
      { id: 'r2', columns: [{ width: 1, unit: 'fr' }, { width: 1, unit: 'fr' }, { width: 1, unit: 'fr' }], gap: 12 },
    ],
    widgets: [
      // Hero image — row 1, column 0
      { id: 'w1', widgetId: 'photo-card', rowId: 'r1', column: 0, order: 0,
        props: { pictureId: 'p100', image: '/pics/hero.jpg', title: 'Hero', variant: 'feed', imageFit: 'cover' } },
      // Three gallery cards — row 2, columns 0/1/2
      { id: 'w2', widgetId: 'photo-card', rowId: 'r2', column: 0, order: 0,
        props: { pictureId: 'p101', image: '/pics/a.jpg', title: 'Sunset', variant: 'grid' } },
      { id: 'w3', widgetId: 'photo-card', rowId: 'r2', column: 1, order: 0,
        props: { pictureId: 'p102', image: '/pics/b.jpg', title: 'Mountains', variant: 'grid' } },
      { id: 'w4', widgetId: 'photo-card', rowId: 'r2', column: 2, order: 0,
        props: { pictureId: 'p103', image: '/pics/c.jpg', title: 'Ocean', variant: 'grid' } },
    ],
    settings: { title: 'Gallery Section', showTitle: true },
  }]
}
```

The renderer ([FlexContainerView.tsx](../src/modules/layout/FlexContainerView.tsx) line 105–124) groups widgets into a `Map<"rowId:colIdx", WidgetInstance[]>`, then renders per row with `columnsToGridTemplate()`.

**After** — Unified Node tree:

```ts
{
  id: 'fc1',
  type: 'flex',
  props: { title: 'Gallery Section', showTitle: true },
  layout: { display: 'flex', direction: 'column', gap: 16 },
  children: [
    // Row 1 — hero
    {
      id: 'r1', type: 'flex-row',
      props: {},
      layout: { display: 'grid', columns: 1, gap: 16 },
      children: [
        { id: 'w1', type: 'photo-card', children: [],
          props: { pictureId: 'p100', image: '/pics/hero.jpg', title: 'Hero',
                   variant: 'feed', imageFit: 'cover' } },
      ]
    },
    // Row 2 — three cards
    {
      id: 'r2', type: 'flex-row',
      props: {},
      layout: { display: 'grid', columns: 3, gap: 12 },
      children: [
        { id: 'w2', type: 'photo-card', children: [],
          props: { pictureId: 'p101', image: '/pics/a.jpg', title: 'Sunset', variant: 'grid' } },
        { id: 'w3', type: 'photo-card', children: [],
          props: { pictureId: 'p102', image: '/pics/b.jpg', title: 'Mountains', variant: 'grid' } },
        { id: 'w4', type: 'photo-card', children: [],
          props: { pictureId: 'p103', image: '/pics/c.jpg', title: 'Ocean', variant: 'grid' } },
      ]
    },
  ]
}
```

Key differences:

| Aspect | Before | After |
|--------|--------|-------|
| Widget placement | `widget.rowId` + `widget.column` indices | Position = order in `parent.children[]` |
| Row definition | Separate `rows[]` array on container | `flex-row` nodes as children |
| Column spec | `row.columns[{width, unit}]` | `layout.columns` + `layout.gap` on the row node |
| Grouping logic | `widgetsByCell` Map computation (line 105–124) | None — children are already grouped by parent |
| Adding a card | `addWidget(pageId, 'fc1', 'photo-card', { rowId: 'r2', column: 1 })` | `addChild('r2', photoCardNode, 1)` |
| Moving between rows | Update `widget.rowId` + `widget.column` + re-index | `moveNode('w2', 'r1', 0)` |

The `flex-row` type renders as a CSS grid row:

```tsx
// flex-row component — trivial
function FlexRowRenderer({ layout, children }: { layout: NodeLayout; children: React.ReactNode }) {
  return (
    <div
      className="grid min-w-0 max-md:!grid-cols-1"
      style={{
        gridTemplateColumns: `repeat(${layout?.columns ?? 1}, 1fr)`,
        gap: `${layout?.gap ?? 16}px`,
      }}
    >
      {children}
    </div>
  );
}
```

The [PhotoCard](../src/components/PhotoCard.tsx) component itself doesn't change at all — it receives the same props either way. The only difference is **how it gets placed** in the tree.

### Registry: same interface, no type distinction

```ts
// "Container" types
widgetRegistry.register({
  metadata: { id: 'flex', category: 'layout', name: 'Flex Container', ... },
  component: FlexRenderer,
  constraints: { canHaveChildren: true, draggable: true },
});

// "Widget" types — same registry, same interface
widgetRegistry.register({
  metadata: { id: 'image', category: 'display', name: 'Image', ... },
  component: ImageWidget,
  constraints: { canHaveChildren: false, draggable: true },
});

// Nested container types
widgetRegistry.register({
  metadata: { id: 'tabs', category: 'layout', name: 'Tabs', ... },
  component: TabsWidget,
  constraints: { canHaveChildren: true, allowedChildTypes: ['tab-pane'] },
});

widgetRegistry.register({
  metadata: { id: 'tab-pane', category: 'layout', name: 'Tab Pane', ... },
  component: TabPaneRenderer,
  constraints: { canHaveChildren: true, draggable: false, deletable: false },
});
```

### Single recursive renderer

```tsx
function NodeRenderer({ node, depth = 0 }: { node: Node; depth?: number }) {
  const def = widgetRegistry.get(node.type);
  if (!def) return null;

  const Component = def.component;
  const canNest = def.constraints?.canHaveChildren;

  return (
    <Component {...node.props} nodeId={node.id} layout={node.layout}>
      {canNest && node.children.map(child => (
        <NodeRenderer key={child.id} node={child} depth={depth + 1} />
      ))}
    </Component>
  );
}
```

Replaces the current split between [LayoutContainerEdit.tsx](../src/modules/layout/LayoutContainerEdit.tsx) (~800 lines) and widget rendering.

### Store operations: unified

```ts
// Before: separate APIs
addWidget(pageId, containerId, widgetId, props);
addPageContainer(pageId, containerType);
removeWidget(pageId, containerId, widgetInstanceId);
removePageContainer(pageId, containerId);
moveWidget(pageId, widgetInstanceId, direction);

// After: one set of tree operations
addChild(parentId: string, node: Node, index?: number): void;
removeNode(nodeId: string): void;
moveNode(nodeId: string, newParentId: string, index?: number): void;
updateProps(nodeId: string, props: Partial<Record<string, any>>): void;
```

### PageLayout simplifies to

```ts
interface PageLayout {
  id: string;
  name: string;
  root: Node;                      // ← single root node, replaces containers[]
  version: string;
  createdAt: number;
  updatedAt: number;
}
```

### Migration path

| Step | Effort | What changes |
|------|--------|-------------|
| 1. Define `Node` type alongside existing types | Low | Types only, no runtime change |
| 2. Write `toNodeTree()` / `fromNodeTree()` converters | Medium | Convert at load/save boundary |
| 3. Build `NodeRenderer` (recursive) | Medium | Replaces container + widget rendering |
| 4. Migrate store operations to tree ops | Medium | `addChild` / `removeNode` / `moveNode` |
| 5. Migrate stored layouts (DB) | High | One-time script to flatten all pages |
| 6. Remove Container types, SYNC-BACK, NestedLayoutManager | Low | Delete code 🎉 |

### Who did this

| Project | Model | Notes |
|---------|-------|-------|
| [Gutenberg](https://github.com/WordPress/gutenberg) | Block → InnerBlocks | Flat blocks → recursive blocks. Same migration. |
| [Craft.js](https://github.com/prevwong/craft.js) | `Node` with `nodes` map | Flat node map + `linkedNodes` for nested canvases |
| [Puck](https://github.com/measuredco/puck) | `ComponentData` with `children` | Zones are named child slots in components |
| [tldraw](https://github.com/tldraw/tldraw) | `TLShape` with parent reference | Flat store, parent-child via `parentId` |
| [GrapesJS](https://github.com/GrapesJS/grapesjs) | `Component` with `components()` | Recursive component tree, no widget/container split |
| [Lexical](https://github.com/facebook/lexical) | `LexicalNode` with children | `ElementNode` can have children, `TextNode` can't |

---

## 15. Arbitrary React Components — The Four Levels

The unified Node model (§14) maps `node.type` → registry → React component.
If the registry can resolve to *any* component, the system becomes a generic React renderer.

### Level 1: Pre-registered (current)

Component is in the bundle, registered at boot:

```ts
widgetRegistry.register({
  metadata: { id: 'photo-card', name: 'Photo Card', category: 'display', ... },
  component: PhotoCard,
  constraints: { canHaveChildren: false, draggable: true },
});
```

Type-safe, tree-shakeable, fast. Only components known at build time.

### Level 2: Lazy-imported (code-split)

Component is in the bundle but loaded on first use:

```ts
widgetRegistry.register({
  metadata: { id: 'chart', name: 'Chart', category: 'data', ... },
  component: React.lazy(() => import('@/components/Chart')),
  constraints: { canHaveChildren: false },
});
```

Already used for [FlexContainerEdit](../src/modules/layout/FlexibleContainerRenderer.tsx) (line 8).

### Level 3: Plugin-registered (npm package, build-time)

A plugin brings its own components — installed via npm, part of the build:

```ts
// @polymech/maps-plugin
const mapsPlugin: WidgetPlugin = {
  id: 'maps',
  version: '1.0.0',
  setup(api) {
    api.registerWidget({
      metadata: { id: 'google-map', name: 'Google Map', icon: MapPin, category: 'embed' },
      component: React.lazy(() => import('./GoogleMapWidget')),
      constraints: { canHaveChildren: false },
    });
  }
};
```

Safe — code-reviewed, bundled, no runtime loading.

### Level 4: Remote components (runtime, any URL)

Load a React component from a URL at runtime — not in the bundle, not known at build time.

Node shape in the tree:

```ts
{
  id: 'rc1',
  type: '__remote',
  props: {
    url: 'https://cdn.example.com/widgets/weather@1.0.0/index.mjs',
    componentName: 'WeatherWidget',
    // Pass-through props:
    city: 'Berlin',
    units: 'metric',
  },
  children: []
}
```

The `__remote` meta-widget loads and renders the ESM module:

```tsx
function RemoteComponent({ url, componentName, ...passThrough }: {
  url: string;
  componentName?: string;
  [key: string]: any;
}) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    import(/* webpackIgnore: true */ url)
      .then(mod => {
        if (!cancelled) {
          const Comp = componentName ? mod[componentName] : mod.default;
          setComponent(() => Comp);
        }
      })
      .catch(err => !cancelled && setError(err));
    return () => { cancelled = true; };
  }, [url, componentName]);

  if (error) return <div className="text-destructive p-2 text-sm">Failed: {error.message}</div>;
  if (!Component) return <div className="animate-pulse p-4 bg-muted rounded" />;

  return (
    <ErrorBoundary fallback={<div className="p-2 text-destructive">Widget crashed</div>}>
      <Component {...passThrough} />
    </ErrorBoundary>
  );
}
```

Register once at boot:

```ts
widgetRegistry.register({
  metadata: { id: '__remote', name: 'Remote Component', category: 'advanced', icon: Globe },
  component: RemoteComponent,
  constraints: { canHaveChildren: false },
});
```

### Loading strategies comparison

| Approach | How | Shared deps | Isolation | Build coordination |
|----------|-----|-------------|-----------|-------------------|
| **Dynamic `import(url)`** | Native ESM, `webpackIgnore` | No — remote bundles own React | None (same origin) | None |
| **Module Federation** (Webpack 5 / Vite) | `remoteEntry.js` manifest | Yes — shared React, shared stores | Partial | Remote must build with matching config |
| **Import Maps** | `<script type="importmap">` + bare specifiers | Yes — browser resolves to shared CDN copy | None | CDN versioning only |
| **Sandboxed iframe** | `<iframe src={url} sandbox>` + `postMessage` | No | Full | None |

**Recommendation**: Start with dynamic `import()` (simplest). Upgrade to Module Federation when you need shared React instances across remotes.

### Security model

Remote components execute arbitrary JS in your page. Mitigations:

| Threat | Mitigation |
|--------|-----------|
| XSS / DOM manipulation | CSP `script-src` allowlist, SRI hashes on known URLs |
| Props leaking auth tokens | Whitelist passable props per component, never forward `user` / `token` |
| Crashing the host | `ErrorBoundary` wrapping every `RemoteComponent` |
| Infinite loops / CPU | `requestIdleCallback` loading, Web Worker for heavy init |
| Access to store/context | Remote components get **only** `passThrough` props — no store, no context |
| Malicious URLs | Admin-only permission to add `__remote` nodes (see below), URL allowlist in settings |

### Permission gating

```ts
// Only admins can add remote widgets
pluginManager.addHook('editor:widgetPalette', (widgets, { user }) => {
  if (!user.roles.includes('admin')) {
    return widgets.filter(w => w.metadata.id !== '__remote');
  }
  return widgets;
});

// Allowlist for remote URLs
pluginManager.addHook('widget:beforeRender', (node, ctx) => {
  if (node.type === '__remote') {
    const allowedHosts = ctx.settings.remoteWidgetAllowlist || [];
    const url = new URL(node.props.url);
    if (!allowedHosts.includes(url.host)) {
      return { ...node, props: { ...node.props, _blocked: true } };
    }
  }
  return node;
});
```

### What this enables

| Use case | How |
|----------|-----|
| **Widget marketplace** | Publish component as ESM → add URL to page |
| **User-built components** | "Paste your widget URL" in advanced settings |
| **A/B test variants** | Swap component URL without redeploying |
| **Micro-frontends** | Each team publishes widgets independently |
| **Dev preview** | Point URL at `http://localhost:3001/MyWidget.js` during development |
| **Third-party embeds** | Wrap any React lib (chart, form, map) as a widget without forking |

### Authoring a remote widget

A remote widget is just a standard ESM module that exports a React component:

```tsx
// weather-widget/src/index.tsx
import React, { useState, useEffect } from 'react';

export function WeatherWidget({ city, units = 'metric' }: {
  city: string;
  units?: 'metric' | 'imperial';
}) {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    fetch(`https://api.weather.example/${city}?units=${units}`)
      .then(r => r.json())
      .then(setWeather);
  }, [city, units]);

  if (!weather) return <div>Loading weather...</div>;

  return (
    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white">
      <h3 className="font-bold">{city}</h3>
      <p className="text-3xl">{weather.temp}°</p>
      <p className="text-sm opacity-80">{weather.condition}</p>
    </div>
  );
}

export default WeatherWidget;
```

Build with Vite as a library:

```ts
// weather-widget/vite.config.ts
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.tsx',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['react', 'react-dom'],  // Use host's React
    },
  },
});
```

Deploy `dist/index.mjs` to CDN. Done.

### Summary: The four levels

| Level | When | Safety | Flexibility |
|-------|------|--------|-------------|
| 1. Pre-registered | Core widgets, always available | ★★★★★ | ★★ |
| 2. Lazy-imported | Heavy widgets, load-on-demand | ★★★★★ | ★★★ |
| 3. Plugin-registered | npm ecosystem, opt-in features | ★★★★ | ★★★★ |
| 4. Remote (runtime) | Marketplace, user-built, micro-frontend | ★★ | ★★★★★ |

All four levels coexist — the registry doesn't care how a component was loaded. A Node with `type: 'photo-card'` and a Node with `type: '__remote'` render through the same recursive `NodeRenderer` (§14).

---

## References

### Libraries

| Library | What it is | Relevance |
|---------|-----------|-----------|
| [Zustand](https://github.com/pmndrs/zustand) | Minimal state management for React | Recommended store replacement |
| [Preact Signals](https://github.com/preactjs/signals) | Fine-grained reactive primitives | Alternative reactive model |
| [Signia](https://github.com/tldraw/signia) | Signals library from tldraw team | Canvas-optimized signals |
| [Immer](https://github.com/immerjs/immer) | Immutable state via mutable API | Simplifies nested layout mutations |
| [use-context-selector](https://github.com/dai-shi/use-context-selector) | Selector API for React Context | Zero-dep context optimization |
| [dnd-kit](https://github.com/clauderic/dnd-kit) | Drag-and-drop toolkit | Already used — store integration patterns |
| [Tapable](https://github.com/webpack/tapable) | Webpack's hook/plugin system | Pipeline-based hook architecture |
| [Hookable](https://github.com/unjs/hookable) | Lightweight async hook system (UnJS) | Simpler alternative to Tapable |

### Reference Projects (widget/layout builder architectures)

| Project | Architecture | What to study |
|---------|-------------|---------------|
| [tldraw](https://github.com/tldraw/tldraw) | Signals (Signia) + Zustand | Canvas state, shape lifecycle, nested shape trees |
| [Excalidraw](https://github.com/excalidraw/excalidraw) | Zustand + custom store | Element model, collaborative state, undo/redo |
| [React Flow](https://github.com/xyflow/xyflow) | Zustand store per instance | Node/edge registry, nested sub-flows, store slices |
| [Plate.js](https://github.com/udecode/plate) | Zustand + plugin stores | **Plugin architecture** — per-plugin state, createPlatePlugin() |
| [Gutenberg](https://github.com/WordPress/gutenberg) | Redux + registry pattern | **Block extensions** — InnerBlocks, block filters, slot fills |
| [Builder.io](https://github.com/BuilderIO/builder) | Zustand + Mitosis | Visual widget builder, config schema, drag-drop |
| [GrapesJS](https://github.com/GrapesJS/grapesjs) | Backbone → events | **Plugin system** — component types, trait system, editor hooks |
| [Craft.js](https://github.com/prevwong/craft.js) | Context + custom store | **Resolver pattern** — plugin components → node tree |
| [Puck](https://github.com/measuredco/puck) | React + custom state | **Component config** — external component registration, drop zones |
| [Lexical](https://github.com/facebook/lexical) | Command bus + context | **Plugin architecture** — registerCommand, node transforms |
| [Strapi](https://github.com/strapi/strapi) | Plugin registries | **Admin panel plugins** — registerField, injectSlot pattern |
| [Sanity.io](https://github.com/sanity-io/sanity) | Plugin chains | **Schema extensions** — definePlugin(), document actions |
| [Payload CMS](https://github.com/payloadcms/payload) | Config-driven plugins | **Field plugins** — hooks.beforeChange, access control |

### Articles & Patterns

| Title | Topic |
|-------|-------|
| [Zustand: Bear Necessities of State Management](https://tkdodo.eu/blog/working-with-zustand) | Zustand best practices by TkDodo |
| [Signals vs React State](https://preactjs.com/blog/introducing-signals/) | Official Preact comparison |
| [The Case for Signals in JavaScript](https://dev.to/ryansolid/a-hands-on-introduction-to-fine-grained-reactivity-3ndf) | Ryan Carniato (Solid.js creator) |
| [React Context Performance](https://blog.isquaredsoftware.com/2021/01/context-redux-differences/) | Mark Erikson on context vs external stores |
| [Building a Page Builder](https://www.builder.io/blog/build-your-own-visual-builder) | Builder.io's architecture decisions |
| [Designing Plugin Systems](https://css-tricks.com/designing-a-javascript-plugin-system/) | General plugin architecture patterns |
| [Gutenberg Block Filters](https://developer.wordpress.org/block-editor/reference-guides/filters/) | WordPress block extension API |
| [GrapesJS Plugin API](https://grapesjs.com/docs/modules/Plugins.html) | Visual editor plugin registration |
| [Lexical Plugin Architecture](https://lexical.dev/docs/concepts/plugins) | Command-based plugin system |
| [Plate.js Plugin Guide](https://platejs.org/docs/plugin) | createPlatePlugin() pattern |
