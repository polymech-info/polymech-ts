import type { LayoutNode, WidgetCapability } from "@/widgets/types";
import { widgetRegistry } from "@/widgets/system";

// ─── Tree introspection helpers ──────────────────────────────────────────────

/**
 * Walk the node tree depth-first and return every node whose registered widget
 * declares the given capability.
 */
export function findNodesByCapability(
  root: LayoutNode,
  capability: WidgetCapability,
): LayoutNode[] {
  const results: LayoutNode[] = [];

  function walk(node: LayoutNode) {
    const def = widgetRegistry.get(node.type);
    if (def?.metadata.capabilities?.includes(capability)) {
      results.push(node);
    }
    node.children.forEach(walk);
  }

  walk(root);
  return results;
}

/**
 * Returns a map of capability → matching nodes for the entire subtree.
 * Only lists capabilities that actually appear in the tree.
 */
export function treeCapabilityMap(
  root: LayoutNode,
): Partial<Record<WidgetCapability, LayoutNode[]>> {
  const map: Partial<Record<WidgetCapability, LayoutNode[]>> = {};

  function walk(node: LayoutNode) {
    const def = widgetRegistry.get(node.type);
    for (const cap of def?.metadata.capabilities ?? []) {
      (map[cap] ??= []).push(node);
    }
    node.children.forEach(walk);
  }

  walk(root);
  return map;
}

/** True if a node's widget declares the given capability. */
export function nodeHasCapability(
  node: LayoutNode,
  capability: WidgetCapability,
): boolean {
  return (
    widgetRegistry.get(node.type)?.metadata.capabilities?.includes(capability) ??
    false
  );
}
