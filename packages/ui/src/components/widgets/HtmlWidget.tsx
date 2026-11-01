import React, { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { template } from '@/lib/variables';
import { ImagePickerDialog } from '@/components/widgets/ImagePickerDialog';
import { widgetRegistry } from '@/lib/widgetRegistry';
import { marked } from 'marked';

interface HtmlWidgetProps {
    src?: string;
    html?: string;
    content?: string; // New content prop
    variables?: string | Record<string, any>; // JSON string or object
    className?: string;
    style?: React.CSSProperties;
    isEditMode?: boolean;
    onPropsChange?: (props: Record<string, any>) => void;
    [key: string]: any; // Allow dynamic props for substitution
}

export const HtmlWidget: React.FC<HtmlWidgetProps> = ({
    src,
    html: initialHtml,
    content: initialContent,
    variables,
    className = '',
    style,
    isEditMode,
    onPropsChange,
    ...restProps
}) => {
    // Prioritize content over html
    const sourceHtml = initialContent || initialHtml;
    const [content, setContent] = useState<string | null>(sourceHtml || null);
    const [processedContent, setProcessedContent] = useState<string | null>(sourceHtml || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Image Picker State
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [activeImageProp, setActiveImageProp] = useState<string | null>(null);
    const [currentImageValue, setCurrentImageValue] = useState<string | null>(null);

    useEffect(() => {
        if (sourceHtml) {
            setContent(sourceHtml);
            return;
        }

        if (src) {
            setLoading(true);
            setError(null);
            fetch(src)
                .then(async (res) => {
                    if (!res.ok) throw new Error(`Failed to load widget: ${res.statusText}`);
                    const text = await res.text();
                    setContent(text);
                })
                .catch((err) => {
                    console.error("Error loading HTML widget:", err);
                    setError("Failed to load content");
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [src, sourceHtml]);

    // Apply substitutions whenever content or props change
    useEffect(() => {
        const processContent = async () => {
            if (!content) {
                setProcessedContent(null);
                return;
            }

            try {
                // Parse variables if needed
                let parsedVariables: Record<string, any> = {};
                if (typeof variables === 'string') {
                    try {
                        parsedVariables = JSON.parse(variables);
                    } catch (e) {
                        console.warn('Failed to parse variables JSON', e);
                    }
                } else if (typeof variables === 'object') {
                    parsedVariables = variables || {};
                }

                // Merge props: contextVariables + restProps + variables
                // Priority:
                // 1. variables prop (explicitly set for this widget)
                // 2. restProps (legacy or passed props)
                // 3. contextVariables (global page variables) - LEAST priority to allow override?
                // Actually, usually local overrides global. So contextVariables should be base.

                const finalProps = {
                    ...((restProps as any).contextVariables || {}), // From context
                    ...restProps,
                    ...parsedVariables
                };
                const markdownKeys = new Set<string>();

                if (finalProps.widgetDefId) {
                    const def = widgetRegistry.get(finalProps.widgetDefId);
                    if (def?.metadata?.configSchema) {
                        for (const [key, schema] of Object.entries(def.metadata.configSchema)) {
                            if ((schema as any).type === 'markdown' && typeof finalProps[key] === 'string') {
                                try {
                                    finalProps[key] = await marked.parse(finalProps[key]);
                                    markdownKeys.add(key);
                                } catch (e) {
                                    console.warn('Markdown parse error', e);
                                }
                            }
                        }
                    }
                }

                if (isEditMode) {
                    // Design Mode Template Logic
                    // 1. Wrap text placeholders in contenteditable spans: ${content} -> <span data-prop="content" ...>${content}</span>
                    // 2. Mark image placeholders: src="${img}" -> src="${img}" data-img-prop="img"

                    // Helper to inject data attributes for images
                    let designHtml = content.replace(/src="\$\{([^}]+)\}"/g, (match, propName) => {
                        // Keep the src substitution for rendering, but add a data marker
                        return `src="\${${propName}}" data-widget-image-prop="${propName}" style="cursor: pointer; outline: 2px solid transparent;" onmouseover="this.style.outline='2px dashed #3b82f6'" onmouseout="this.style.outline='none'"`;
                    });

                    // Process text substitutions with wrappers
                    const varsWithWrappers: Record<string, any> = {};

                    Object.keys(finalProps).forEach(key => {
                        const value = finalProps[key];
                        const k = key.toLowerCase();

                        // Exclude properties that are likely used in attributes (style, class, src, etc.)
                        // Also exclude specific known style props from library.json
                        const isAttributeProp =
                            k.includes('class') ||
                            k.includes('style') ||
                            k.includes('src') ||
                            k.includes('href') ||
                            k.includes('target') ||
                            k.includes('rel') ||
                            k.includes('id') ||
                            k.includes('type') ||
                            k.includes('value') ||
                            k.includes('placeholder') ||
                            k.includes('width') ||
                            k.includes('height') ||
                            k.includes('size') ||  // covers fontSize, backgroundSize
                            k.includes('color') || // covers color, backgroundColor
                            k.includes('align') || // covers textAlign, verticalAlign
                            k.includes('family') || // covers fontFamily
                            k.includes('weight') || // covers fontWeight
                            k.includes('height') || // covers lineHeight
                            k.includes('decoration') || // textDecoration
                            k.includes('padding') ||
                            k.includes('margin') ||
                            k.includes('border') ||
                            k.includes('radius') ||
                            k.includes('display') ||
                            k.includes('position') ||
                            k.includes('top') ||
                            k.includes('left') ||
                            k.includes('right') ||
                            k.includes('bottom') ||
                            k.includes('z-index') ||
                            k.includes('overflow') ||
                            k.includes('float') ||
                            k.includes('clear') ||
                            k.includes('image') || // handled by data-img-prop
                            k.includes('url');

                        const isMarkdown = markdownKeys.has(key);

                        // Allow explicit content keys or keys that don't match the exclusion list
                        // If simple string and not an attribute prop AND not markdown, wrap it
                        if (!isAttributeProp && typeof value === 'string' && !isMarkdown) {
                            varsWithWrappers[key] = `<span data-widget-prop="${key}" contenteditable="true" style="outline: none; transition: background 0.2s; min-width: 1em; display: inline-block;" onfocus="this.style.backgroundColor='rgba(59, 130, 246, 0.1)'" onblur="this.style.backgroundColor='transparent'">${value}</span>`;
                        } else {
                            varsWithWrappers[key] = value;
                        }
                    });

                    // Use template to substitute with our wrapped values
                    const newContent = template(designHtml, varsWithWrappers, false);
                    setProcessedContent(newContent);

                } else {
                    // Standard Rendering
                    const newContent = template(content, finalProps, false);
                    setProcessedContent(newContent);
                }
            } catch (e) {
                console.error("Template substitution failed", e);
                setProcessedContent(content);
            }
        };

        processContent();
    }, [content, restProps, variables, isEditMode]);


    // Event Delegation for Inline Editing
    useEffect(() => {
        if (!isEditMode || !containerRef.current) return;

        const container = containerRef.current;

        const handleFocusOut = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            const propName = target.getAttribute('data-widget-prop');

            if (propName && onPropsChange) {
                const newValue = target.innerText;
                // Only update if changed
                if (restProps[propName] !== newValue) {
                    onPropsChange({ [propName]: newValue });
                }
            }
        };

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Handle Image Clicks
            const imgProp = target.getAttribute('data-widget-image-prop');
            if (imgProp) {
                e.preventDefault();
                e.stopPropagation();

                setActiveImageProp(imgProp);
                setCurrentImageValue(target.getAttribute('src'));
                setShowImagePicker(true);
            }
        };

        // Use capture phase for some events if needed, but bubbling is usually fine
        container.addEventListener('focusout', handleFocusOut);
        container.addEventListener('click', handleClick);

        return () => {
            container.removeEventListener('focusout', handleFocusOut);
            container.removeEventListener('click', handleClick);
        };
    }, [isEditMode, onPropsChange, restProps]);


    const handleImageSelect = (pictureId: string) => {
        // This won't work directly if we need the URL, handled by onSelectPicture
    };

    const handlePictureSelect = (picture: any) => {
        if (activeImageProp && onPropsChange) {
            onPropsChange({ [activeImageProp]: picture.image_url });
        }
        setShowImagePicker(false);
        setActiveImageProp(null);
    };


    if (loading) {
        return <Skeleton className="w-full h-full min-h-[50px] rounded dark:bg-slate-800/50" />;
    }

    if (error) {
        return <div className="text-xs text-red-500 border border-red-200 rounded bg-red-50">{error}</div>;
    }

    if (!processedContent) {
        return <div className="text-xs text-slate-400 border border-dashed border-slate-300 rounded">No content</div>;
    }

    return (
        <>
            <div
                ref={containerRef}
                className={`html-widget-container ${className}`}
                style={style}
                dangerouslySetInnerHTML={{ __html: processedContent }}
            />

            {showImagePicker && (
                <ImagePickerDialog
                    isOpen={showImagePicker}
                    onClose={() => setShowImagePicker(false)}
                    currentValue={activeImageProp ? restProps[activeImageProp] : undefined}
                    onSelectPicture={handlePictureSelect}
                />
            )}
        </>
    );
};
