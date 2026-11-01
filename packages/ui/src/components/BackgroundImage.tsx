
import React, { useId, useMemo } from 'react';
import { useResponsiveImage } from '@/hooks/useResponsiveImage';
import { ResponsiveData } from './ResponsiveImage';

interface BackgroundImageProps extends React.HTMLAttributes<HTMLDivElement> {
    src: string | File;
    sizes?: string; // Not directly used in CSS but consistent with API
    responsiveSizes?: number[];
    formats?: string[];
    as?: React.ElementType;
}

export const BackgroundImage: React.FC<BackgroundImageProps> = ({
    src,
    responsiveSizes = [180, 640, 1024, 2048],
    formats = ['avif', 'webp'],
    className,
    style,
    as: Component = 'div',
    children,
    ...props
}) => {
    const { data } = useResponsiveImage({ src, responsiveSizes, formats });
    const uuid = useId().replace(/:/g, ''); // Sanitize ID for CSS class usage
    const uniqueClass = `bg-${uuid}`;

    const css = useMemo(() => {
        if (!data) return '';

        let cssString = '';

        // Group sources by width for easier media query generation
        const sourcesByWidth: Record<number, { src: string; format: string }[]> = {};

        // Also find fallback (jpeg max width)
        let fallbackUrl = data.img.src;

        data.sources.forEach(source => {
            const type = source.type.split('/')[1]; // image/avif -> avif
            const variants = source.srcset.split(', ');
            variants.forEach(variant => {
                const [url, widthDesc] = variant.split(' ');
                const width = parseInt(widthDesc.replace('w', ''));
                if (!sourcesByWidth[width]) sourcesByWidth[width] = [];
                sourcesByWidth[width].push({ src: url, format: type });
            });
        });

        const widths = Object.keys(sourcesByWidth).map(Number).sort((a, b) => b - a); // Descending

        // Generate CSS
        // 1. Base styles (largest width, fallback format (jpeg/png))
        const maxWidth = widths[0];

        // Helper to generate rule block
        const generateRules = (w: number) => {
            const variants = sourcesByWidth[w];
            if (!variants) return '';

            // Order: AVIF -> WebP -> JPEG (CSS precedence via class selectors)
            // Rules:
            // .avif .bg-id { background-image: url(...) }
            // .webp .bg-id { background-image: url(...) }
            // .bg-id { background-image: url(...) }  <-- Default/Fallback

            let rules = '';

            // Specific formats
            variants.forEach(v => {
                if (v.format === 'jpeg' || v.format === 'png') return; // Handled as default
                rules += `html.${v.format} .${uniqueClass} { background-image: url('${v.src}'); }\n`;
            });

            // Default (JPEG/PNG)
            const def = variants.find(v => v.format === 'jpeg' || v.format === 'png' || v.format === 'jpg');
            if (def) {
                rules += `.${uniqueClass} { background-image: url('${def.src}'); }\n`;
            } else {
                // Fallback if no jpeg found for this width (unlikely with defaults)
                // Just use the first one as default
                rules += `.${uniqueClass} { background-image: url('${variants[0].src}'); }\n`;
            }
            return rules;
        };

        // Desktop / Base (Max Width)
        cssString += generateRules(maxWidth);

        // Media Queries (Descending)
        // Skip max width as it is base
        for (let i = 1; i < widths.length; i++) {
            const w = widths[i];
            // Since we sort descending, we use max-width for the current step?
            // Wait, standard mobile-first is min-width. Desktop-first is max-width.
            // Responsive images usually work by "if viewport < X, use this".
            // So: @media (max-width: ${w}px) { ... }

            // Note: If we have 2048, 1024, 640.
            // Base = 2048.
            // @media (max-width: 1024px) { use 1024 }
            // @media (max-width: 640px) { use 640 }

            // Caution: If widths are very close or logic is slighty off, we might load wrong one.
            // But this matches the "overwrite" strategy.

            cssString += `@media (max-width: ${w}px) {
                ${generateRules(w)}
            }\n`;
        }

        return cssString;
    }, [data, uniqueClass]);

    if (!data) {
        return <Component className={`${className} animate-pulse bg-muted`} style={style} {...props}>{children}</Component>;
    }

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: css }} />
            <Component
                className={`${className || ''} ${uniqueClass}`}
                style={{
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    ...style
                }}
                {...props}
            >
                {children}
            </Component>
        </>
    );
};
