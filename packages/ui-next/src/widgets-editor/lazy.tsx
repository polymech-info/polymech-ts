/**
 * Lazy wrappers for the editor shell.
 *
 * These thin components live in the MAIN bundle (no heavy imports). They each
 * hold a `React.lazy` reference into the EditorShell chunk, which loads only
 * once the user first enters edit mode.
 *
 * All three use the same `import("./EditorShell")` promise so the browser
 * issues a single network request and Vite emits a single "editor" chunk.
 */
import React, { Suspense } from "react";

import { NodeRenderer } from "@/widgets/renderer/NodeRenderer";
import { useEditorContext } from "./context/EditorContext";
import type { LayoutNode } from "@/widgets/types";

// ─── Lazy references (all point at the same chunk) ────────────────────────────

const _EditableNodeRenderer = React.lazy(() =>
  import("./EditorShell").then((m) => ({ default: m.EditableNodeRenderer })),
);

const _NodePropertiesPanel = React.lazy(() =>
  import("./EditorShell").then((m) => ({ default: m.NodePropertiesPanel })),
);

const _EditToggle = React.lazy(() =>
  import("./EditorShell").then((m) => ({ default: m.EditToggle })),
);

// ─── Public wrappers ──────────────────────────────────────────────────────────

/**
 * Canvas renderer.
 * - View mode  → renders NodeRenderer immediately (no lazy penalty).
 * - Edit mode  → lazy-loads EditableNodeRenderer (DnD + overlays chunk).
 */
export function LazyEditableNodeRenderer({
  node,
  depth = 0,
}: {
  node: LayoutNode;
  depth?: number;
}) {
  const { isEditMode, pageId } = useEditorContext();

  if (!isEditMode) {
    return <NodeRenderer node={node} depth={depth} pageId={pageId} />;
  }

  return (
    <Suspense fallback={<NodeRenderer node={node} depth={depth} pageId={pageId} />}>
      <_EditableNodeRenderer node={node} depth={depth} />
    </Suspense>
  );
}

/**
 * Properties panel — renders nothing until a node is selected in edit mode.
 * The chunk loads the first time a node is selected.
 */
export function LazyNodePropertiesPanel() {
  const { isEditMode, selectedNodeId } = useEditorContext();
  if (!isEditMode || !selectedNodeId) return null;

  return (
    <Suspense fallback={null}>
      <_NodePropertiesPanel />
    </Suspense>
  );
}

/**
 * Edit / preview toggle bar.
 * Shows a minimal placeholder while the editor chunk is loading.
 */
export function LazyEditToggle() {
  return (
    <Suspense
      fallback={
        <button
          type="button"
          disabled
          style={{
            padding: "0.375rem 0.875rem",
            borderRadius: "0.375rem",
            border: "1px solid #334155",
            background: "#1e293b",
            color: "#64748b",
            fontSize: "0.8125rem",
            cursor: "not-allowed",
          }}
        >
          Edit
        </button>
      }
    >
      <_EditToggle />
    </Suspense>
  );
}
