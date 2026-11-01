import { useEffect, useMemo } from "react";

import { bootWidgetSystem } from "@/widgets/bootstrap/boot";
import { useLayoutStore } from "@/store/useLayoutStore";
import type { LayoutNode, PageLayout } from "@/widgets/types";

import { EditorProvider, useEditorContext } from "@/widgets-editor/context/EditorContext";
import {
  LazyEditToggle,
  LazyEditableNodeRenderer,
  LazyNodePropertiesPanel,
} from "@/widgets-editor/lazy";
import { treeCapabilityMap } from "@/widgets/utils/introspection";

// ─── Seed data ────────────────────────────────────────────────────────────────

// Bump the ID to force a fresh seed (localStorage keys are page-scoped).
const PAGE_ID = "demo-flex-page-v3";

function makeSeedLayout(): PageLayout {
  const textBlock = (id: string, title: string, body: string): LayoutNode => ({
    id,
    type: "text-block",
    props: { title, body },
    children: [],
    parentId: null,
  });

  const imageNode = (id: string, seed: string): LayoutNode => ({
    id,
    type: "image",
    props: {
      url: `https://picsum.photos/seed/${seed}/800/400`,
      alt: "Demo image",
      fit: "cover",
      height: 180,
    },
    children: [],
    parentId: null,
  });

  // Row 1 — 2-col: hero text | image
  const row1: LayoutNode = {
    id: "r1",
    type: "flex-row",
    props: {},
    children: [
      textBlock("w1", "Hero section", "Full-width — two-column row with an image."),
      imageNode("img1", "polymech"),
    ],
    parentId: "root",
    layout: { display: "grid", columns: 2, gap: 16 },
  };

  // Row 2 — 3-col: cards
  const row2: LayoutNode = {
    id: "r2",
    type: "flex-row",
    props: {},
    children: [
      textBlock("w2", "Card A", "Column 0"),
      textBlock("w3", "Card B", "Column 1"),
      textBlock("w4", "Card C", "Column 2"),
    ],
    parentId: "root",
    layout: { display: "grid", columns: 3, gap: 12 },
  };

  // Row 3 — 2-col: more images
  const row3: LayoutNode = {
    id: "r3",
    type: "flex-row",
    props: {},
    children: [
      imageNode("img2", "alpine"),
      imageNode("img3", "forest"),
    ],
    parentId: "root",
    layout: { display: "grid", columns: 2, gap: 12 },
  };

  const root: LayoutNode = {
    id: "root",
    type: "flex",
    props: { title: "Demo flex container", showTitle: true, gap: 24 },
    children: [row1, row2, row3],
    parentId: null,
    layout: { display: "flex", direction: "column", gap: 24 },
  };

  return {
    id: PAGE_ID,
    name: "Flex node demo",
    root,
    version: "1.0.0",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ─── Introspection badge ──────────────────────────────────────────────────────

const CAP_COLORS: Record<string, string> = {
  text:  "#3b82f6",
  image: "#f59e0b",
};

function TreeIntrospectionPanel({ root }: { root: LayoutNode }) {
  const { setSelectedNodeId } = useEditorContext();

  const capMap = useMemo(() => treeCapabilityMap(root), [root]);

  const interesting = Object.entries(capMap).filter(([cap]) =>
    ["text", "image"].includes(cap),
  );

  if (interesting.length === 0) return null;

  return (
    <details className="panel" style={{ marginTop: "1rem" }}>
      <summary style={{ cursor: "pointer" }}>
        <strong>Tree introspection</strong>
        <span className="muted" style={{ fontSize: "0.75rem", marginLeft: "0.5rem" }}>
          {interesting.map(([, nodes]) => nodes.length).reduce((a, b) => a + b, 0)}{" "}
          annotated node(s)
        </span>
      </summary>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", marginTop: "0.75rem" }}>
        {interesting.map(([cap, nodes]) => (
          <div key={cap}>
            <div
              style={{
                fontSize: "0.625rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: CAP_COLORS[cap] ?? "#94a3b8",
                marginBottom: "0.4rem",
              }}
            >
              {cap} ({nodes.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
              {nodes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNodeId(n.id)}
                  style={{
                    padding: "0.15rem 0.45rem",
                    fontSize: "0.7rem",
                    fontFamily: "monospace",
                    borderRadius: "0.25rem",
                    border: `1px solid ${CAP_COLORS[cap] ?? "#334155"}`,
                    background: "transparent",
                    color: CAP_COLORS[cap] ?? "#e2e8f0",
                    cursor: "pointer",
                  }}
                >
                  {n.id}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p
        className="muted"
        style={{ fontSize: "0.7rem", marginTop: "0.75rem", marginBottom: 0 }}
      >
        Click a node ID to select it. Set Typography on the root{" "}
        <code>flex</code> node to cascade font to all TEXT widgets at once.
      </p>
    </details>
  );
}

// ─── Inner page (needs EditorContext in scope) ────────────────────────────────

function FlexNodeDemoInner() {
  const { pages, initPage } = useLayoutStore();
  const { isEditMode, selectedNodeId } = useEditorContext();
  const page = pages[PAGE_ID];

  useEffect(() => {
    void bootWidgetSystem().then(() => {
      if (!useLayoutStore.getState().pages[PAGE_ID]) {
        initPage(makeSeedLayout());
      }
    });
  }, [initPage]);

  return (
    <section className="nested">
      {/* ── Toolbar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Flex node scaffold</h1>
          <p className="muted" style={{ margin: "0.25rem 0 0" }}>
            Node model §14 — <code>flex</code> + <code>flex-row</code> +{" "}
            <code>image</code> widgets. Toggle edit to drag-reorder.
          </p>
        </div>
        <LazyEditToggle />
      </div>

      {/* ── Edit mode indicator strip ── */}
      {isEditMode && (
        <div
          style={{
            padding: "0.375rem 0.75rem",
            marginBottom: "0.75rem",
            borderRadius: "0.375rem",
            background: "#1e3a5f",
            color: "#93c5fd",
            fontSize: "0.8125rem",
            display: "flex",
            gap: "1rem",
          }}
        >
          <span>Edit mode — drag rows or cards to reorder</span>
          {selectedNodeId && (
            <span style={{ color: "#fbbf24" }}>
              Selected: <code>{selectedNodeId}</code>
            </span>
          )}
        </div>
      )}

      {/* ── Canvas + properties panel ── */}
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0, paddingTop: isEditMode ? "1.5rem" : 0 }}>
          {page ? (
            <LazyEditableNodeRenderer node={page.root} />
          ) : (
            <p className="muted">Bootstrapping…</p>
          )}
        </div>
        <LazyNodePropertiesPanel />
      </div>

      {/* ── Tree introspection ── */}
      {page && <TreeIntrospectionPanel root={page.root} />}

      {/* ── Raw tree inspector ── */}
      <details className="panel" style={{ marginTop: "1rem" }}>
        <summary style={{ cursor: "pointer" }}>
          <strong>Node tree (raw)</strong>
        </summary>
        <pre
          style={{ fontSize: "0.75rem", overflow: "auto", maxHeight: "400px" }}
        >
          {JSON.stringify(page?.root ?? null, null, 2)}
        </pre>
      </details>
    </section>
  );
}

// ─── Page component (provides EditorContext) ──────────────────────────────────

export function FlexNodeDemoPage() {
  return (
    <EditorProvider pageId={PAGE_ID}>
      <FlexNodeDemoInner />
    </EditorProvider>
  );
}
