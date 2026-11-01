# Nested Containers — Edit-Mode Architecture

How widgets that embed their own canvas (`TabsWidget`, `LayoutContainerWidget`) participate in the editor's data flow.

---

## Terminology

| Term | Description |
|---|---|
| **Parent page** | The main page being edited. Layout stored in `loadedPages` under `page-<uuid>`. |
| **Nested canvas** | A `GenericCanvas` rendered *inside* a widget, identified by a synthetic `pageId` (e.g., `tab-layout-1`, `nested-layout-xyz`). |
| **Widget props** | The JSON blob stored on the parent page's `WidgetInstance.props` — includes embedded `layoutData`. |
| **`loadedPages`** | In-memory `Map<string, PageLayout>` managed by `LayoutContext`. Holds layouts for both the parent page and every active nested canvas. |

---

## Data Flow Overview

```
┌──────────────────────────────────────────────────────────────────┐
│ UserPageEdit                                                     │
│   page-<uuid> in loadedPages                                    │
│     └─ containers[] → widgets[] → TabsWidget (widgetId: "w1")   │
│            props.tabs[0].layoutData  ← embedded PageLayout       │
│            props.tabs[0].layoutId    = "tab-layout-1"           │
└──────┬───────────────────────────────────────────────────────────┘
       │
       ▼  GenericCanvas receives initialLayout = tabs[0].layoutData
┌──────────────────────────────────────────────────────────────────┐
│ GenericCanvasEdit (pageId = "tab-layout-1")                      │
│   Hydration: loadedPages.set("tab-layout-1", initialLayout)     │
│   User edits → Commands against "tab-layout-1" in loadedPages   │
└──────┬───────────────────────────────────────────────────────────┘
       │
       ▼  Sync effect writes back
┌──────────────────────────────────────────────────────────────────┐
│ TabsWidget sync effect                                           │
│   Reads loadedPages.get("tab-layout-1")                         │
│   Calls onPropsChange({ tabs: [...updated layoutData...] })     │
└──────┬───────────────────────────────────────────────────────────┘
       │
       ▼  handlePropsChange in LayoutContainerEdit
┌──────────────────────────────────────────────────────────────────┐
│ updateWidgetProps(parentPageId, "w1", { tabs: [...] })           │
│   → UpdateWidgetSettingsCommand against parent page              │
│   → parent page layout in loadedPages updated                   │
│   → HistoryManager tracks command (undo/redo)                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 1. Hydration — Loading the Nested Layout

**File:** [`GenericCanvasEdit.tsx`](file:///c:/Users/zx/Desktop/polymech/pm-pics/src/modules/layout/GenericCanvasEdit.tsx#L72-L89)

When a nested widget mounts in edit mode, `GenericCanvasEdit` receives `initialLayout` (the embedded `layoutData` from the widget's props) and a synthetic `pageId`.

```ts
useEffect(() => {
    // First visit: copy prop into loadedPages
    if (initialLayout && !layout) {
        hydratePageLayout(pageId, initialLayout);
        return;
    }
    // Staleness check: re-hydrate if prop is newer
    if (initialLayout && layout
        && initialLayout.updatedAt > layout.updatedAt) {
        hydratePageLayout(pageId, initialLayout);
        return;
    }
    // Fallback: load from API (not used for embedded layouts)
    if (!layout) {
        loadPageLayout(pageId, pageName);
    }
}, [pageId, pageName, layout, loadPageLayout, hydratePageLayout, initialLayout]);
```

**Key points:**
- `hydratePageLayout` is a simple `setLoadedPages(prev => new Map(prev).set(pageId, layout))` — no API call.
- The staleness check (comparing `updatedAt`) ensures that if the parent page is reloaded or the prop changes externally, the cached layout is replaced.

---

## 2. Editing — Commands Against the Nested Layout

All editor operations (add widget, move, remove, update settings) go through `LayoutContext` functions like `addWidgetToPage`, `updateWidgetProps`, etc. Each creates a `Command` (see [`commands.ts`](file:///c:/Users/zx/Desktop/polymech/pm-pics/src/modules/layout/commands.ts)) and executes it via `HistoryManager`.

Commands operate on `loadedPages` by `pageId`. For a nested canvas, the `pageId` is the synthetic ID (e.g., `tab-layout-1`), so commands target the nested layout directly:

```ts
// Adding a widget to a tab canvas:
addWidgetToPage("tab-layout-1", containerId, widgetInstance)
// → AddWidgetCommand reads loadedPages.get("tab-layout-1")
// → Modifies it, calls context.updateLayout("tab-layout-1", newLayout)
```

**This is fully tracked by undo/redo** — `HistoryManager` stores the command in its `past` stack.

---

## 3. Sync-Back — Writing Nested Changes to Parent Props

The nested layout edits live in `loadedPages["tab-layout-1"]`, but the parent page's save function only persists `loadedPages["page-<uuid>"]`. So the nested data must be **synced back** as widget props on the parent.

### TabsWidget

**File:** [`TabsWidget.tsx`](file:///c:/Users/zx/Desktop/polymech/pm-pics/src/components/widgets/TabsWidget.tsx#L100-L122)

```ts
useEffect(() => {
    if (!isEditMode) return;
    let changed = false;
    const newTabs = tabs.map(t => {
        const layout = loadedPages.get(t.layoutId);
        if (layout) {
            const propTimestamp = t.layoutData?.updatedAt || 0;
            if (layout.updatedAt > propTimestamp) {
                const layoutChanged =
                    JSON.stringify(layout) !== JSON.stringify(t.layoutData);
                if (layoutChanged) {
                    changed = true;
                    return { ...t, layoutData: layout };
                }
            }
        }
        return t;
    });
    if (changed) {
        onPropsChange({ tabs: newTabs });
    }
}, [loadedPages, isEditMode, onPropsChange, tabs]);
```

**Important:** Iterates **all** tabs, not just the current one. This ensures that if you edit Tab A then switch to Tab B, Tab A's changes are still written back before save.

### LayoutContainerWidget

**File:** [`LayoutContainerWidget.tsx`](file:///c:/Users/zx/Desktop/polymech/pm-pics/src/components/widgets/LayoutContainerWidget.tsx#L56-L70)

Same pattern but simpler — only one nested layout:

```ts
useEffect(() => {
    if (uniqueNestedPageId && isEditMode) {
        const currentLayout = loadedPages.get(uniqueNestedPageId);
        if (currentLayout) {
            const propTimestamp = nestedLayoutData?.updatedAt || 0;
            if (currentLayout.updatedAt > propTimestamp) {
                const layoutChanged =
                    JSON.stringify(currentLayout) !== JSON.stringify(nestedLayoutData);
                if (layoutChanged) {
                    onPropsChange({ nestedLayoutData: currentLayout });
                }
            }
        }
    }
}, [uniqueNestedPageId, loadedPages, isEditMode, onPropsChange, nestedLayoutData]);
```

### onPropsChange → updateWidgetProps → Command

**File:** [`LayoutContainerEdit.tsx`](file:///c:/Users/zx/Desktop/polymech/pm-pics/src/modules/layout/LayoutContainerEdit.tsx#L621-L627)

When `onPropsChange` is called, it flows to:

```ts
const handlePropsChange = async (newProps) => {
    await updateWidgetProps(pageId, widget.id, newProps);
};
```

`updateWidgetProps` creates an [`UpdateWidgetSettingsCommand`](file:///c:/Users/zx/Desktop/polymech/pm-pics/src/modules/layout/commands.ts#L184-L261) against the **parent page's** `pageId`. This:
- Snapshots the old `widget.props` for undo
- Merges `newProps` into `widget.props`
- Updates `loadedPages[parentPageId]`
- Pushes to `HistoryManager.past` (undoable)

---

## 4. Saving — Persistence Path

**File:** [`usePageEditHandlers.ts`](file:///c:/Users/zx/Desktop/polymech/pm-pics/src/modules/pages/editor/hooks/usePageEditHandlers.ts#L187-L226)

```ts
const handleSave = async () => {
    loadedPages.forEach((layout, id) => {
        if (id.startsWith('page-')) {
            // Save as page content
            promises.push(updatePage(pId, { content: rootContent }));
        } else if (id.startsWith('layout-')) {
            // Save as standalone layout
            promises.push(updateLayout(layoutId, { layout_json: layout }));
        }
        // IDs like "tab-layout-1" or "nested-layout-xyz"
        // are INTENTIONALLY SKIPPED — their data lives inside
        // the parent page's widget props (already synced by step 3)
    });
};
```

**The nested layouts are NOT saved independently.** They are saved **embedded** within the parent page's widget props. This is correct because:

1. Sync effect (step 3) copies `loadedPages["tab-layout-1"]` → `widget.props.tabs[0].layoutData`
2. This updates `loadedPages["page-<uuid>"]` via `UpdateWidgetSettingsCommand`
3. `handleSave` writes `loadedPages["page-<uuid>"]` to the API
4. On reload, `widget.props.tabs[0].layoutData` is passed as `initialLayout`

---

## 5. Undo/Redo

All operations produce `Command` objects tracked by [`HistoryManager`](file:///c:/Users/zx/Desktop/polymech/pm-pics/src/modules/layout/HistoryManager.ts):

| Action | Command | Target `pageId` |
|---|---|---|
| Add widget to tab | `AddWidgetCommand` | `tab-layout-1` |
| Move widget in tab | `MoveWidgetCommand` | `tab-layout-1` |
| Sync tab data to parent | `UpdateWidgetSettingsCommand` | `page-<uuid>` |

**Undo** pops the last command from `past` and calls `command.undo(context)`. Because syncs also produce commands, undoing a sync restores the previous `tabs` array on the parent.

> **Note:** An undo of the sync command reverts the tab data at the *parent* level but doesn't automatically revert the *nested* layout in `loadedPages["tab-layout-1"]`. These are two separate entries. In practice, the user undoes the inner edit (which reverts the nested layout), and the next sync cycle propagates that reversion to the parent.

---

## 6. ID Conventions

| Prefix | Source | Saved by |
|---|---|---|
| `page-<uuid>` | Real page from database | `updatePage()` API |
| `layout-<uuid>` | Standalone reusable layout | `updateLayout()` API |
| `tab-layout-<N>` | TabsWidget tab | Embedded in parent page's widget props |
| `nested-layout-<widgetInstanceId>` | LayoutContainerWidget | Embedded in parent page's widget props |

---

## 7. Known Pitfalls

### Sync must cover all tabs
The sync effect must iterate **all** tabs, not just the active tab. Otherwise, switching tabs before saving drops the inactive tab's edits. (Fixed March 2026.)

### Re-hydration staleness
When `GenericCanvasEdit` detects that `initialLayout.updatedAt > layout.updatedAt`, it re-hydrates from the prop. Without this check, a reloaded page (with updated server data) would render stale cached data from a previous session.

### JSON.stringify comparison cost
Both `TabsWidget` and `LayoutContainerWidget` use `JSON.stringify` comparison as a safety check before calling `onPropsChange`. For very large layouts this could be slow — but it prevents infinite re-render loops where the timestamp guard alone isn't sufficient (e.g., when timestamps match but content differs due to manual edits).

### Nested nesting
`TabsWidget` and `LayoutContainerWidget` can be nested inside each other. Each level adds another entry to `loadedPages` and another sync effect. The same sync/hydration pattern applies recursively — each widget syncs its own nested layout back to its parent's props.
