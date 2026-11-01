# Flexible Container — Implementation Todos

## Phase 1: Data Model & Types
- [x] Add `ColumnDef`, `RowDef`, `FlexibleContainer` types to `LayoutManager.ts`
- [x] Add Zod schemas to `schemas.ts` (`ColumnDefSchema`, `RowDefSchema`, `FlexibleContainerSchema`, `AnyContainerSchema`)
- [x] Update `PageLayout.containers` to `AnyContainer[]` union type
- [x] Add `rowId`, `column` fields to `WidgetInstance` for cell placement
- [x] Add type guards (`isLayoutContainer`, `isFlexibleContainer`, `getLayoutContainers`)
- [x] Add `findLayoutContainer()`, `findFlexContainer()` narrowing helpers
- [x] Add `generateRowId()`, `addFlexibleContainer()` methods
- [x] Fix all internal closures in `LayoutManager.ts` to handle `AnyContainer[]`

## Phase 2: Renderer Component
- [x] Create `FlexibleContainerRenderer.tsx` — CSS Grid row-based renderer
- [x] Integrate type-based dispatch in `GenericCanvas.tsx`
- [x] Fix all downstream type errors (`UserPageEdit.tsx`, `GenericCanvas.tsx`)

## Phase 3: UI Integration & Add Button
- [x] Quick-add buttons in `GenericCanvas.tsx` empty state
- [x] `AddFlexContainerCommand` in `commands.ts` (with undo)
- [x] `addFlexPageContainer` method in `LayoutContext.tsx`
- [x] `handleAddFlexContainer` handler in `UserPageEdit.tsx`
- [x] CommandPicker palette entry (Ctrl+K → "Add Flexible Container")
- [x] Ribbon bar "Flex Container" button (purple icon, `Columns`)
- [x] Update `commands.ts` helpers for `AnyContainer[]` support

## Phase 4: Row/Column Commands
- [x] `FlexAddRowCommand` — adds row with 2 equal columns
- [x] `FlexRemoveRowCommand` — removes row (with state capture for undo)
- [x] `FlexAddColumnCommand` — adds 1fr column to row
- [x] `FlexRemoveColumnCommand` — removes column by index (with state capture)
- [x] Wire commands to `FlexibleContainerRenderer` UI buttons via `executeCommand`

## Phase 5: Edit-Mode UI Polish
- [ ] Column drag handles for width adjustment
- [ ] Column width presets dropdown
- [ ] Row reordering (move up/down)

## Phase 6: Email Rendering
- [ ] Add `renderFlexibleContainer()` to `pages-email.ts`
- [ ] `columnsToPercentages()` utility
- [ ] Dynamic `<table>` generation with MSO conditionals

## Phase 7: Iteration & Polish
- [ ] Settings panel for row sizing mode (constrained/unconstrained)
- [ ] Per-cell alignment overrides
- [ ] Mobile responsive collapse
- [ ] PDF rendering support
