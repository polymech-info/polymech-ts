/**
 * Inline edit component for the `image` widget.
 *
 * Lazy-loaded via editComponent in corePlugin — never bundled into the view path.
 * Overlays an editable URL input when the image is hovered/focused so the user
 * can swap the image directly on the canvas.
 */
import { useRef, useState } from "react";
import type { ImageWidgetProps } from "./ImageWidget";

const PLACEHOLDER = "https://picsum.photos/seed/polymech/800/400";

export function ImageWidgetEdit({
  url,
  alt,
  fit = "cover",
  height = 200,
  onPropsChange,
}: ImageWidgetProps) {
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    const nextUrl = inputRef.current?.value ?? url ?? "";
    onPropsChange({ url: nextUrl, alt, fit, height });
  };

  return (
    <div
      className="panel widget-image"
      style={{
        padding: 0,
        overflow: "hidden",
        position: "relative",
        outline: hovered ? "2px dashed #3b82f6" : "2px dashed transparent",
        outlineOffset: 2,
        transition: "outline-color 0.15s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={url || PLACEHOLDER}
        alt={alt ?? ""}
        style={{ width: "100%", height, objectFit: fit, display: "block" }}
      />

      {/* URL edit overlay — visible on hover */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(15,23,42,0.85)",
          padding: "0.4rem 0.5rem",
          display: "flex",
          gap: "0.4rem",
          alignItems: "center",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.15s ease",
          pointerEvents: hovered ? "auto" : "none",
        }}
      >
        <span
          style={{ fontSize: "0.65rem", color: "#94a3b8", whiteSpace: "nowrap" }}
        >
          URL
        </span>
        <input
          ref={inputRef}
          defaultValue={url ?? ""}
          placeholder="https://…"
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          style={{
            flex: 1,
            fontSize: "0.75rem",
            padding: "0.2rem 0.4rem",
            borderRadius: "0.25rem",
            border: "1px solid #334155",
            background: "#0f172a",
            color: "#e2e8f0",
            outline: "none",
          }}
        />
      </div>
    </div>
  );
}
