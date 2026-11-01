export { EditorProvider, useEditorContext } from "./context/EditorContext";
export type { EditorContextValue } from "./context/EditorContext";

export { EditToggle } from "./components/EditToggle";
export { NodeEditorOverlay } from "./components/NodeEditorOverlay";
export type { NodeEditorOverlayProps } from "./components/NodeEditorOverlay";
export { SortableItem } from "./components/SortableItem";
export { NodePropertiesForm } from "./components/NodePropertiesForm";
export type { NodePropertiesFormProps } from "./components/NodePropertiesForm";
export { NodePropertiesPanel } from "./components/NodePropertiesPanel";

export { EditableNodeRenderer } from "./EditableNodeRenderer";
export type { EditableNodeRendererProps } from "./EditableNodeRenderer";

// ─── Lazy wrappers (main-bundle safe — no heavy deps) ────────────────────────
export { LazyEditableNodeRenderer, LazyNodePropertiesPanel, LazyEditToggle } from "./lazy";
