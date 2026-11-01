import { create } from "zustand";

import type { LayoutNode, LayoutStoreAccessor, PageLayout } from "@/widgets/types";
import type { PagePersistence } from "./persistence/PagePersistence";
import { LocalStoragePagePersistence } from "./persistence/LocalStoragePagePersistence";

// ─── Tree helpers (exported for panel / utils) ───────────────────────────────

export function findNode(root: LayoutNode, id: string): LayoutNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

/**
 * Returns a new root with the given node replaced by `updater(node)`.
 * Immutable — does not mutate the original tree.
 */
function mapNode(
  root: LayoutNode,
  id: string,
  updater: (node: LayoutNode) => LayoutNode,
): LayoutNode {
  if (root.id === id) return updater(root);
  return {
    ...root,
    children: root.children.map((c) => mapNode(c, id, updater)),
  };
}

/** Remove a node from the tree (by id). Returns new root. */
function removeNodeFromTree(root: LayoutNode, id: string): LayoutNode {
  return {
    ...root,
    children: root.children
      .filter((c) => c.id !== id)
      .map((c) => removeNodeFromTree(c, id)),
  };
}

// ─── Store types ─────────────────────────────────────────────────────────────

export interface LayoutState {
  pages: Record<string, PageLayout>;

  // ── Page lifecycle ──────────────────────────────────────────────────────
  initPage(layout: PageLayout): void;
  loadPage(pageId: string): Promise<PageLayout | null>;
  savePage(pageId: string): Promise<void>;
  removePage(pageId: string): Promise<void>;

  // ── Tree operations ─────────────────────────────────────────────────────
  /** Append (or insert at index) a node under parentId. */
  addChild(pageId: string, parentId: string, node: LayoutNode, index?: number): void;
  /** Remove a node from the tree (by nodeId). */
  removeNode(pageId: string, nodeId: string): void;
  /** Move nodeId to a new parent, optionally at a specific index. */
  moveNode(pageId: string, nodeId: string, newParentId: string, index?: number): void;
  /** Shallow-merge props onto a node. */
  updateNodeProps(pageId: string, nodeId: string, props: Partial<Record<string, unknown>>): void;
  /** Shallow-merge layout hints onto a node. */
  updateNodeLayout(pageId: string, nodeId: string, layout: Partial<import("@/widgets/types").NodeLayout>): void;
}

// ─── Factory ─────────────────────────────────────────────────────────────────

function createStore(persistence: PagePersistence) {
  return create<LayoutState>()((set, get) => ({
    pages: {},

    // ── Page lifecycle ──────────────────────────────────────────────────

    initPage(layout) {
      set((s) => ({ pages: { ...s.pages, [layout.id]: layout } }));
    },

    async loadPage(pageId) {
      const layout = await persistence.load(pageId);
      if (layout) {
        set((s) => ({ pages: { ...s.pages, [pageId]: layout } }));
      }
      return layout;
    },

    async savePage(pageId) {
      const layout = get().pages[pageId];
      if (layout) await persistence.save(pageId, { ...layout, updatedAt: Date.now() });
    },

    async removePage(pageId) {
      await persistence.remove(pageId);
      set((s) => {
        const pages = { ...s.pages };
        delete pages[pageId];
        return { pages };
      });
    },

    // ── Tree operations ─────────────────────────────────────────────────

    addChild(pageId, parentId, node, index) {
      set((s) => {
        const page = s.pages[pageId];
        if (!page) return s;
        const newRoot = mapNode(page.root, parentId, (parent) => {
          const kids = [...parent.children];
          const at = index ?? kids.length;
          kids.splice(at, 0, { ...node, parentId });
          return { ...parent, children: kids };
        });
        return { pages: { ...s.pages, [pageId]: { ...page, root: newRoot, updatedAt: Date.now() } } };
      });
    },

    removeNode(pageId, nodeId) {
      set((s) => {
        const page = s.pages[pageId];
        if (!page) return s;
        const newRoot = removeNodeFromTree(page.root, nodeId);
        return { pages: { ...s.pages, [pageId]: { ...page, root: newRoot, updatedAt: Date.now() } } };
      });
    },

    moveNode(pageId, nodeId, newParentId, index) {
      set((s) => {
        const page = s.pages[pageId];
        if (!page) return s;

        const moving = findNode(page.root, nodeId);
        if (!moving) return s;

        // Remove from old position, then insert under new parent
        const withoutNode = removeNodeFromTree(page.root, nodeId);
        const newRoot = mapNode(withoutNode, newParentId, (parent) => {
          const kids = [...parent.children];
          const at = index ?? kids.length;
          kids.splice(at, 0, { ...moving, parentId: newParentId });
          return { ...parent, children: kids };
        });

        return { pages: { ...s.pages, [pageId]: { ...page, root: newRoot, updatedAt: Date.now() } } };
      });
    },

    updateNodeProps(pageId, nodeId, props) {
      set((s) => {
        const page = s.pages[pageId];
        if (!page) return s;
        const newRoot = mapNode(page.root, nodeId, (n) => ({
          ...n,
          props: { ...n.props, ...props },
        }));
        return { pages: { ...s.pages, [pageId]: { ...page, root: newRoot, updatedAt: Date.now() } } };
      });
    },

    updateNodeLayout(pageId, nodeId, layout) {
      set((s) => {
        const page = s.pages[pageId];
        if (!page) return s;
        const newRoot = mapNode(page.root, nodeId, (n) => ({
          ...n,
          layout: { ...n.layout, ...layout } as typeof n.layout,
        }));
        return { pages: { ...s.pages, [pageId]: { ...page, root: newRoot, updatedAt: Date.now() } } };
      });
    },
  }));
}

// ─── Singleton + accessor ────────────────────────────────────────────────────

export const useLayoutStore = createStore(new LocalStoragePagePersistence());

/**
 * Adapter implementing `LayoutStoreAccessor` so the plugin system can read
 * the store without depending directly on Zustand.
 */
export const layoutStoreAccessor: LayoutStoreAccessor = {
  getState: () => ({
    pages: useLayoutStore.getState().pages,
  }),
  subscribe: (selector, callback) => {
    let prev = selector({ pages: useLayoutStore.getState().pages });
    return useLayoutStore.subscribe((s) => {
      const next = selector({ pages: s.pages });
      if (!Object.is(next, prev)) {
        prev = next;
        callback(next);
      }
    });
  },
};
