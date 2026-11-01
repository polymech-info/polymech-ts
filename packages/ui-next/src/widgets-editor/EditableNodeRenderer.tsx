import { Suspense, useCallback } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import { widgetRegistry } from "@/widgets/system";
import { useLayoutStore } from "@/store/useLayoutStore";
import { NodeRenderer } from "@/widgets/renderer/NodeRenderer";
import type { LayoutNode } from "@/widgets/types";

import { useEditorContext } from "./context/EditorContext";
import { NodeEditorOverlay } from "./components/NodeEditorOverlay";
import { SortableItem } from "./components/SortableItem";

// ─── Per-container DnD wrapper ───────────────────────────────────────────────

interface SortableContainerProps {
  node: LayoutNode;
  strategy: "vertical" | "horizontal";
  renderChild: (child: LayoutNode) => React.ReactNode;
}

function SortableContainer({ node, strategy, renderChild }: SortableContainerProps) {
  const { pageId } = useEditorContext();
  const { moveNode, pages } = useLayoutStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const childIds = node.children.map((c) => c.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const page = pages[pageId];
    if (!page) return;

    // Find current parent (this node) children
    const oldIndex = childIds.indexOf(String(active.id));
    const newIndex = childIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    // Use arrayMove to get the new order, then apply via moveNode
    const reordered = arrayMove(node.children, oldIndex, newIndex);
    reordered.forEach((child, idx) => {
      // Only move the one that changed; find the swapped pair
      if (idx !== node.children.indexOf(child)) {
        // eslint-disable-next-line no-console
      }
    });

    // Simplest: move the dragged node to the target index
    const draggedChild = node.children[oldIndex];
    moveNode(pageId, draggedChild.id, node.id, newIndex);
  };

  const sortingStrategy =
    strategy === "vertical" ? verticalListSortingStrategy : horizontalListSortingStrategy;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={childIds} strategy={sortingStrategy}>
        {node.children.map((child) => renderChild(child))}
      </SortableContext>
    </DndContext>
  );
}

// ─── Main renderer ───────────────────────────────────────────────────────────

export interface EditableNodeRendererProps {
  node: LayoutNode;
  depth?: number;
  pageId?: string;
}

export function EditableNodeRenderer({
  node,
  depth = 0,
}: EditableNodeRendererProps) {
  const { isEditMode, pageId } = useEditorContext();
  const removeNode = useLayoutStore((s) => s.removeNode);
  const updateNodeProps = useLayoutStore((s) => s.updateNodeProps);

  // Stable onPropsChange that writes back into the store
  const handlePropsChange = useCallback(
    async (partial: Record<string, unknown>) => {
      updateNodeProps(pageId, node.id, partial);
    },
    [pageId, node.id, updateNodeProps],
  );

  // View mode — delegate entirely to the read-only renderer
  if (!isEditMode) {
    return <NodeRenderer node={node} depth={depth} pageId={pageId} />;
  }

  const def = widgetRegistry.get(node.type);
  if (!def) return null;

  const canNest = def.constraints?.canHaveChildren ?? false;

  // Shared props passed to whichever component renders this node
  const sharedProps = {
    ...(node.props as Record<string, unknown>),
    nodeId: node.id,
    widgetInstanceId: node.id,
    widgetDefId: node.type,
    layout: node.layout,
    isEditMode: true,
    onPropsChange: handlePropsChange,
  } as const;

  // ── Leaf widget with an editComponent: lazy-load the inline editor ──────────
  if (!canNest && def.editComponent) {
    const EditComp = def.editComponent;
    // Fallback to view component while the lazy chunk is loading
    const Fallback = def.component;
    return (
      <Suspense fallback={<Fallback {...sharedProps} />}>
        <EditComp {...sharedProps} />
      </Suspense>
    );
  }

  // ── Container widget (flex, flex-row, …) ────────────────────────────────────
  const Component = def.component;

  const sortStrategy: "vertical" | "horizontal" =
    node.type === "flex" ? "vertical" : "horizontal";

  const renderChild = (child: LayoutNode) => (
    <SortableItem key={child.id} id={child.id}>
      {(dragHandleProps) => (
        <NodeEditorOverlay
          nodeId={child.id}
          nodeType={child.type}
          dragHandleProps={dragHandleProps}
          onDelete={() => removeNode(pageId, child.id)}
        >
          <EditableNodeRenderer node={child} depth={depth + 1} />
        </NodeEditorOverlay>
      )}
    </SortableItem>
  );

  const editChildren = canNest ? (
    <SortableContainer node={node} strategy={sortStrategy} renderChild={renderChild} />
  ) : null;

  return (
    <Component {...sharedProps}>
      {editChildren}
    </Component>
  );
}
