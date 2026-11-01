# LayoutContainer-Ex: Rows with Adjustable Columns

## Investigation Summary

The goal is to support a **row-based layout** where each row can have independently adjustable column widths (e.g. 30/70, 50/50, 33/33/34). This document analyses the current architecture, identifies every surface that would need changes, and assesses a "build new + keep old" strategy.

---

## Current Architecture

### Data Model (`LayoutManager.ts`)

```typescript
interface LayoutContainer {
  id: string;
  type: 'container';
  columns: number;       // ← single integer, drives CSS grid-cols-N
  gap: number;           // ← pixel gap between cells
  widgets: WidgetInstance[];
  children: LayoutContainer[];
  order?: number;
  settings?: {
    collapsible?: boolean;
    collapsed?: boolean;
    title?: string;
    showTitle?: boolean;
    customClassName?: string;
    enabled?: boolean;
  };
}
```

**Key observations:**

| Aspect | Current behaviour |
|--------|-------------------|
| **Column model** | `columns: number` — equal-width columns only (1–12). Rendered via Tailwind `grid-cols-N` classes. |
| **Widget placement** | Widgets have an `order` index. The CSS grid auto-flows them left-to-right, top-to-bottom. There is no "widget belongs to column X" field. |
| **Column targeting** | `addWidgetToContainer()` accepts `targetColumn?: number` but only uses it to calculate an insertion _index_ — it is a positional hint derived from `index % columns`, not a persistent assignment. |
| **Row concept** | None. Rows are an implicit side-effect of CSS grid wrapping. |
| **Nesting** | Containers can nest up to 3 levels deep. Nested containers span `col-span-full`. |
| **Container children** | `children: LayoutContainer[]` — nested containers always appear _after_ all widgets. |

### Rendering (`LayoutContainer.tsx`)

The component builds grid classes via `getGridClasses(columns)` → `grid-cols-1 md:grid-cols-N`. All widgets and children are rendered inside one `<div className={gridClasses}>`. There is no per-row logic.

### Command System (`commands.ts`, `LayoutContext.tsx`)

15+ command classes (Add/Remove/Move Widget, Add/Remove/Move Container, Update Columns, Update Settings, etc.) all operate on the flat `widgets[]` array and the `containers[]` / `children[]` tree. All are undo/redo-capable via `HistoryManager`.

### Settings UI (`ContainerSettingsManager.tsx`)

Only supports: title, showTitle, collapsible, collapsed. No column-width controls.

---

## What "Rows with Adjustable Columns" Means

A new `RowLayoutContainer` (or equivalent) would treat layout as:

```
Container
  └─ Row 0:  [Col 40%] [Col 60%]        ← 2 columns, custom widths
  └─ Row 1:  [Col 33%] [Col 33%] [Col 34%]  ← 3 columns
  └─ Row 2:  [Col 100%]                 ← full width
```

Each row is an independent unit with its own column count and width distribution. Widgets are placed in a specific **row + column** cell, not just by order.

### Proposed Data Model

```typescript
interface RowDef {
  id: string;
  columnWidths: number[];   // e.g. [40, 60] or [1, 2, 1] (fr units)
  gap?: number;             // row-level gap override
}

interface RowLayoutContainer {
  id: string;
  type: 'row-layout';       // discriminator vs 'container'
  rows: RowDef[];
  widgets: WidgetInstance[]; // each widget needs row + column assignment
  gap: number;              // vertical gap between rows
  order?: number;
  settings?: { /* same as current + potential new fields */ };
}
```

Each `WidgetInstance` would need extended placement:

```typescript
interface WidgetInstance {
  id: string;
  widgetId: string;
  props?: Record<string, any>;
  order?: number;
  // NEW — only for row-layout containers:
  rowId?: string;
  column?: number;
}
```

---

## UI Manipulation: Rows & Columns

### Row Bar (edit mode only)

Each row gets a thin header bar (like the existing container header), visible only in edit mode:

```
┌─ Row 1 ──────────────────────── [+ Col] [Split] [↑] [↓] [×] ─┐
│  [  Widget A  ]  │  [  Widget B  ]  │  [  Widget C  ]         │
└───────────────────────────────────────────────────────────────-┘
┌─ Row 2 ──────────────────────── [+ Col] [Split] [↑] [↓] [×] ─┐
│  [       Widget D        ]  │  [    Widget E    ]              │
└───────────────────────────────────────────────────────────────-┘
                        [ + Add Row ]
```

**Row-level actions:**

| Button | Action |
|--------|--------|
| **+ Col** | Appends a new equal-width column to this row. E.g. `[1fr, 1fr]` → `[1fr, 1fr, 1fr]` |
| **Split** | Splits the last column into two. E.g. `[2fr, 1fr]` → `[2fr, 0.5fr, 0.5fr]` |
| **↑ / ↓** | Move row up / down within the container |
| **×** | Remove row (widgets in it get orphaned → prompt: delete widgets or move to adjacent row?) |
| **+ Add Row** | Appears below the last row. Creates a new single-column row at the bottom. |

### Adding / Removing Columns per Row

Columns exist per-row, not per-container. Each row stores its own `columnWidths: number[]`.

**Adding a column:**
- Click **+ Col** on the row bar → appends `1fr` to the row's `columnWidths`.
- Or right-click a column divider → "Insert column left / right".
- New column starts empty.

**Removing a column:**
- Right-click a column or its divider → "Remove column".
- If the column contains widgets: prompt to move them to the adjacent column (left preference) or delete them.
- If it's the last column: row becomes single-column, not removed.
- Removing the last column of the last row does NOT auto-remove the row (explicit delete required).

**Merging columns:**
- Select two adjacent columns (shift-click column headers?) → "Merge" action.
- Merges `columnWidths` entries by summing them: `[1fr, 2fr, 1fr]` → merge cols 1+2 → `[3fr, 1fr]`.
- Widgets from both columns are stacked vertically in the merged column in their original order.

### Column Width Adjustment

**Drag handles** between columns:

```
│  Col 1 (2fr)  ┃↔┃  Col 2 (1fr)  │  Col 3 (1fr)  │
                 ↑
           drag handle
```

- A vertical drag handle between each pair of adjacent columns.
- Dragging redistributes width between the two neighbors only (the rest stay fixed).
- Minimum column width: `0.5fr` or `50px` — prevents collapse to zero.
- The handle shows a subtle resize cursor on hover.
- During drag: live preview with a ghost overlay showing the new widths.
- On release: `columnWidths` array is updated, triggers `ResizeRowColumnsCommand` (undoable).

**Presets** (accessible from row bar dropdown or right-click):

| Preset | `columnWidths` |
|--------|---------------|
| Equal halves | `[1, 1]` |
| Equal thirds | `[1, 1, 1]` |
| Sidebar left | `[1, 3]` |
| Sidebar right | `[3, 1]` |
| Golden ratio | `[1.618, 1]` |
| Wide center | `[1, 2, 1]` |
| Custom... | Opens a text input for arbitrary `fr` values |

### Row Reordering

- **↑ / ↓ buttons** on the row bar for keyboard-friendly reordering.
- Potential: **drag-to-reorder** via a grip handle on the row bar's left edge (lower priority, buttons first).

---

## Sizing Modes

Each column cell can operate in one of two sizing modes. This controls the **height behaviour** of the cell and therefore the row.

### Constrained Mode (default)

```
columnWidths: [1, 2, 1]
sizing: 'constrained'    // or simply: no override
```

- The row's height is dictated by the **tallest cell** in the row (CSS grid default `align-items: stretch`).
- Each cell stretches to match the row height.
- Widgets inside a cell fill available space or scroll if they overflow.
- **Use case:** Traditional grid layouts, dashboards, side-by-side cards of equal height.

CSS implementation:
```css
.row {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;  /* from columnWidths */
  align-items: stretch;                  /* all cells same height */
}
```

### Unconstrained Mode (content-driven)

```
sizing: 'unconstrained'
```

- Each cell's height is determined by its own content (**intrinsic sizing**).
- Cells in the same row can have different heights — the row shrinks to fit.
- The row height equals the tallest cell, but shorter cells do **not** stretch (they align to top).
- **Use case:** Content blocks where one column has a short heading and the other has a long article — you don't want the short column to have a huge empty gap.

CSS implementation:
```css
.row {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  align-items: start;                    /* cells don't stretch */
}
```

### Per-Cell Override (stretch / start / center / end)

For finer control, each cell could also have its own vertical alignment:

| Value | Behaviour |
|-------|-----------|
| `stretch` | Cell fills row height (default in constrained mode) |
| `start` | Cell sticks to top, height = content |
| `center` | Cell vertically centered within row |
| `end` | Cell sticks to bottom |

This maps directly to CSS `align-self` on the grid cell.

### Width Sizing: `fr` vs Fixed

Column widths can mix `fr` (fractional) and fixed (px / rem) units:

```typescript
interface ColumnDef {
  width: number;
  unit: 'fr' | 'px' | 'rem' | '%';
}
```

| Scenario | `columnWidths` | CSS |
|----------|---------------|-----|
| All flexible | `[1fr, 2fr, 1fr]` | `grid-template-columns: 1fr 2fr 1fr` |
| Fixed sidebar | `[250px, 1fr]` | `grid-template-columns: 250px 1fr` |
| Mixed | `[200px, 1fr, 300px]` | `grid-template-columns: 200px 1fr 300px` |

Fixed columns **don't resize** on drag — the drag handle only redistributes the `fr`-based columns. Fixed columns can be resized via the settings panel or by double-clicking the drag handle to convert to `fr`.

### Mobile Responsive Collapse

All sizing modes collapse to `grid-template-columns: 1fr` on mobile (`< md` breakpoint), matching the existing container behaviour. Per-row mobile overrides (e.g. "keep 2 columns on tablet") are a possible future extension but not required for v1.

### Data Model Update for Sizing

```typescript
interface RowDef {
  id: string;
  columns: ColumnDef[];       // replaces simple columnWidths: number[]
  gap?: number;
  sizing?: 'constrained' | 'unconstrained';  // row-level default
  cellAlignments?: ('stretch' | 'start' | 'center' | 'end')[];  // per-cell override
}

interface ColumnDef {
  width: number;
  unit: 'fr' | 'px' | 'rem' | '%';
  minWidth?: number;           // collapse protection, in px
}
```

### Settings UI for Sizing

In the row settings (accessible from the row bar ⚙ or the ContainerSettingsManager):

- **Row sizing mode** toggle: Constrained / Unconstrained
- **Per-cell alignment** dropdown (only visible in unconstrained mode)
- **Column width type** per column: `fr` / `px` / `%` with numeric input
- **Column min-width** (optional, safety net)

---

## CSS Implementation: Grid vs Flexbox

### Why the Current Container Uses Tailwind Grid

The existing `LayoutContainer` builds classes like `grid grid-cols-1 md:grid-cols-3 gap-4`. This works because:

- **Equal-width columns only** → Tailwind's `grid-cols-N` maps directly to `grid-template-columns: repeat(N, minmax(0, 1fr))`.
- **Auto-flow** → Widgets land in the next available cell. No explicit row/column assignment needed.
- **Responsive** → `md:grid-cols-3` collapses to `grid-cols-1` on mobile for free.

But Tailwind grid classes **cannot** express arbitrary column widths like `1fr 2fr 1fr` or `250px 1fr`. There's no `grid-cols-[1fr_2fr_1fr]` utility without JIT arbitrary values, and even then it gets messy with responsive variants.

### Row-Layout: Inline `style` for Column Widths

For arbitrary column widths, we **must** use inline `style` on the row div. Tailwind remains useful for everything else (gap, alignment, responsive collapse, padding).

```tsx
// Row renderer — one per RowDef
const RowRenderer: React.FC<{ row: RowDef; children: React.ReactNode }> = ({ row, children }) => {
  // Build grid-template-columns from ColumnDef[]
  const gridTemplateColumns = row.columns
    .map(col => `${col.width}${col.unit}`)
    .join(' ');
  // e.g. "1fr 2fr 1fr" or "250px 1fr 300px"

  return (
    <div
      className={cn(
        "grid min-w-0",                                    // Tailwind: grid layout
        "gap-4",                                           // Tailwind: gap (or from row.gap)
        row.sizing === 'unconstrained'
          ? "items-start"                                  // Tailwind: align-items: start
          : "items-stretch",                               // Tailwind: align-items: stretch
        // Responsive: collapse to single column on mobile
        "max-md:!grid-cols-1"
      )}
      style={{
        gridTemplateColumns,                               // Inline: arbitrary widths
        gap: row.gap !== undefined ? `${row.gap}px` : undefined,
      }}
    >
      {children}
    </div>
  );
};
```

**Key pattern:** Tailwind for behaviour/layout mode + inline `style` for dynamic values that can't be known at build time.

### Where Tailwind Still Works

| Concern | Tailwind class | Notes |
|---------|---------------|-------|
| Grid mode | `grid` | Always grid, never flex for the row itself |
| Gap | `gap-2`, `gap-4`, etc | For fixed gap values; use inline `style.gap` for custom px |
| Alignment | `items-start`, `items-stretch`, `items-center`, `items-end` | Row-level vertical alignment |
| Per-cell align | `self-start`, `self-center`, `self-end`, `self-stretch` | On the cell wrapper div |
| Responsive collapse | `max-md:grid-cols-1` or `grid-cols-1 md:grid-cols-none` | Override inline columns on mobile |
| Min heights | `min-h-[80px]` | Empty cell placeholders in edit mode |
| Overflow | `min-w-0 overflow-hidden` | Prevent blowoff from wide content |
| Edit mode borders | `border-2 border-blue-500` | Selection highlighting |

### Where Tailwind Does NOT Work (Must Use Inline Style)

| Concern | Why | Solution |
|---------|-----|----------|
| `grid-template-columns` | Arbitrary `fr`/`px`/`%` combos unknown at build time | `style={{ gridTemplateColumns }}` |
| Row gap (custom px) | Dynamic per-row value | `style={{ gap: '${row.gap}px' }}` |
| Drag-resize preview | Changes every frame during drag | `style={{ gridTemplateColumns }}` updated via `useState` or ref |

### Why Flexbox is Worse for the Row Grid

Flexbox _could_ theoretically work for column layout, but it has hard disadvantages for this use case:

| Aspect | CSS Grid | Flexbox |
|--------|----------|---------|
| **Arbitrary column widths** | `grid-template-columns: 1fr 2fr 1fr` — one property | Must set `flex-basis` + `flex-grow` on each child. `flex: 2 1 0%` for 2fr. Fragile. |
| **Equal-height cells** | `align-items: stretch` works by default | Works too (`align-items: stretch`), but only for single-row flex. Multi-line flex (`flex-wrap`) breaks this. |
| **Cell alignment overrides** | `align-self: start` on cell | Works the same way ✓ |
| **Gap** | `gap: 16px` — native grid gap | `gap` works in modern browsers, but older flex shims needed `margin` hacks |
| **Mixed units** | `250px 1fr 300px` — trivial | Need calc: `flex: 0 0 250px` for fixed, `flex: 1 1 0%` for fr. No native mixing. |
| **Content overflow** | `minmax(0, 1fr)` prevents blowout | `min-width: 0` on each child, plus `flex-shrink` tuning |
| **Responsive collapse** | Override `grid-template-columns: 1fr` | Must flip `flex-direction: column` AND reset all flex-basis values |
| **Drag-resize** | Update one `style.gridTemplateColumns` string | Must update N child styles simultaneously |

**Verdict:** CSS Grid is clearly superior for the row-based approach. The only thing flex is better at is natural content-flow wrapping, which we don't want — we want explicit column control.

### Flexbox: Where It IS Useful

Flex is still the right tool **inside cells**, not for the row grid itself:

```tsx
// Cell wrapper — uses flex for vertical widget stacking within a cell
const CellRenderer: React.FC<{ alignment?: string; children: React.ReactNode }> = ({ alignment, children }) => (
  <div
    className={cn(
      "flex flex-col min-w-0 overflow-hidden",    // Flex column for vertical widget stack
      "gap-2",                                     // Gap between stacked widgets
      alignment === 'center' && "self-center",
      alignment === 'end' && "self-end",
      alignment === 'start' && "self-start",
      // Default: self-stretch (from parent grid's items-stretch)
    )}
  >
    {children}
  </div>
);
```

Each cell is a **flex column** that stacks multiple widgets vertically. The grid is only for the row itself.

### Full Row-Layout Renderer Skeleton

```tsx
const RowLayoutRenderer: React.FC<{ container: RowLayoutContainer; isEditMode: boolean }> = ({
  container,
  isEditMode,
}) => {
  return (
    <div className="space-y-0">
      {container.rows.map((row, rowIndex) => {
        // Build grid-template-columns
        const gtc = row.columns.map(c => `${c.width}${c.unit}`).join(' ');

        return (
          <div key={row.id}>
            {/* Row header bar (edit mode only) */}
            {isEditMode && (
              <RowHeaderBar row={row} rowIndex={rowIndex} />
            )}

            {/* Row grid */}
            <div
              className={cn(
                "grid min-w-0",
                row.sizing === 'unconstrained' ? "items-start" : "items-stretch",
                // Mobile: force single column
                "max-md:!grid-cols-1",
              )}
              style={{ gridTemplateColumns: gtc, gap: `${row.gap ?? container.gap}px` }}
            >
              {row.columns.map((col, colIndex) => {
                // Find widgets assigned to this row + column
                const cellWidgets = container.widgets
                  .filter(w => w.rowId === row.id && w.column === colIndex)
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

                const cellAlign = row.cellAlignments?.[colIndex];

                return (
                  <div
                    key={`${row.id}-${colIndex}`}
                    className={cn(
                      "flex flex-col min-w-0 overflow-hidden gap-2",
                      cellAlign === 'start' && "self-start",
                      cellAlign === 'center' && "self-center",
                      cellAlign === 'end' && "self-end",
                      // edit mode: empty cell placeholder
                      isEditMode && cellWidgets.length === 0 && "min-h-[80px] border border-dashed border-slate-300",
                    )}
                    style={{ minWidth: col.minWidth ? `${col.minWidth}px` : undefined }}
                  >
                    {cellWidgets.map(widget => (
                      <WidgetItem key={widget.id} widget={widget} /* ...props */ />
                    ))}
                  </div>
                );
              })}

              {/* Drag handles between columns (edit mode only) */}
              {isEditMode && row.columns.length > 1 && (
                <ColumnDragHandles row={row} onResize={handleColumnResize} />
              )}
            </div>
          </div>
        );
      })}

      {/* Add Row button */}
      {isEditMode && (
        <button className="w-full py-2 text-sm text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20">
          + Add Row
        </button>
      )}
    </div>
  );
};
```

### Drag Handle Implementation Notes

The column drag handles sit **on top of** the grid as absolutely positioned elements, not as grid children (they'd break the column count):

```tsx
const ColumnDragHandles: React.FC<{ row: RowDef; onResize: (rowId: string, colIndex: number, delta: number) => void }> = ({
  row, onResize
}) => {
  // Positioned absolutely over the row. One handle between each pair of columns.
  // Each handle is a thin vertical bar at the column boundary.

  return (
    <div className="absolute inset-0 pointer-events-none">
      {row.columns.slice(0, -1).map((_, i) => {
        // Calculate left offset: sum of column widths up to (i+1)
        // For fr units, convert to percentages based on total fr
        const totalFr = row.columns.reduce((sum, c) => sum + (c.unit === 'fr' ? c.width : 0), 0);
        const leftFr = row.columns.slice(0, i + 1).reduce((sum, c) => sum + (c.unit === 'fr' ? c.width : 0), 0);
        const leftPercent = (leftFr / totalFr) * 100;

        return (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-1 cursor-col-resize pointer-events-auto
                       hover:bg-blue-400 active:bg-blue-500 transition-colors z-10"
            style={{ left: `${leftPercent}%`, transform: 'translateX(-50%)' }}
            onMouseDown={(e) => handleDragStart(e, row.id, i)}
          />
        );
      })}
    </div>
  );
};
```

> [!NOTE]
> The `left` percentage calculation above is simplified for all-`fr` rows. Mixed `fr`/`px` rows need the browser's computed column positions via `getComputedStyle()` or `getBoundingClientRect()` on the cell elements.

### Responsive Collapse Pattern

```css
/* Row grid: arbitrary columns on desktop, single column on mobile */
.row-grid {
  display: grid;
  /* grid-template-columns set via inline style */
}

@media (max-width: 768px) {
  .row-grid {
    grid-template-columns: 1fr !important;  /* Override inline style */
  }
}
```

In Tailwind, this is `max-md:!grid-cols-1` (with `!` for `!important` to override inline styles). This is the **one place** where `!important` is justified — inline styles normally win specificity, but responsive collapse must override them.

---

## Email Rendering Compatibility

### How Email Rendering Currently Works

`pages-email.ts` renders page layouts to email HTML server-side. The pipeline:

1. **Load HTML templates** — `image_xl.html`, `image_col_2.html`, `image_col_3.html`, `section_text.html`, etc.
2. **Walk containers** — `renderContainer()` iterates widgets sorted by order.
3. **Group by columns** — If `container.columns === 2` or `3`, widgets are chunked and rendered via the matching column template. Everything else → single-column (`image_xl.html`).
4. **Inline CSS** — `juice` inlines all CSS for email client compatibility.

### Current Column Templates

The 2-column template (`image_col_2.html`):
```html
<table role="presentation" width="100%">
  <tr>
    <td>
      <!--[if mso]><table width="100%"><tr><td width="50%" valign="top"><![endif]-->
      <div class="image-col-item image-col-item-2">
        <!-- widget 0 content -->
      </div>
      <!--[if mso]></td><td width="50%" valign="top"><![endif]-->
      <div class="image-col-item image-col-item-2">
        <!-- widget 1 content -->
      </div>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
```

**Pattern:** Outer `<table>` wrapper → `<div>` elements with `inline-block` styling (via CSS) for modern clients + MSO conditional `<table>` for Outlook. Fixed `width="50%"` / `width="33%"` — **no arbitrary widths**.

### What Email Clients Support

| Feature | Gmail | Outlook (MSO) | Apple Mail | Yahoo |
|---------|-------|---------------|------------|-------|
| `<table>` layout | ✅ | ✅ | ✅ | ✅ |
| `display: inline-block` | ✅ | ❌ (needs MSO table) | ✅ | ✅ |
| `display: grid` | ❌ | ❌ | ❌ | ❌ |
| `display: flex` | ❌ | ❌ | Partial | ❌ |
| Arbitrary `width` on `<td>` | ✅ (%) | ✅ (%) | ✅ (%) | ✅ (%) |
| `fr` units | ❌ | ❌ | ❌ | ❌ |
| `px` widths on `<td>` | ✅ | ✅ | ✅ | ✅ |
| `max-width` media queries | ✅ | ❌ | ✅ | ✅ |
| `align-items`, `align-self` | ❌ | ❌ | ❌ | ❌ |

> [!CAUTION]
> **CSS Grid and Flexbox are NOT usable in email.** The row-layout's frontend CSS Grid rendering has zero overlap with email rendering. Email must use `<table>` layout exclusively.

### Strategy: Dynamic Table Generation for Row-Layouts

Instead of pre-built templates, row-layouts need **dynamically generated table HTML** on the server. The `fr` → `%` conversion is straightforward:

```typescript
// Convert ColumnDef[] to percentage widths for email tables
function columnsToPercentages(columns: ColumnDef[]): number[] {
  const totalFr = columns
    .filter(c => c.unit === 'fr')
    .reduce((sum, c) => sum + c.width, 0);

  // Fixed columns (px) get a fixed width, remaining space split by fr
  // For email simplicity: convert everything to percentages
  const total = columns.reduce((sum, c) => {
    if (c.unit === '%') return sum + c.width;
    if (c.unit === 'fr') return sum + (c.width / totalFr) * 100;
    // px: approximate against 600px email width
    return sum + (c.width / 600) * 100;
  }, 0);

  return columns.map(c => {
    if (c.unit === '%') return c.width;
    if (c.unit === 'fr') return (c.width / totalFr) * 100;
    return (c.width / 600) * 100;
  }).map(p => Math.round(p * 100) / 100); // round to 2dp
}
```

### Generating Row HTML

Each row becomes a `<table>` with `<td>` elements at computed percentages:

```typescript
function renderRowToEmailHtml(row: RowDef, cellContents: string[]): string {
  const widths = columnsToPercentages(row.columns);

  // MSO conditional table for Outlook
  const msoStart = `<!--[if mso]><table role="presentation" width="100%"><tr>` +
    widths.map((w, i) => `${i > 0 ? '' : ''}`).join('') +
    `<![endif]-->`;

  let html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td>`;
  html += `<!--[if mso]><table role="presentation" width="100%"><tr><![endif]-->`;

  widths.forEach((w, i) => {
    if (i > 0) {
      html += `<!--[if mso]></td><![endif]-->`;
    }
    html += `<!--[if mso]><td width="${w}%" valign="top"><![endif]-->`;
    html += `<div style="display:inline-block; vertical-align:top; width:100%; max-width:${w}%;">`;
    html += cellContents[i] || '';
    html += `</div>`;
  });

  html += `<!--[if mso]></td></tr></table><![endif]-->`;
  html += `</td></tr></table>`;
  return html;
}
```

### What Changes in `pages-email.ts`

The existing `renderContainer()` handles `type: 'container'`. A new `renderRowLayout()` function handles `type: 'row-layout'`:

```typescript
async function renderRowLayout(container: RowLayoutContainer) {
  let html = '';

  for (const row of container.rows) {
    // Get widgets for each cell
    const cellContents: string[] = [];

    for (let colIdx = 0; colIdx < row.columns.length; colIdx++) {
      const cellWidgets = container.widgets
        .filter(w => w.rowId === row.id && w.column === colIdx)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      let cellHtml = '';
      for (const widget of cellWidgets) {
        cellHtml += await renderWidget(widget);
      }
      cellContents.push(cellHtml);
    }

    html += renderRowToEmailHtml(row, cellContents);
  }

  return html;
}
```

Then in the main rendering loop:

```typescript
for (const container of sortedRootContainers) {
  if (container.type === 'row-layout') {
    contentHtml += await renderRowLayout(container);
  } else {
    contentHtml += await renderContainer(container);  // existing path
  }
}
```

### Sizing Mode Mapping in Email

| Frontend sizing | Email equivalent | Notes |
|----------------|-----------------|-------|
| **Constrained** (`items-stretch`) | `valign="top"` + equal row height | Email doesn't support equal-height columns natively. Closest: `valign="top"` (cells align to top, height varies). True equal-height requires background tricks or is simply accepted as a limitation. |
| **Unconstrained** (`items-start`) | `valign="top"` | Natural in email — cells are always content-height. |
| **Per-cell alignment** | `valign="top"` / `"middle"` / `"bottom"` | Maps directly to `<td valign>`. Works everywhere including MSO. |
| **`fr` widths** | Converted to `%` | `[1fr, 2fr, 1fr]` → `[25%, 50%, 25%]` |
| **`px` widths** | Converted to `%` against 600px | `250px` → `41.67%`. Or use fixed `width="250"` on `<td>` and let remaining cells flex. |
| **Mobile collapse** | `@media (max-width: 480px)` | Supported by Gmail, Apple Mail, Yahoo. NOT Outlook — Outlook always shows desktop layout. |

### Limitations & Tradeoffs

| Issue | Severity | Mitigation |
|-------|----------|-----------|
| **No equal-height columns** in email | Low | Most content renders fine with `valign="top"`. Background-color tricks exist but add complexity. |
| **Outlook ignores media queries** | Medium | Outlook always renders at desktop width. Acceptable — newsletter emails typically have a 600px fixed width anyway. |
| **Mixed `px`/`fr` approximation** | Low | Converting to `%` is imperfect but good enough for email. The 600px assumption is standard for email templates. |
| **Widget rendering fallback** | Low | Any widget not supported by `renderWidget()` already falls through silently. Row-layout just needs the column wrapper logic. |
| **New templates NOT needed** | Nice | Unlike the current approach with pre-built `image_col_2.html` / `image_col_3.html`, the dynamic table generator handles any column count. The pre-built templates can remain for the old `LayoutContainer` path. |

### Summary

✅ **Yes, row-layouts can be rendered to email.** The approach is:

1. Convert `ColumnDef[]` widths to `%` values
2. Generate `<table><tr><td width="X%">` dynamically per row
3. MSO conditional comments for Outlook compatibility
4. `valign` for vertical alignment
5. Reuse existing `renderWidget()` for cell content
6. ~80 lines of new code in `pages-email.ts`

---

## Impact Analysis

### 🟢 No-impact (if we keep old `LayoutContainer` as-is)

| Component | Reason |
|-----------|--------|
| All existing saved page data | Old pages use `type: 'container'`, unaffected |
| `LayoutContainerWidget.tsx` | Embeds `GenericCanvas`, which dispatches per container type |
| Existing undo/redo commands for old containers | Untouched |

### 🟡 Needs extension (dual support)

| Component | What changes |
|-----------|-------------|
| **`LayoutManager.ts`** | New `RowLayoutContainer` interface, new `type` discriminator. `UnifiedLayoutManager` needs: `addRowToContainer()`, `removeRow()`, `resizeRowColumns()`, `findContainerOrRowLayout()`. `addWidgetToContainer` needs a row-layout branch. |
| **`GenericCanvas.tsx`** | Must render `RowLayoutContainer` alongside `LayoutContainer`. Fork rendering by `container.type`. |
| **`PageLayout`** | `containers: (LayoutContainer \| RowLayoutContainer)[]` — union type. |
| **`commands.ts`** | New commands: `AddRowCommand`, `RemoveRowCommand`, `ResizeRowColumnsCommand`, `MoveWidgetToRowCellCommand`. Existing `MoveWidgetCommand` needs row-awareness. |
| **`LayoutContext.tsx`** | New context methods: `addRow`, `removeRow`, `resizeRowColumns`, `moveWidgetToCell`. Wire to new commands. |
| **Widget Palette / Add Widget flow** | Must know if targeting a row-layout and prompt for row + column. |
| **`ContainerSettingsManager.tsx`** | Row-layout variant needs row editor (add/remove rows, drag column dividers). |
| **`ContainerPropertyPanel.tsx`** | Show row structure for selected row-layout container. |

### 🔴 High-complexity areas

| Area | Complexity | Notes |
|------|-----------|-------|
| **Column width drag UI** | High | Need a drag-handle between columns per row, with live preview. Could use CSS `resize` or custom drag logic. |
| **Widget move across rows** | Medium | `MoveWidgetCommand` currently moves by `order ± 1`. In row-layout, moving down/up means crossing row boundaries, moving left/right means changing column. Completely different semantics. |
| **Export / Import** | Low-Medium | `exportPageLayout` / `importPageLayout` already serialise the full tree. A new `type` field will survive JSON round-trip, but import from old format needs migration. |
| **AI Layout Wizard** | Low | `BatchAddContainersCommand` generates `LayoutContainer[]`. Would need an equivalent for row-layouts or teach the AI about the new format. |
| **Clipboard (copy/paste)** | Medium | `SelectionContext` and clipboard logic need to handle the new type. |
| **SSR / Email / PDF rendering** | Medium | These use `iterateWidgets()` from `@polymech/shared`. That utility would need row-layout traversal support. |

---

## Strategy: Build New, Keep Old

**Recommended.** The cleanest path:

1. **Add discriminated union** on `type: 'container' | 'row-layout'` in the data model.
2. **Build `RowLayoutContainer.tsx`** as a new renderer alongside the existing one.
3. **Fork in `GenericCanvas.tsx`** based on container type.
4. **New commands** — keep all existing commands untouched.
5. **Add "Row Layout" to Widget Palette** as a new container type option.
6. **ContainerSettingsManager** gets a second mode for row-layout configuration.

### What we DON'T have to change (back-compat)

- Existing `LayoutContainer` type, rendering, and commands remain untouched.
- Existing page data (`type: 'container'`) loads and renders as before.
- Old `getGridClasses()` stays as-is.

### What we MUST build (new)

| # | Deliverable | Est. LoC |
|---|-------------|----------|
| 1 | `RowDef` / `RowLayoutContainer` types in `LayoutManager.ts` | ~30 |
| 2 | `RowLayoutContainer.tsx` — rendering component | ~300 |
| 3 | `GenericCanvas.tsx` — type fork for rendering | ~20 |
| 4 | Row-specific commands (Add/Remove/Resize Row, Move Widget to Cell) | ~300 |
| 5 | `LayoutContext.tsx` — new context methods + wiring | ~100 |
| 6 | Row editor UI (column width dragger per row) | ~250 |
| 7 | `ContainerSettingsManager` row-layout mode or separate component | ~150 |
| 8 | `iterateWidgets` update in `@polymech/shared` | ~20 |
| 9 | Widget Palette "Add Row Layout" option | ~20 |
| **Total** | | **~1200** |

---

## Alternative: Extend Current Container

Instead of a new type, we could add `columnWidths?: number[]` to existing `LayoutContainer` and make each row an implicit `LayoutContainer` child. Pros: less new code. Cons:

- Pollutes existing model with optional fields that only matter for row mode.
- Every existing command and renderer gains branches.
- Risk of subtle bugs in existing pages if `columnWidths` accidentally gets set.
- Harder to reason about; "container" means two very different things.

**Verdict:** Not recommended. The discriminated union approach is safer and cleaner.

---

## Open Questions

1. **Column width units** — pixels, percentages, or CSS `fr` units? `fr` is most flexible for responsive design (`grid-template-columns: 1fr 2fr 1fr`).
2. **Max rows per container?** — Unbounded or capped?
3. **Should rows be re-orderable?** — Drag-to-reorder rows, or just add/remove?
4. **Mobile collapse** — Do multi-column rows stack to 1-column on mobile (like current), or allow per-row mobile config?
5. **Can a row-layout contain nested containers?** — Probably yes (in a cell), but adds complexity.
6. **Migration path** — Should there be a "Convert container → row-layout" action?

---

## Conclusion

Building a new `RowLayoutContainer` alongside the existing `LayoutContainer` is the safest and cleanest approach. It avoids touching ~2000 lines of working container code + commands, while adding ~1200 lines of new purpose-built code. The main complexity is in the **column-width drag UI** and **widget movement semantics** across row/column cells. Everything else is mechanical wiring.
