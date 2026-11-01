import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";

interface SortableItemProps {
  id: string;
  children: (dragHandleProps: Record<string, unknown>) => ReactNode;
}

/**
 * Generic sortable wrapper.
 * Passes drag-handle listeners/attributes to children via render-prop so the
 * overlay can place the grip wherever it wants.
 */
export function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
        zIndex: isDragging ? 999 : undefined,
        position: "relative",
      }}
    >
      {children({ ...listeners, ...attributes })}
    </div>
  );
}
