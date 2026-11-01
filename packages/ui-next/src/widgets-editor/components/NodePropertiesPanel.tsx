import { X } from "lucide-react";
import { widgetRegistry } from "@/widgets/system";
import { useLayoutStore, findNode } from "@/store/useLayoutStore";
import { useEditorContext } from "@/widgets-editor/context/EditorContext";
import { NodePropertiesForm } from "./NodePropertiesForm";

const TYPE_COLORS: Record<string, string> = {
  flex: "#6366f1",
  "flex-row": "#8b5cf6",
  "text-block": "#0ea5e9",
};
function badgeColor(type: string) {
  return TYPE_COLORS[type] ?? "#64748b";
}

export function NodePropertiesPanel() {
  const { selectedNodeId, setSelectedNodeId, pageId } = useEditorContext();
  const pages = useLayoutStore((s) => s.pages);
  const updateNodeProps = useLayoutStore((s) => s.updateNodeProps);

  if (!selectedNodeId) return null;

  const page = pages[pageId];
  if (!page) return null;

  const node = findNode(page.root, selectedNodeId);
  if (!node) return null;

  const def = widgetRegistry.get(node.type);
  const schema = def?.metadata.configSchema;

  return (
    <aside
      style={{
        width: 260,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "#0f172a",
        borderRadius: "0.5rem",
        border: "1px solid #1e293b",
        overflow: "hidden",
        fontSize: "0.8125rem",
        color: "#e2e8f0",
        alignSelf: "flex-start",
        position: "sticky",
        top: "1rem",
        maxHeight: "calc(100vh - 6rem)",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.625rem 0.75rem",
          borderBottom: "1px solid #1e293b",
          background: "#0a1220",
        }}
      >
        <span
          style={{
            padding: "0.1rem 0.4rem",
            borderRadius: "0.25rem",
            background: badgeColor(node.type),
            color: "#fff",
            fontSize: "0.6875rem",
            fontFamily: "monospace",
            fontWeight: 700,
            lineHeight: 1.4,
          }}
        >
          {node.type}
        </span>

        <span
          style={{
            flex: 1,
            fontSize: "0.6875rem",
            color: "#64748b",
            fontFamily: "monospace",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={node.id}
        >
          {node.id}
        </span>

        <button
          type="button"
          onClick={() => setSelectedNodeId(null)}
          title="Close panel"
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0.125rem",
            border: "none",
            background: "transparent",
            color: "#64748b",
            cursor: "pointer",
            borderRadius: "0.25rem",
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem" }}>
        {schema ? (
          <NodePropertiesForm
            schema={schema}
            currentProps={node.props}
            onPropsChange={(next) => updateNodeProps(pageId, node.id, next)}
          />
        ) : (
          <p style={{ color: "#475569", fontSize: "0.75rem", textAlign: "center", padding: "1.5rem 0" }}>
            No configurable properties
          </p>
        )}

        {/* ── Node info (debug) ── */}
        <details style={{ marginTop: "1rem" }}>
          <summary
            style={{
              cursor: "pointer",
              fontSize: "0.6875rem",
              color: "#475569",
              userSelect: "none",
            }}
          >
            Raw node
          </summary>
          <pre
            style={{
              marginTop: "0.5rem",
              fontSize: "0.625rem",
              color: "#475569",
              overflow: "auto",
              maxHeight: 180,
              background: "#0a1220",
              borderRadius: "0.25rem",
              padding: "0.5rem",
            }}
          >
            {JSON.stringify(node, null, 2)}
          </pre>
        </details>
      </div>
    </aside>
  );
}
