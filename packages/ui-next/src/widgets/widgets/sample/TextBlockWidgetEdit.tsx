/**
 * Inline edit component for `text-block`.
 *
 * Lazy-loaded via editComponent in corePlugin — never bundled into the view path.
 * Renders the same card chrome as TextBlockWidget but with contentEditable fields
 * so the user can click-to-edit directly on the canvas.
 */
import { useEffect, useRef, useState } from "react";
import type { TextBlockWidgetProps } from "./TextBlockWidget";

export function TextBlockWidgetEdit({
  title,
  body,
  fontFamily,
  fontSize,
  onPropsChange,
}: TextBlockWidgetProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const active = hovered || focused;

  // Sync external prop changes into the DOM (e.g. properties panel update)
  useEffect(() => {
    if (titleRef.current && document.activeElement !== titleRef.current) {
      titleRef.current.textContent = title ?? "";
    }
  }, [title]);

  useEffect(() => {
    if (bodyRef.current && document.activeElement !== bodyRef.current) {
      bodyRef.current.textContent = body ?? "";
    }
  }, [body]);

  const commit = () => {
    const nextTitle = titleRef.current?.textContent ?? "";
    const nextBody = bodyRef.current?.textContent ?? "";
    onPropsChange({ title: nextTitle, body: nextBody });
  };

  return (
    <div
      className="panel widget-text-block"
      style={{
        position: "relative",
        outline: active ? "2px dashed #3b82f6" : "2px dashed transparent",
        outlineOffset: 2,
        transition: "outline-color 0.15s ease",
        cursor: "default",
        fontFamily: fontFamily ?? "var(--widget-font-family)",
        ...(fontSize != null ? { fontSize } : { fontSize: "var(--widget-font-size)" }),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <h3
        ref={titleRef}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); commit(); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            bodyRef.current?.focus();
          }
        }}
        style={{ outline: "none", cursor: "text", minHeight: "1em" }}
      >
        {title ?? ""}
      </h3>

      <p
        ref={bodyRef}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); commit(); }}
        style={{
          outline: "none",
          cursor: "text",
          minHeight: "1em",
          color: body ? undefined : "#94a3b8",
        }}
      >
        {body ?? ""}
      </p>

      <span
        style={{
          position: "absolute",
          bottom: 4,
          right: 6,
          fontSize: "0.6rem",
          color: "#3b82f6",
          fontFamily: "monospace",
          pointerEvents: "none",
          opacity: active ? 0.6 : 0,
          transition: "opacity 0.15s ease",
        }}
      >
        click to edit
      </span>
    </div>
  );
}
