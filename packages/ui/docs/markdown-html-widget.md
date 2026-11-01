# Markdown HTML Widget & Property Type

This document outlines the implementation of the `markdown` property type for widgets in the Polymech Pictures system. This feature allows widget developers to define properties that accept Markdown input, which is then rendered as HTML in the canvas and exported as HTML for emails.

## 1. Configuration Schema

To use the Markdown property type, update your widget's `library.json` definition. Use `"type": "markdown"` in the `configSchema`.

```json
{
  "name": "Text",
  "template": "./text.html",
  "configSchema": {
    "content": {
      "type": "markdown",
      "label": "Content",
      "default": "# Hello World\nThis is **markdown**.",
      "description": "The main text content."
    }
  }
}
```

## 2. Widget Properties UI

The `WidgetPropertiesForm` component has been updated to handle the `markdown` type:

* **Input**: Renders a `Textarea` for quick edits.
* **Fullscreen Editor**: Includes a "Fullscreen" button that opens a modal with a rich Markdown editor (`MarkdownEditorEx`).
* **Functionality**:
  * Supports splitting view (Editor/Preview).
  * Integrates with `ImagePickerDialog` for inserting images.

## 3. Rendering Pipeline

The rendering of Markdown content occurs in two places:

### A. Canvas Rendering (`HtmlWidget.tsx`)

* **Dependency**: Uses `marked` library for parsing.
* **Logic**:
  * The `HtmlWidget` checks the widget definition (looked up via `widgetDefId`) for any properties defined as `type: "markdown"`.
  * If found, it asynchronously parses the markdown string into HTML using `marked.parse()`.
  * The resulting HTML is injected into the template.
* **Inline Editing**: Unlike standard text properties, Markdown properties are **excluded** from the inline `contenteditable` wrappers. This prevents users from accidentally breaking the HTML structure by editing raw HTML output directly on the canvas.

### B. Email Export (`emailExporter.ts`)

* **Logic**:
  * During the export process (`generateEmailHtml`), the system iterates through widget properties.
  * It checks the `configSchema` for `markdown` types.
  * It converts the Markdown content to HTML *before* performing variable substitution in the template.
  * This ensures that the final email HTML contains properly formatted tags (e.g., `<h1>`, `<ul>`, `<strong>`) instead of raw markdown characters.

## 4. Technical Implementation Details

* **Dependencies**: Added `marked` to `package.json`.
* **Layout Context**: `LayoutContainer` passes `widgetDefId` to widget components to ensure correct schema lookup in the registry.
* **Registry**: The `WidgetRegistry` is the source of truth for property types, enabling the renderer to know *which* props to compile.

## 5. Usage Notes

* **Preview Mode**: The behavior in the canvas now matches the "Preview" mode more closely for markdown fields.
* **Sanitization**: Standard `marked` parsing is used. Ensure trusted input if extending to user-generated content in the future.
