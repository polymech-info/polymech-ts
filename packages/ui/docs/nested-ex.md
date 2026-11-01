# Nested Layout Execution — Race Conditions & Solutions

## Problem

Widgets stored inside nested layouts (e.g. `TabsWidget` tabs) are not displayed in edit mode, despite working in view mode. The root cause is a **race condition** between layout hydration and the SYNC-BACK effect.

## Architecture Overview

```
UserPage → LayoutProvider (single instance)
  └── GenericCanvas (main page)
        └── GenericCanvasEdit
              └── LayoutContainerEdit
                    └── TabsWidget (widget with nested layouts)
                          └── GenericCanvas (per-tab sub-layout)
                                └── GenericCanvasEdit (child)
```

### Key files

| File | Role |
|------|------|
| [LayoutContext.tsx](../src/modules/layout/LayoutContext.tsx) | Shared `loadedPages` state, `hydratePageLayout`, `loadPageLayout` |
| [GenericCanvas.tsx](../src/modules/layout/GenericCanvas.tsx) | Suspense wrapper — lazy-loads Edit, falls back to View |
| [GenericCanvasEdit.tsx](../src/modules/layout/GenericCanvasEdit.tsx) | Edit mode canvas — hydration useEffect (lines 73-100) |
| [GenericCanvasView.tsx](../src/modules/layout/GenericCanvasView.tsx) | View mode canvas — also hydrates from `initialLayout` |
| [TabsWidget.tsx](../src/components/widgets/TabsWidget.tsx) | Nested layout host — SYNC-BACK effect (lines 100-139) |
| [LayoutManager.ts](../src/modules/layout/LayoutManager.ts) | `getPageLayout` — creates empty defaults, `loadRootData` prefix matching |
| [LayoutContainerEdit.tsx](../src/modules/layout/LayoutContainerEdit.tsx) | Renders widgets with `{...widget.props}` spread (line 776) |

## Race Condition Sequence

```
1. Main page hydrates → TabsWidget mounts with stored `tabs[].layoutData`
2. TabsWidget renders <GenericCanvas initialLayout={tab.layoutData}> per tab
3. GenericCanvasEdit mounts — layout=undefined, initialLayout=stored data
4. BEFORE useEffect hydration runs:
   ├── Suspense fallback (GenericCanvasView) may call loadPageLayout()
   │   └── loadRootData("tab-layout-1") → prefix mismatch → empty default
   └── OR GenericCanvasEdit itself calls loadPageLayout() on wrong branch
5. Empty layout enters loadedPages with fresh Date.now() timestamp
6. SYNC-BACK fires → empty layout is "newer" → overwrites stored layoutData
7. Stored widgets are permanently lost for this session
```

### Prefix mismatch detail

[LayoutManager.ts](../src/modules/layout/LayoutManager.ts) `loadRootData` (line 153-154):

```ts
const isPage = pageId.startsWith('page-');
const isLayout = pageId.startsWith('layout-') || pageId.startsWith('tabs-');
```

`tab-layout-*` starts with `tab-` (not `tabs-`), so neither branch matches → returns empty default.

## Current Fix (band-aid)

[TabsWidget.tsx](../src/components/widgets/TabsWidget.tsx) lines 108-116:

SYNC-BACK compares live vs stored widget counts. If live=0 and stored>0, skips the sync and re-hydrates from stored data. This is a **heuristic** guard — it doesn't generalize to all edge cases (e.g. legitimately empty nested layouts that later get widgets added).

## Proposed Solutions

### Solution 1: `hydratedIds` set in LayoutContext ⭐ recommended

Track which layout IDs have been authoritatively populated vs created as empty defaults.

**In [LayoutContext.tsx](../src/modules/layout/LayoutContext.tsx):**

```ts
// Mutable set — no reactivity needed, checked synchronously during SYNC-BACK
const [hydratedIds] = useState(() => new Set<string>());

const hydratePageLayout = useCallback((pageId: string, layout: PageLayout) => {
  hydratedIds.add(pageId);  // mark as authoritatively hydrated
  setLoadedPages(prev => new Map(prev).set(pageId, layout));
  setIsLoading(false);
}, []);
```

Expose `hydratedIds` (or an `isHydrated(id)` helper) via context.

**In [TabsWidget.tsx](../src/components/widgets/TabsWidget.tsx) (and any future nested layout widget):**

```ts
const layout = loadedPages.get(t.layoutId);
if (layout && !isHydrated(t.layoutId) && t.layoutData) {
  // Not yet authoritatively populated — skip SYNC-BACK
  return t;
}
```

**State machine per layout ID:**

```
UNKNOWN ──► HYDRATING ──► READY
   │                        ▲
   └── (no initialLayout) ──┘  (loadPageLayout = also READY)
```

**Edge cases handled:**

| Case | `initialLayout` | `hydratedIds` | SYNC-BACK |
|------|-----------------|---------------|-----------|
| Stored tab with widgets | ✅ present | set on hydrate | trusts after hydrate |
| New empty tab (user just created) | ❌ undefined | set on loadPageLayout | trusts empty layout ✅ |
| Tab inside tab (deep nesting) | ✅ per level | each level independent | each SYNC-BACK checks own children |
| Implicit container auto-creation | n/a (mutation) | doesn't change flag | no effect on SYNC-BACK |

---

### Solution 2: Gate `loadPageLayout` when `initialLayout` exists

**In [GenericCanvasEdit.tsx](../src/modules/layout/GenericCanvasEdit.tsx) line 96-99:**

```diff
-if (!layout) {
+if (!layout && !initialLayout) {
     loadPageLayout(pageId, pageName);
 }
```

**Same change in [GenericCanvasView.tsx](../src/modules/layout/GenericCanvasView.tsx) line 38-40.**

This prevents the empty default from ever being created when `initialLayout` is provided. The canvas will stay in loading state until the hydration effect runs (next tick).

**Pros:** 2-line fix, eliminates the root cause.
**Cons:** Doesn't protect against future patterns where a nested layout might lose its `initialLayout` prop during React reconciliation.

---

### Solution 3: Fix the prefix mismatch

**In [LayoutManager.ts](../src/modules/layout/LayoutManager.ts) line 154:**

```diff
-const isLayout = pageId.startsWith('layout-') || pageId.startsWith('tabs-');
+const isLayout = pageId.startsWith('layout-') || pageId.startsWith('tabs-') || pageId.startsWith('tab-');
```

**Pros:** 1-line fix, prevents DB miss for tab sub-layouts.
**Cons:** Only addresses one symptom — any nested layout with an unrecognized prefix would still hit the same problem.

---

## Recommended Approach

Apply **all three** in order of priority:

1. **Solution 2** (gate `loadPageLayout`) — eliminates the source of empty layouts, 2 lines
2. **Solution 1** (`hydratedIds`) — semantic guard for SYNC-BACK, generalizes to any nesting depth
3. **Solution 3** (prefix fix) — defense in depth, prevents DB misses

Then **remove** the current widget-counting heuristic from TabsWidget, since `hydratedIds` makes it redundant.
