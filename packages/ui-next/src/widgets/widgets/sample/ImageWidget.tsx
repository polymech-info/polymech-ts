import type { BaseWidgetProps } from "@/widgets/types";

export type ImageFit = "cover" | "contain" | "fill" | "none";

export interface ImageWidgetProps extends BaseWidgetProps {
  /** Image source URL. Falls back to a random placeholder from picsum.photos. */
  url?: string;
  alt?: string;
  /** CSS object-fit. Default: "cover". */
  fit?: ImageFit;
  /** Fixed height in px. Default: 200. */
  height?: number;
}

const PLACEHOLDER = "https://picsum.photos/seed/polymech/800/400";

export function ImageWidget({
  url,
  alt,
  fit = "cover",
  height = 200,
  enabled = true,
}: ImageWidgetProps) {
  if (!enabled) return null;

  return (
    <div
      className="panel widget-image"
      style={{ padding: 0, overflow: "hidden" }}
    >
      <img
        src={url || PLACEHOLDER}
        alt={alt ?? ""}
        style={{ width: "100%", height, objectFit: fit, display: "block" }}
      />
    </div>
  );
}
