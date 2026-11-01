# Feature: FileBrowser (VFS)

## Product Description (Copy/Paste Ready)
> **Polymech Virtual File System (VFS)**
> Experience native-grade file management directly within your browser. The Polymech VFS FileBrowser is a blazing-fast, dual-pane explorer designed for modern CMS workflows. Drag, drop, and navigate through your assets with intuitive keyboard shortcuts and zero-latency loading. Unlike basic media libraries, it features a built-in rendering engine capable of instantly previewing everything from standard images and PDFs to raw markdown, spreadsheets, and complex engineering 3D models (STL/STEP/OBJ)—all without requiring intermediate downloads.

## Comparison vs. Other Web Filebrowsers

* **Traditional CMS Media Libraries (WordPress, Drupal):** Standard platforms heavily favor flat grids or tagged media blobs, restricting hierarchical folder organizations. The Polymech VFS acts like a true operating system file manager, enforcing strict tree hierarchies and directory paths, while still allowing grid-based thumbnail views.
* **Headless Asset Managers (Sanity, Strapi):** Often architected purely as metadata stores linking out to CDN URLs. The Polymech VFS operates on physical nested directories giving developers full UNIX-like path predictability. 
* **Out-of-the-Box Web Explorers (elFinder, FilePond):** Most third-party integrations require aging backend dependencies (PHP) or use heavy, unoptimized DOM techniques. The Polymech FileBrowser is built natively in modern React. It utilizes zero-repaint layout effects to lock keyboard focus seamlessly and ensures instant UI reaction speeds.
* **Specialized Previews (3D & Code):** Almost no native web filebrowsers offer immediate in-browser rendering for 3D engineering formats (`.stl`, `.stp`, `.obj`) or syntax-highlighted code files (`.tsx`, `.py`, etc.) without downloading them first. The Polymech VFS features a dynamic `FileViewerRegistry` that handles these specialized mesh and plaintext previews instantly.

---

The FileBrowser is a fully-featured, dual-pane virtual file system (VFS) client built into the Polymech platform. It provides native-like file exploration capabilities directly in the browser, featuring robust keyboard navigation, drag-and-resize panels, type-safe file discovery, and extensive previewing capabilities for a wide variety of file formats, including 3D models.

## Core Architecture

The FileBrowser operates on a Virtual File System structure, connecting to a backend VFS API that mounts specific folders or resources. It extensively leverages standard modern React patterns (Hooks, Contexts, Layout Effects) to build a zero-latency feel for the user.

### Main Component
- **[`./src/apps/filebrowser/FileBrowserPanel.tsx`](../src/apps/filebrowser/FileBrowserPanel.tsx)**
  The entry point component. It orchestrates layout via `ResizablePanelGroup` and houses the toolbar, dialog popups, and the dual-pane system (the explorer on the left, the preview pane on the right). Core logic is delegated to modular hooks listed below.

### State Hooks
The business logic of the browser is split into modular hooks located in `./src/modules/storage/hooks/`:

#### Foundation Hooks (Data & Primitives)
- **[`useVfsAdapter.ts`](../src/modules/storage/hooks/useVfsAdapter.ts)**
  Handles data fetching from the backend API. Abstracts away directory fetching, cache management, fallback README indexing, and recursive size queries (`includeSize`).
- **[`useSelection.ts`](../src/modules/storage/hooks/useSelection.ts)**
  Governs state for selected files, handles batch selection arrays, and calculates item counts.
- **[`useKeyboardNavigation.ts`](../src/modules/storage/hooks/useKeyboardNavigation.ts)**
  Intercepts standard keyboard inputs within the module to provide accessible navigation. Converts array/grid positional awareness to focus updates natively.
- **[`useFilePreview.ts`](../src/modules/storage/hooks/useFilePreview.ts)**
  Manages states and refs for opening files in overlays/lightboxes.

#### Orchestration Hooks (Compose the primitives)
- **[`useDefaultSelectionHandler.ts`](../src/modules/storage/hooks/useDefaultSelectionHandler.ts)**
  Auto-select engine that runs on directory load: selects `readme.md` when present, restores the parent directory item on "go up" (return-target pattern), and auto-opens `initialFile` from URL params.
- **[`useDefaultKeyboardHandler.ts`](../src/modules/storage/hooks/useDefaultKeyboardHandler.ts)**
  Global keyboard shortcut listener (`Ctrl+F` / `F3` for search), typeahead search buffer management (with auto-clear on directory change), focus management on view mode switches, and wires the lower-level `useKeyboardNavigation`.
- **[`useDefaultActions.ts`](../src/modules/storage/hooks/useDefaultActions.ts)**
  Centralizes all action callbacks: download (single/multi/dir-zip), lightbox navigation (prev/next), close-and-restore-focus patterns, double-click handling, and a unified relative link resolver (`resolveRelativeVfsLink`) that de-duplicates the previously separate readme-pane and file-viewer-pane link handlers.

---

## File Views

The left pane of the file browser provides three rendering modes for the fetched directory contents.

- **[`./src/apps/filebrowser/FileTree.tsx`](../src/apps/filebrowser/FileTree.tsx)**
  The Tree view mode provides an expanding folder hierarchy approach.
  *Note: Recursion and layout-level rendering effects explicitly override grid-snapping hooks to avoid redundant focus issues.*
- **[`./src/modules/storage/FileListView.tsx`](../src/modules/storage/FileListView.tsx)**
  A detailed, vertical list rendering standard OS-like columns (Icon, Name, Size, Date).
- **[`./src/modules/storage/FileGridView.tsx`](../src/modules/storage/FileGridView.tsx)**
  A resizable thumbnail rendering mode tailored for media directories.
- **[`./src/modules/storage/ThumbPreview.tsx`](../src/modules/storage/ThumbPreview.tsx)**
  Handles rendering fast thumbnail previews inline for media and models, mapping correctly scaled image requests to the backend.

---

## Preview Architecture (FileViewerRegistry)

One of the stand-out features of the FileBrowser is the ability to preview files directly within the UI or via an isolated popup overlay, without downloading them individually.
This routing is handled by:
- **[`./src/modules/storage/FileViewerRegistry.tsx`](../src/modules/storage/FileViewerRegistry.tsx)**

Depending on the `mime` category or file extension, the requested node is dynamically routed to the appropriate specialized viewer component under `./src/modules/storage/views/`:

1.  **`ImageLightbox`** ([`./src/components/ImageLightbox.tsx`](../src/components/ImageLightbox.tsx))
    Native integration for standard images via `ResponsiveImage`.
2.  **`PdfLightbox.tsx`**
    Built over `react-pdf`, handles rendering standard `.pdf` outputs.
3.  **`SpreadsheetLightbox.tsx`**
    Preview tables like `.csv` and `.xlsx`.
4.  **`LightboxIframe.tsx`**
    Renders pure `.html`/`.htm` safely inside an iframe.
5.  **`LightboxText.tsx`**
    Code and text preview utilizing `Prism.js` for on-the-fly markdown and syntax highlighting.
6.  **`ThreeDViewer.tsx`**
    A robust 3D model engine implementation previewing `.stl`, `.obj`, `.step` and other engineering-centric mesh types up to specific memory thresholds.

If a folder is selected instead of a file, the right-pane preview defaults to:
- A rendered `README.md` if one sits natively inside the directory.
- An internal mounted `FileBrowserPanel` in thumbnail mode strictly locked as a directory sub-preview (`autoFocus=false`).

---

## Keyboard Navigation & Focus Flow

The keyboard and tab-index systems were optimized extensively to act natively:
- Pressing `Arrow Keys` calculates grid-level math to jump up/down/left/right seamlessly.
- Pressing `Enter` commits to entering directories.
- Pressing `Backspace` triggers a "Return-to-Sender" effect (jumping out of folders automatically shifts focus onto the parent directory node precisely).
- `Ctrl + F` / `F3` triggers native file search scoped to the currently tracked tree context.
- Typeahead search buffer auto-clears on directory navigation preventing stale matches from locking navigation.
- Unmounting/mounting directories handles DOM manipulation strictly in `useLayoutEffect`, enforcing zero-repaint focus locking on tree and list container nodes.

---

## Backend VFS Service

The backend drives the file structure by translating standardized REST commands to the file-system operations safely.
- **[`./server/src/products/storage/api/vfs-routes.ts`](../server/src/products/storage/api/vfs-routes.ts)**
  Exposes the OpenAPI specifications and strict route mapping inputs for the File System.
- **[`./server/src/products/storage/api/vfs.ts`](../server/src/products/storage/api/vfs.ts)**
  Contains the `MountManager`, global route validations, rate-limited file-tree recursive walks (Search API), and ACL-governed path sandboxing logic.

---

## Future Improvements (TODOs)

- **I18n (Internationalization):** Abstract hardcoded strings into the globalization architecture via **[`../src/i18n.tsx`](../src/i18n.tsx)** to support multilingual FileBrowser deployments.
- **Keyboard Navigation:** Expand keyboard shortcuts for batch selection manipulation and add comprehensive focus trapping within isolated preview lightboxes.
- **Security (User Content):** Implement stricter Content Security Policies (CSP) within `LightboxIframe` and sanitization checks for user-uploaded HTML/SVG content to prevent stored XSS attacks.
- **Context API Abstraction:** Formalize a generic `ViewerControlContext` to clean up the prop-drilling required for passing preview state (like `LightboxNode`) down deeper into specialized viewers.

