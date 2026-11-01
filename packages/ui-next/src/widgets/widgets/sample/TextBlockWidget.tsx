import type { BaseWidgetProps } from "@/widgets/types";

export interface TextBlockWidgetProps extends BaseWidgetProps {
  title?: string;
  body?: string;
  /**
   * Explicit font family for this widget.
   * Falls back to the `--widget-font-family` CSS variable set by a parent FlexNode,
   * then to the browser default.
   */
  fontFamily?: string;
  /**
   * Explicit font size (px) for this widget.
   * Falls back to the `--widget-font-size` CSS variable, then browser default.
   */
  fontSize?: number;
}

export function TextBlockWidget(props: TextBlockWidgetProps) {
  const { title, body, fontFamily, fontSize } = props;

  // Consume the CSS custom properties set by a parent FlexNode for typography
  // cascade. Individual props override them.
  const wrapStyle: React.CSSProperties = {
    fontFamily: fontFamily ?? "var(--widget-font-family)",
    ...(fontSize != null ? { fontSize } : { fontSize: "var(--widget-font-size)" }),
  };

  return (
    <div className="panel widget-text-block" style={wrapStyle}>
      <h3>{title ?? "Text block"}</h3>
      {body ? <p>{body}</p> : <p className="muted">Empty body</p>}
    </div>
  );
}
