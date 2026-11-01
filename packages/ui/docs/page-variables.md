# Page Variables

The Page Variables system allows you to toggle different UI elements of a User Page via settings defined in the page itself or its parent contexts. These variables are stored in a page's metadata under `userVariables`.

## Available System Variables

| Variable | Type | Default | Description |
|---|---|---|---|
| `showTitle` | `boolean` | `true` | Toggles the display of the main page title block. |
| `showAuthor` | `boolean` | `true` | Toggles the display of the author's name. |
| `showDate` | `boolean` | `true` | Toggles the display of the publish date. |
| `showCategories` | `boolean` | `true` | Toggles the display of the category paths. |
| `showActions` | `boolean` | `true` | Toggles the display of the top-right page actions menu. |
| `showParent` | `boolean` | `true` | Toggles the display of the parent page path above the title. |
| `showToc` | `boolean` | `true` | Toggles the display of the side table of contents and mobile TOC. |
| `showLastUpdated` | `boolean` | `true` | Toggles the display of the "Last updated" footer at the bottom of the page. |
| `showFooter` | `boolean` | `true` | Toggles the display of the global app footer site-wide. |

## Implementation References

Here is how the Page Variables system is structured and implemented across the codebase:

### 1. Variables Definition & Defaults
- [src/lib/page-variables.ts](../src/lib/page-variables.ts)
  Defines `globalVariables` which sets the default fallbacks (e.g. `showTitle: true`, `showFooter: true`). Also provides the utility `mergePageVariables()` which resolves variable inheritance from a page's parent paths (organizations/categories).

### 2. Editor & Schema
- [src/components/variables/VariablesEditor.tsx](../src/components/variables/VariablesEditor.tsx)
  The editor component that allows users to toggle these settings. It defines the `SYSTEM_VARIABLE_SCHEMA` mapping keys like `showToc` and `showLastUpdated` to human-readable labels and descriptions.

### 3. Usage in Page Rendering
- [src/modules/pages/UserPage.tsx](../src/modules/pages/UserPage.tsx)
  Retrieves the resolved `contextVariables` using `mergePageVariables()` and uses them to determine high-level layout elements.
  - Determines `showToc` and `hasTocContent` for toggling the Sidebar and Mobile Table of Contents.
  - Determines `showLastUpdated` for rendering the footer details.
  - Computes `showFooter` and passes it to the global Zustand AppStore to toggle the global application footer.
- [src/modules/pages/editor/UserPageDetails.tsx](../src/modules/pages/editor/UserPageDetails.tsx)
  Retrieves various variables (`showTitle`, `showAuthor`, `showDate`, `showCategories`, `showActions`, `showParent`) and conditionally renders those blocks. If all are false and the page is not in edit mode, it avoids rendering the details wrapper entirely via an early return block.

### 4. Global State (e.g., Global Footer)
- [src/store/appStore.ts](../src/store/appStore.ts)
  A simple Zustand store containing `showGlobalFooter` and `setShowGlobalFooter`. Used as a communication bridge.
- [src/App.tsx](../src/App.tsx)
  Reads `showGlobalFooter` from `useAppStore()` and decides whether to render the `<Footer />` component in the main application layout wrapper.
