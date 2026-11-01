import React, { useMemo } from 'react';
import { renderMermaidSVG } from 'beautiful-mermaid';

interface MermaidWidgetProps {
    chart: string;
}

/**
 * Read a CSS custom property (e.g. "--muted") from :root and return a usable
 * hsla() string.  Tailwind/shadcn stores values as raw HSL channels
 * ("240 4.8% 95.9%"), which work inside CSS `hsl(var(--muted))` but break in
 * SVG `fill` attributes where CSS var() is not evaluated.
 */
const resolveHSL = (varName: string, alpha = 1): string => {
    const raw = getComputedStyle(document.documentElement)
        .getPropertyValue(varName)
        .trim();
    if (!raw) return alpha < 1 ? 'rgba(128,128,128,0.3)' : '#888';
    // raw is e.g. "240 4.8% 95.9%" — convert to hsla(240, 4.8%, 95.9%, α)
    const parts = raw.split(/\s+/);
    if (parts.length >= 3) {
        return `hsla(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
    }
    // If it's already a full color value, use it directly
    return raw;
};

const MermaidWidget: React.FC<MermaidWidgetProps> = ({ chart }) => {
    const { svg, error } = useMemo(() => {
        if (!chart) return { svg: null, error: null };
        try {
            // Resolve CSS variables to concrete color strings so the SVG
            // renderer can use them in fill/stroke attributes.
            const fg      = resolveHSL('--foreground');
            const line    = resolveHSL('--border');
            const border  = resolveHSL('--border');
            const surface = resolveHSL('--muted', 0.5);
            const muted   = resolveHSL('--muted-foreground');

            return {
                svg: renderMermaidSVG(chart, {
                    bg: 'transparent',
                    fg,
                    line,
                    border,
                    surface,
                    muted,
                    transparent: true,
                }),
                error: null,
            };
        } catch (err: any) {
            console.error("Mermaid parsing error:", err);
            return { svg: null, error: err instanceof Error ? err : new Error(String(err)) };
        }
    }, [chart]);

    return (
        <div className="relative my-6 flex justify-center overflow-x-auto rounded-lg bg-muted/20 p-4 border border-border/50">
            {error ? (
                <div className="text-destructive text-sm p-4 bg-destructive/10 rounded w-full">
                    <p className="font-bold mb-2">Mermaid Syntax Error</p>
                    <pre className="whitespace-pre-wrap">{error.message}</pre>
                </div>
            ) : (
                <div
                    className="mermaid-container w-full min-h-[100px] flex items-center justify-center"
                    style={{ '--_text-sec': 'hsl(var(--muted-foreground))' } as React.CSSProperties}
                    dangerouslySetInnerHTML={{ __html: svg! }}
                />
            )}
        </div>
    );
};

export default MermaidWidget;
