import type { BaseWidgetProps } from "@/widgets/types";

export interface FlexNodeProps extends BaseWidgetProps {
  gap?: number;
  title?: string;
  showTitle?: boolean;
  collapsible?: boolean;
  enabled?: boolean;
  /**
   * Font family to cascade to all descendant TEXT widgets via the
   * `--widget-font-family` CSS custom property.
   */
  fontFamily?: string;
  /**
   * Base font size (px) to cascade via `--widget-font-size`.
   * Individual text-block nodes can override this with their own `fontSize` prop.
   */
  fontSize?: number;
}

/**
 * Flex container node — renders children in a vertical flex column.
 *
 * Typography cascade: setting `fontFamily` / `fontSize` here propagates to all
 * nested TEXT-capability widgets via CSS custom properties, so you can control
 * the look of an entire section in one go.
 */
export function FlexNode({
  layout,
  gap,
  title,
  showTitle,
  enabled = true,
  fontFamily,
  fontSize,
  children,
}: FlexNodeProps) {
  if (!enabled) return null;

  const resolvedGap = gap ?? layout?.gap ?? 16;

  // Build CSS custom property overrides for typography cascade.
  // We use `as React.CSSProperties` because TS doesn't model custom properties.
  const cssVars: Record<string, string | number> = {};
  if (fontFamily) cssVars["--widget-font-family"] = fontFamily;
  if (fontSize != null) cssVars["--widget-font-size"] = `${fontSize}px`;

  const inner = (
    <div
      className="relative min-w-0 flex flex-col"
      style={{ gap: resolvedGap, ...cssVars } as React.CSSProperties}
    >
      {children}
    </div>
  );

  if (showTitle && title) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">
          {title}
        </h3>
        {inner}
      </div>
    );
  }

  return inner;
}
