# Drag-and-Drop Integration with dnd-kit

Proposal for adding drag-and-drop widget management to the page editor using `@dnd-kit/core` (6.3.1), `@dnd-kit/sortable` (10.0.0), and `@dnd-kit/utilities` (3.2.2) — all already installed.

---

## Current State

| Concern | Implementation | File |
|---------|---------------|------|
| Widget insertion | Click-to-add via `onToggleWidget` | `PageRibbonBar.tsx` |
| Widget reorder | `MoveWidgetCommand` (arrow D-pad) | `commands.ts`, `LayoutManager.ts` |
| Native file/URL drop | Window-level `drop` listener | `GlobalDragDrop.tsx` |
| Native drag state | `DragDropContext` (custom React context) | `contexts/DragDropContext.tsx` |

**Key detail:** The custom `DragDropContext` already has a `polymech/internal` discriminator — it skips drags with `types.includes('polymech/internal')`, so dnd-kit drags (which use `setData` with custom types) will **not** trigger the global file-drop overlay. No conflict.

---

## Proposed Architecture

```
┌─────────────────────────────────────────────────────────┐
│  DndContext (from @dnd-kit/core)                        │
│  └─ mounted in UserPageEdit.tsx (wraps canvas + ribbon) │
│     ├─ DragOverlay: ghost preview of dragged widget     │
│     ├─ Draggable sources:                               │
│     │   ├─ RibbonItemSmall (drag from ribbon)           │
│     │   └─ WidgetItem / FlexWidgetItem (drag to reorder)│
│     └─ Droppable targets:                               │
│         ├─ Container cells (LayoutContainer grid slots)  │
│         └─ Flex cells (row:column in FlexContainer)     │
└─────────────────────────────────────────────────────────┘
```

### Data Model

All draggables attach structured data via `useDraggable({ data })`:

```ts
// Dragging a new widget from the ribbon
{ type: 'new-widget', widgetId: 'photo-card' }

// Dragging an existing widget within/across containers
{ type: 'existing-widget', widgetInstanceId: 'widget-123', sourceContainerId: 'container-456' }
```

All droppables identify themselves via `useDroppable({ data })`:

```ts
// Regular container cell
{ type: 'container-cell', containerId: 'container-456', index: 3 }

// Flex container cell
{ type: 'flex-cell', containerId: 'container-789', rowId: 'row-abc', column: 1 }
```

---

## Implementation Plan

### Phase 1: DndContext Setup

#### `UserPageEdit.tsx` — Wrap editor in `DndContext`

```tsx
import { DndContext, DragOverlay, closestCenter, pointerWithin } from '@dnd-kit/core';

// Inside the component:
const [activeDrag, setActiveDrag] = useState<DragData | null>(null);

<DndContext
  collisionDetection={pointerWithin}
  onDragStart={({ active }) => setActiveDrag(active.data.current)}
  onDragEnd={handleDragEnd}
  onDragCancel={() => setActiveDrag(null)}
>
  <PageRibbonBar ... />
  <GenericCanvas ... />
  <DragOverlay>
    {activeDrag && <DragPreview data={activeDrag} />}
  </DragOverlay>
</DndContext>
```

`handleDragEnd` logic:

```ts
function handleDragEnd({ active, over }) {
  setActiveDrag(null);
  if (!over) return;

  const src = active.data.current;
  const dst = over.data.current;

  if (src.type === 'new-widget') {
    // Insert new widget at drop target
    if (dst.type === 'container-cell') {
      addWidgetToPage(pageId, dst.containerId, src.widgetId, dst.index);
    } else if (dst.type === 'flex-cell') {
      addWidgetToPage(pageId, dst.containerId, src.widgetId, dst.column, dst.rowId);
    }
  } else if (src.type === 'existing-widget') {
    // Move widget via command (for undo/redo)
    executeCommand(new MoveWidgetToTargetCommand(pageId, src.widgetInstanceId, dst));
  }
}
```

---

### Phase 2: Draggable Ribbon Items

#### `PageRibbonBar.tsx` — Make widget buttons draggable

Wrap `RibbonItemSmall` with `useDraggable`. Click still works (dnd-kit only initiates drag after movement threshold via `activationConstraint`).

```tsx
const DraggableRibbonItem = ({ widgetId, ...props }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `ribbon-${widgetId}`,
    data: { type: 'new-widget', widgetId },
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes}
         style={{ opacity: isDragging ? 0.5 : 1 }}>
      <RibbonItemSmall {...props} />
    </div>
  );
};
```

> [!TIP]
> Use `activationConstraint: { distance: 8 }` on the `PointerSensor` to prevent accidental drags from clicks.

---

### Phase 3: Droppable Container Cells

#### `LayoutContainer.tsx` — Grid cells as drop targets

Each column slot becomes a `useDroppable` target:

```tsx
const DroppableCell = ({ containerId, index, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${containerId}-${index}`,
    data: { type: 'container-cell', containerId, index },
  });

  return (
    <div ref={setNodeRef} className={cn(isOver && 'ring-2 ring-blue-400 bg-blue-50/20')}>
      {children}
    </div>
  );
};
```

#### `FlexibleContainerRenderer.tsx` — Flex cells as drop targets

Each `(rowId, column)` pair becomes a drop target:

```tsx
const DroppableFlexCell = ({ containerId, rowId, column, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `flex-${containerId}-${rowId}-${column}`,
    data: { type: 'flex-cell', containerId, rowId, column },
  });

  return (
    <div ref={setNodeRef} className={cn(isOver && 'ring-2 ring-purple-400 bg-purple-50/20')}>
      {children}
    </div>
  );
};
```

---

### Phase 4: Draggable Existing Widgets (Reordering)

#### `LayoutContainer.tsx` and `FlexibleContainerRenderer.tsx`

Use `useSortable` from `@dnd-kit/sortable` for intra-container reordering, with `useDraggable` for cross-container moves:

```tsx
const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
  id: widget.id,
  data: {
    type: 'existing-widget',
    widgetInstanceId: widget.id,
    sourceContainerId: container.id,
  },
});
```

---

### Phase 5: New Command for Targeted Moves

#### `commands.ts` — `MoveWidgetToTargetCommand`

A new command that moves a widget to a specific target location (container + position), supporting undo by capturing the original location:

```ts
export class MoveWidgetToTargetCommand implements Command {
  // Captures source (containerId, index/rowId/column) and target
  // execute(): removes from source, inserts at target
  // undo(): removes from target, re-inserts at source
}
```

---

## Coexistence with GlobalDragDrop

The custom `DragDropContext` checks `e.dataTransfer?.types.includes('polymech/internal')` and **skips** internal drags. dnd-kit uses pointer events, not native HTML5 drag events, so:

1. **No event collision** — dnd-kit pointer captures don't fire `dragenter`/`dragleave` on `window`
2. **Overlay suppression** — `GlobalDragDrop` only renders when `isDragging && !isLocalZoneActive`. During dnd-kit drags, `isDragging` stays `false` in the custom context
3. **Native file drops still work** — External file/URL drops bypass dnd-kit (which only tracks its registered draggables)

> [!IMPORTANT]
> No changes needed to `GlobalDragDrop.tsx` or `DragDropContext.tsx`. The two systems operate on completely separate event channels.

---

## Files to Modify

| File | Change |
|------|--------|
| `UserPageEdit.tsx` | Wrap in `DndContext`, add `DragOverlay`, `handleDragEnd` |
| `PageRibbonBar.tsx` | Wrap widget buttons with `useDraggable` |
| `LayoutContainer.tsx` | Add `useDroppable` to grid cells, `useSortable` to widgets |
| `FlexibleContainerRenderer.tsx` | Add `useDroppable` to flex cells, `useSortable` to widgets |
| `commands.ts` | Add `MoveWidgetToTargetCommand` |
| `LayoutManager.ts` | Add `moveWidgetToTarget()` static method |

### New Files

| File | Purpose |
|------|---------|
| `DragPreview.tsx` | `DragOverlay` content — shows widget name + icon while dragging |

---

## Phasing

| Phase | Scope | Effort |
|-------|-------|--------|
| 1 | DndContext setup + handler skeleton | Small |
| 2 | Draggable ribbon items (drag-to-add) | Small |
| 3 | Droppable container/flex cells | Medium |
| 4 | Draggable existing widgets (reorder + cross-container) | Medium |
| 5 | New command for cross-container targeted moves | Small |

Phases 1–3 deliver the most impactful feature (drag from ribbon to canvas). Phase 4–5 adds reordering, which is lower priority since the D-pad already covers this.
