# FileBrowserPanel Refactoring Plan

## 1. The Problem
`FileBrowserPanel.tsx` has grown to over 1300 lines. It currently handles:
- VFS state fetching (path, mount, nodes, search queries, filter resolution).
- Keyboard shortcuts and navigation logic (global arrow keys, F3 search overlay, focus trapping).
- Selection state (`selected`, `focusIdx`, multi-select logic).
- UI display parameters (viewMode, zoom state, dual/single layout sizes).
- A heavy rendering component tree (FileGridView, FileListView, FileTree, many modals, lightboxes, AILayout wizards).

## 2. Refactoring Goals
We need to decouple the *data logic* from the *UI logic*, separate the heavy sub-views, and share common capabilities across different view renderers (`list`, `grid`, `tree`).

Crucially, the file browser UI must become a generic "Shell". The `VFS` implementation should just be one **Adapter**. By extracting the generic `FileBrowserUI`, we can plug in other data adapters in the future (like `usePageAdapter` for `UserPage.tsx`), rendering arbitrary models (Pages, Posts, Contacts) with the exact same robust `Tree/List/Grid` explorer UI.

### 2.1 Extract Custom Hooks

We should split the huge block of `useState`/`useEffect` hooks into contextual hooks:

- **`useVfsAdapter(mount, path, glob, accessToken)`**
  Acts as the data provider. Translates VFS endpoints into standardized `INode` UI models. Handles fetching directories, caches, extracting `readme` data, resolving breadcrumbs.
  *(Future adapters like `usePageAdapter` would conform to this exact same hook interface but fetch from `/api/pages`)*
  - *Returns:* `nodes`, `sorted`, `loading`, `error`, `readmeContent`, `updatePath`, `updateMount`, `refresh()`.

- **`useSelection(sortedNodes, onSelect)`**
  Handles array of selected items, focus index, and logic to select single/multiple (`ctrlKey`/`shiftKey`) elements. We can share this directly with list, tree, and thumb renderers.
  - *Returns:* `selected`, `focusIdx`, `setFocusIdx`, `setSelected`, `handleItemClick`, `clearSelection`.

- **`useKeyboardNavigation(params)`**
  Abstracts away global keybinds (e.g. F3 for search), container arrow navigation, copy/paste, backspace (up folder), and enter (open). 
  - Takes dependency on `focusIdx` and `selected` from `useSelection()`. 

- **`useFilePreview(accessToken)`**
  Manages the state for open lightboxes (Image/Video, Docs, Iframe, Text) rather than having all state at the root of `FileBrowserPanel`.
  - *Returns:* `lightboxNode`, `setLightboxNode`, `previewComponent` (pre-rendered JSX based on what's active).

### 2.2 Break Out UI Sub-components

Currently, the rendered output mixes complex file-fetching logic with the actual modal HTML.

- **`FilePreviewContainer`** 
  Move all `Lightbox` instantiations (e.g., `ImageLightbox`, `SpreadsheetLightbox`, `ThreeDViewer`, `PdfLightbox`) into a single child component. Pass `selectedFile` or active view node to it.
- **`LayoutToolbarWrapper`**
  Simplify how `FileBrowserToolbar` is rendered, connecting it purely to an abstracted state object rather than 30 independent props pass-throughs.
- **`SearchDialog` & `FilterDialog` Management**
  Currently inline or tightly coupled; should be separated into a `DialogRenderer` wrapper or use a generic dialog context.

### 2.3 Universal Interface for Viewers
The `Tree`, `List`, and `Grid` renderers all replicate basic file display logic. By passing a shared Context or generic store (e.g., a `ViewerControlContext`), each one can trigger:
- `openFile(INode)`
- `goUp()`
- `selectFile(INode, multi)`
This standardizes the event-actions instead of passing 10+ props.

## 3. Recommended Actions & Phasing

- ~~**Phase 1: State Extraction**~~ 
  Extract `useSelection` and `useFilePreview` hooks from `FileBrowserPanel.tsx` without moving component rendering. Validate that deep link auto-open and search selections still function correctly.
- ~~**Phase 2: VFS Extraction**~~
  Extract `useVFSBrowser` so directory fetching and sorting logic becomes completely separated from React rendering constraints.
- **Phase 3: Component Cleanup**
  Move all `Lightbox...` conditionally rendered objects at the bottom of the file into a `<PreviewOverlayManager />` component layer.
- **Phase 4: Shared Navigation Interface**
  Connect `FileTree`, `FileListView`, `FileGridView` to the shared `useSelection`/`useKeyboardNavigation` events so behavior is strictly unified without duplicate `<div onKeyDown...` code.

## 4. Edge Cases to Preserve
1. **Deep Linking (`?file=`) / `initialFile` prop:** Needs to wait for async directory fetch completion before snapping focus and dispatching `onSelect`.
2. **Escape Key Handling:** `Tree` view requires focus on `listRef`, grids/views require focus on `containerRef`. F3 global event logic uses `[data-active-panel]`. Any refactor must strictly preserve this arbitration logic.
3. **Jail Prop Security:** When a container is "jailed" to a parent directory, `updatePath` must refuse to navigate up past the root `jailPath`.
4. **VFS Sorting:** Always display folders before files, then sort according to Name/Size/Date `(SortBy)`.
