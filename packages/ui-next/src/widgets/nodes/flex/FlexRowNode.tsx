import type { BaseWidgetProps } from "@/widgets/types";

export interface FlexRowNodeProps extends BaseWidgetProps {
  /** Column count — editable via property panel, falls back to node.layout.columns. */
  columns?: number;
  /** Gap in px — editable via property panel, falls back to node.layout.gap. */
  gap?: number;
}

/**
 * Flex-row node — renders children as a CSS grid row.
 *
 * `columns` prop (or `layout.columns`) → gridTemplateColumns (equal fr units)
 * `gap` prop (or `layout.gap`)         → column + row gap
 *
 * Props take priority over layout so the property panel can override the seed.
 * On narrow viewports (`max-md`) the grid collapses to a single column.
 */
export function FlexRowNode({ layout, columns: propColumns, gap: propGap, children }: FlexRowNodeProps) {
  const columns = propColumns ?? layout?.columns ?? 1;
  const gap = propGap ?? layout?.gap ?? 16;

  return (
    <div
      className="grid min-w-0 max-md:!grid-cols-1"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
      }}
    >
      {children}
    </div>
  );
}
