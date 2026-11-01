/**
 * EditorShell — the single dynamic-import chunk boundary for all editor code.
 *
 * Everything reachable from this file (@dnd-kit, lucide, overlays, property
 * panel) is bundled into one "editor" chunk. It is NEVER loaded in a pure
 * view/preview context; only when the user first activates edit mode.
 *
 * Do not import this file statically. Use the lazy wrappers in ./lazy.tsx.
 */
export { EditableNodeRenderer } from "./EditableNodeRenderer";
export { NodePropertiesPanel } from "./components/NodePropertiesPanel";
export { EditToggle } from "./components/EditToggle";
