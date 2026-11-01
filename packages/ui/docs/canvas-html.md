# Canvas & HTML Export Architecture

This document outlines the architecture of the **Playground Canvas**, its dependency on the **Unified Layout Manager**, and the **HTML Email Export** workflow.

## 1. Core Architecture: Unified Layout Manager

**Source:** [src/lib/unifiedLayoutManager.ts](../src/lib/unifiedLayoutManager.ts)

The `UnifiedLayoutManager` is the brain of the layout system. It handles the data model and all state mutations.

### Data Model

- **`PageLayout`**: The root object representing a page. Contains a list of `LayoutContainer`s.
- **`LayoutContainer`**: A recursive structure that can contain `WidgetInstance`s or child `LayoutContainer`s. It defines the grid system (`columns`, `gap`).
- **`WidgetInstance`**: A reference to a registered widget (`widgetId`), containing specific properties (`props`) and order.

### Responsibilities

- **CRUD Operations**: `addWidgetToContainer`, `removeWidget`, `updateWidgetProps`.
- **Grid Management**: Logic for `moveWidgetInContainer` (directional swapping) and `updateContainerColumns`.
- **Persistence**: Handles saving/loading from storage/API and import/export to JSON.

## 2. Rendering: Generic Canvas

**Source:** [src/components/hmi/GenericCanvas.tsx](../src/components/hmi/GenericCanvas.tsx)

The `GenericCanvas` is the React presentation layer that consumes the layout data.

- **Recursive Rendering**: It iterates through the `PageLayout` and renders `LayoutContainer` components.
- **Context Usage**: Consumes `useLayout` hook to interact with `UnifiedLayoutManager` without direct coupling.
- **Modes**:
  - **Edit Mode**: Renders controls for adding containers, widgets, and drag-and-drop handles.
  - **View Mode**: Renders only the final content.
- **Auto-Logging (Hook)**: [src/pages/PlaygroundCanvas.tsx](../src/pages/PlaygroundCanvas.tsx) uses `usePlaygroundLogic` to automatically log the current layout state to the WebSocket server whenever it changes.

## 3. Custom Widgets (Email Bundle)

**Location:** [public/widgets/email/](../public/widgets/email/)

Widgets are defined via an external bundle system, allowing dynamic loading.

- **`library.json`**: The manifest file defining the bundle.
  - **`root`**: Path to the root HTML template (e.g., `./body.html`).
  - **`widgets`**: List of available widgets, mapping names to template files (e.g., `Text` -> `./text.html`).
- **Templates**: HTML files containing the widget structure and placeholders.
  - **Placeholders**: `[[propName]]` syntax is used for dynamic content substitution.

## 4. HTML Email Export

**Source:** [src/lib/emailExporter.ts](../src/lib/emailExporter.ts)

The export machinery transforms the abstract `PageLayout` into a table-based HTML string suitable for email clients.

### Workflow

1. **Fetch Root**: Downloads the `rootTemplate` (e.g., `body.html`).
2. **Generate Body**:
    - Iterate through `layout.containers`.
    - Construct a `<table>` structure for each container.
    - Within containers, iterate through `widgets`.
    - Handle columns by creating `<td>` cells with calculated widths.
3. **Render Widgets**:
    - For each widget, fetch its specific HTML template (defined in the registry/bundle).
    - **Substitution**: Replace `[[key]]` placeholders in the template with values from `widget.props`.
4. **Assembly**: Inject the generated body HTML into the root template (replacing `${SOURCE}` or appending to `<body>`).

### Example Flow

1. **Layout**: Container (1 col) -> Text Widget (`props: { content: "Hello" }`).
2. **Exporter**:
    - Fetches `body.html`.
    - Fetches `text.html`: `<div>[[content]]</div>`.
    - Substitutes: `<div>Hello</div>`.
    - Wraps in Table: `<table><tr><td><div>Hello</div></td></tr></table>`.
    - Injects into Body.

## Key Paths

- **Layout Logic**: [src/lib/unifiedLayoutManager.ts](../src/lib/unifiedLayoutManager.ts)
- **Canvas UI**: [src/components/hmi/GenericCanvas.tsx](../src/components/hmi/GenericCanvas.tsx)
- **Exporter**: [src/lib/emailExporter.ts](../src/lib/emailExporter.ts)
- **Email Widgets**: [public/widgets/email/](../public/widgets/email/)
