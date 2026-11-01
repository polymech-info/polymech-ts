import React from "react";
import type { WidgetPlugin } from "@/widgets/types";

import { TextBlockWidget } from "@/widgets/widgets/sample/TextBlockWidget";
import type { TextBlockWidgetProps } from "@/widgets/widgets/sample/TextBlockWidget";
import { ImageWidget } from "@/widgets/widgets/sample/ImageWidget";
import type { ImageWidgetProps } from "@/widgets/widgets/sample/ImageWidget";

import { FlexNode } from "@/widgets/nodes/flex/FlexNode";
import type { FlexNodeProps } from "@/widgets/nodes/flex/FlexNode";
import { FlexRowNode } from "@/widgets/nodes/flex/FlexRowNode";
import type { FlexRowNodeProps } from "@/widgets/nodes/flex/FlexRowNode";

// ─── Lazy edit components (never loaded in view mode) ─────────────────────────

const TextBlockWidgetEdit = React.lazy(() =>
  import("@/widgets/widgets/sample/TextBlockWidgetEdit").then((m) => ({
    default: m.TextBlockWidgetEdit,
  })),
);

const ImageWidgetEdit = React.lazy(() =>
  import("@/widgets/widgets/sample/ImageWidgetEdit").then((m) => ({
    default: m.ImageWidgetEdit,
  })),
);

// ─── Shared option lists ──────────────────────────────────────────────────────

const FONT_FAMILY_OPTIONS = [
  { value: "", label: "Inherit" },
  { value: "system-ui, sans-serif", label: "System UI" },
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Courier New', monospace", label: "Monospace" },
];

const IMAGE_FIT_OPTIONS = [
  { value: "cover", label: "Cover" },
  { value: "contain", label: "Contain" },
  { value: "fill", label: "Fill" },
  { value: "none", label: "None" },
];

/**
 * Registers baseline widgets and layout nodes.
 * Mirrors `registerWidgets()` as a plugin (widgets-api §13).
 */
export const coreWidgetsPlugin: WidgetPlugin = {
  id: "polymech:core-widgets",
  name: "Core widgets",
  version: "0.0.0",
  priority: 100,
  setup(api) {
    // ── Layout nodes (§14) ──────────────────────────────────────────────────

    api.registerWidget<FlexNodeProps>({
      component: FlexNode,
      metadata: {
        id: "flex",
        name: "Flex container",
        category: "layout",
        description: "Vertical flex column; children are flex-row nodes.",
        tags: ["layout", "core"],
        capabilities: ["nested-layout"],
        defaultProps: { gap: 16 },
        configSchema: {
          // Display group
          title:      { type: "text",    label: "Title",      group: "Display", description: "Section heading" },
          showTitle:  { type: "boolean", label: "Show title", group: "Display" },
          // Layout group
          gap:        { type: "number",  label: "Row gap",    group: "Layout",  default: 16, min: 0, max: 128 },
          // Typography group — cascades to nested TEXT widgets via CSS custom properties
          fontFamily: { type: "select",  label: "Font family", group: "Typography", options: FONT_FAMILY_OPTIONS },
          fontSize:   { type: "number",  label: "Font size (px)", group: "Typography", min: 10, max: 64 },
        },
      },
      constraints: {
        canHaveChildren: true,
        allowedChildTypes: ["flex-row"],
        draggable: true,
        deletable: true,
      },
    });

    api.registerWidget<FlexRowNodeProps>({
      component: FlexRowNode,
      metadata: {
        id: "flex-row",
        name: "Flex row",
        category: "layout",
        description: "CSS grid row; columns controlled by columns prop.",
        tags: ["layout", "core"],
        capabilities: ["nested-layout"],
        configSchema: {
          columns: { type: "number", label: "Columns", group: "Layout", default: 1, min: 1, max: 12 },
          gap:     { type: "number", label: "Gap",     group: "Layout", default: 16, min: 0, max: 128 },
        },
      },
      constraints: {
        canHaveChildren: true,
        draggable: false,
        deletable: true,
      },
    });

    // ── Content widgets ──────────────────────────────────────────────────────

    api.registerWidget<TextBlockWidgetProps>({
      component: TextBlockWidget,
      editComponent: TextBlockWidgetEdit,
      metadata: {
        id: "text-block",
        name: "Text block",
        category: "display",
        description: "Heading + body (scaffold)",
        tags: ["text", "core"],
        capabilities: ["text"],
        defaultProps: {
          title: "Hello",
          body: "Widget registry + plugin bootstrap.",
        },
        configSchema: {
          title:      { type: "text",   label: "Title",          group: "Content" },
          body:       { type: "markdown", label: "Body",          group: "Content" },
          fontFamily: { type: "select", label: "Font family",    group: "Typography", options: FONT_FAMILY_OPTIONS },
          fontSize:   { type: "number", label: "Font size (px)", group: "Typography", min: 10, max: 64 },
        },
      },
      constraints: { canHaveChildren: false, draggable: true, deletable: true },
    });

    api.registerWidget<ImageWidgetProps>({
      component: ImageWidget,
      editComponent: ImageWidgetEdit,
      metadata: {
        id: "image",
        name: "Image",
        category: "display",
        description: "Full-width image with optional placeholder.",
        tags: ["image", "media", "core"],
        capabilities: ["image"],
        defaultProps: {
          url: "",
          fit: "cover",
          height: 200,
        },
        configSchema: {
          url:    { type: "text",   label: "URL",     group: "Content", description: "Leave empty for random placeholder" },
          alt:    { type: "text",   label: "Alt text", group: "Content" },
          fit:    { type: "select", label: "Fit",     group: "Layout",  options: IMAGE_FIT_OPTIONS },
          height: { type: "number", label: "Height (px)", group: "Layout", min: 40, max: 800 },
        },
      },
      constraints: { canHaveChildren: false, draggable: true, deletable: true },
    });
  },
};
