import { widgetRegistry } from "@/widgets/system";
import type { LayoutNode } from "@/widgets/types";

export interface NodeRendererProps {
  node: LayoutNode;
  depth?: number;
  isEditMode?: boolean;
  pageId?: string;
  onPropsChange?: (nodeId: string, partial: Record<string, unknown>) => Promise<void>;
}

/**
 * Recursive renderer for the unified Node model (widgets-api §14).
 *
 * Resolves `node.type` from the WidgetRegistry, injects base node props, and
 * recurses into `node.children` for nodes with `constraints.canHaveChildren`.
 */
export function NodeRenderer({
  node,
  depth = 0,
  isEditMode = false,
  pageId = "",
  onPropsChange,
}: NodeRendererProps) {
  const def = widgetRegistry.get(node.type);
  if (!def) {
    if (import.meta.env.DEV) {
      console.warn(`[NodeRenderer] Unknown node type: "${node.type}"`);
    }
    return null;
  }

  const Component = def.component;
  const canNest = def.constraints?.canHaveChildren ?? false;

  const handlePropsChange = async (partial: Record<string, unknown>) => {
    await onPropsChange?.(node.id, partial);
  };

  return (
    <Component
      {...(node.props as Record<string, unknown>)}
      nodeId={node.id}
      widgetInstanceId={node.id}
      widgetDefId={node.type}
      layout={node.layout}
      isEditMode={isEditMode}
      onPropsChange={handlePropsChange}
    >
      {canNest
        ? node.children.map((child) => (
            <NodeRenderer
              key={child.id}
              node={child}
              depth={depth + 1}
              isEditMode={isEditMode}
              pageId={pageId}
              onPropsChange={onPropsChange}
            />
          ))
        : null}
    </Component>
  );
}
