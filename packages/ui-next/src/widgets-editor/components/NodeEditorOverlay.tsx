import type { ReactNode, SyntheticEvent, CSSProperties } from "react";
import { Trash2 } from "lucide-react";
import { useEditorContext } from "@/widgets-editor/context/EditorContext";

/** Colour-coded per node type category */
const TYPE_COLORS: Record<string, string> = {
  flex: "#6366f1",       // indigo — container
  "flex-row": "#8b5cf6", // violet — row
  "text-block": "#0ea5e9", // sky — content
};

function typeBadgeColor(type: string): string {
  return TYPE_COLORS[type] ?? "#64748b";
}

export interface NodeEditorOverlayProps {
  nodeId: string;
  nodeType: string;
  /** The visual node content */
  children: ReactNode;
  onDelete?: () => void;
  /** Drag listeners/attributes from useSortable — injected into the grip handle */
  dragHandleProps?: Record<string, unknown>;
  /** Extra wrapper style (e.g. opacity while dragging) */
  style?: CSSProperties;
}

export function NodeEditorOverlay({
  nodeId,
  nodeType,
  children,
  onDelete,
  dragHandleProps,
  style,
}: NodeEditorOverlayProps) {
  const { selectedNodeId, setSelectedNodeId } = useEditorContext();
  const isSelected = selectedNodeId === nodeId;

  const handleSelect = (e: SyntheticEvent) => {
    e.stopPropagation();
    setSelectedNodeId(isSelected ? null : nodeId);
  };

  const badgeColor = typeBadgeColor(nodeType);

  return (
    <div
      onClick={handleSelect}
      style={{
        position: "relative",
        borderRadius: "0.375rem",
        outline: isSelected
          ? `2px solid ${badgeColor}`
          : "2px solid transparent",
        outlineOffset: "2px",
        transition: "outline-color 0.12s",
        cursor: "default",
        ...style,
      }}
    >
      {/* Floating header bar — visible on hover/selected */}
      <div
        className="editor-overlay-bar"
        style={{
          position: "absolute",
          top: "-1.5rem",
          left: 0,
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          zIndex: 10,
          opacity: isSelected ? 1 : 0,
          transition: "opacity 0.12s",
          pointerEvents: isSelected ? "auto" : "none",
        }}
      >
        {/* Drag grip */}
        {dragHandleProps && (
          <span
            {...dragHandleProps}
            title="Drag to reorder"
            style={{
              cursor: "grab",
              padding: "0.125rem 0.25rem",
              borderRadius: "0.25rem",
              background: badgeColor,
              color: "#fff",
              fontSize: "0.6875rem",
              userSelect: "none",
              lineHeight: 1,
            }}
          >
            ⠿
          </span>
        )}

        {/* Type badge */}
        <span
          style={{
            padding: "0.125rem 0.375rem",
            borderRadius: "0.25rem",
            background: badgeColor,
            color: "#fff",
            fontSize: "0.6875rem",
            fontFamily: "monospace",
            lineHeight: 1,
          }}
        >
          {nodeType}
        </span>

        {/* Delete */}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete node"
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0.125rem",
              borderRadius: "0.25rem",
              border: "none",
              background: "#ef4444",
              color: "#fff",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>

      {/* Hover glow when NOT selected */}
      <style>{`
        .editor-node-wrap:hover .editor-overlay-bar { opacity: 1 !important; pointer-events: auto !important; }
      `}</style>
      <div
        className="editor-node-wrap"
        style={{ position: "relative" }}
      >
        {children}
      </div>
    </div>
  );
}
