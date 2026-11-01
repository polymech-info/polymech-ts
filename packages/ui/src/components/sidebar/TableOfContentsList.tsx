import React, { useState, useEffect } from 'react';
import { TocItem } from '@/lib/toc';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { T, translate } from '@/i18n';

interface TableOfContentsListProps {
    toc: TocItem[];
    depth?: number;
    isMobile?: boolean;
    activeId?: string;
    defaultOpen?: boolean;
}

export function TableOfContentsList({
    toc,
    depth = 0,
    isMobile = false,
    activeId,
    defaultOpen = false
}: TableOfContentsListProps) {
    if (!toc || toc.length === 0) return null;

    return (
        <ul className={cn(
            "m-0 p-0 list-none",
            isMobile ? "flex flex-col gap-1" : "",
            depth > 0 && !isMobile ? "border-l border-border ml-[11px] pl-2" : "" // Vertical guide line
        )}>
            {toc.map((heading, index) => (
                <TocItemRenderer
                    key={`${heading.slug}-${index}`}
                    heading={heading}
                    depth={depth}
                    isMobile={isMobile}
                    activeId={activeId}
                    defaultOpen={defaultOpen}
                />
            ))}
        </ul>
    );
}

function TocItemRenderer({
    heading,
    depth,
    isMobile,
    activeId,
    defaultOpen
}: {
    heading: TocItem,
    depth: number,
    isMobile: boolean,
    activeId?: string,
    defaultOpen: boolean
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen || depth < 1); // Expand root items by default
    const hasChildren = heading.children.length > 0;

    // Check if this item matches active ID directly
    const isActive = activeId === heading.slug;
    const itemRef = React.useRef<HTMLDivElement>(null);

    // Check if any child is active (to auto-expand)
    const isChildActive = React.useMemo(() => {
        const checkActive = (items: TocItem[]): boolean => {
            return items.some(item => item.slug === activeId || checkActive(item.children));
        };
        return checkActive(heading.children);
    }, [heading.children, activeId]);

    useEffect(() => {
        if (isChildActive || defaultOpen) {
            setIsOpen(true);
        }
    }, [isChildActive, defaultOpen]);

    const handleToggle = (e: React.MouseEvent) => {
        if (hasChildren) {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
        }
    };

    return (
        <li className="m-0 p-0">
            <div
                ref={itemRef}
                className={cn(
                    "group flex items-start py-1 px-2 text-sm transition-colors rounded-sm hover:bg-muted/50 my-0.5",
                    isActive ? "bg-muted/30 text-primary font-medium" : "text-muted-foreground"
                )}
            >
                {/* Active Indicator Line (Left Overlay) */}
                {isActive && (
                    <div className="absolute left-[11px] w-[2px] h-6 bg-primary -ml-[1px] rounded-full" style={{ left: '0px', position: 'absolute' }} />
                )}

                {isActive && !isMobile && (
                    <div className="absolute left-0 w-[2px] h-[28px] bg-primary rounded-r-md -ml-[1px] mt-[-2px]" />
                )}

                {/* Indent / Icon */}
                <button
                    onClick={handleToggle}
                    className={cn(
                        "mt-[2px] mr-1.5 shrink-0 p-0.5 rounded-sm hover:bg-muted-foreground/10 transition-colors",
                        !hasChildren && "invisible pointer-events-none"
                    )}
                    aria-label={isOpen ? translate("Collapse") : translate("Expand")}
                >
                    {hasChildren ? (
                        isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
                    ) : (
                        <div className="w-3.5 h-3.5" />
                    )}
                </button>

                <a
                    href={`#${heading.slug}`}
                    className="flex-1 min-w-0 break-words font-sans leading-snug pt-0.5"
                    onClick={(e) => isMobile && e.stopPropagation()}
                >
                    <T>{heading.text}</T>
                </a>
            </div>

            {hasChildren && isOpen && (
                <TableOfContentsList
                    toc={heading.children}
                    depth={depth + 1}
                    isMobile={isMobile}
                    activeId={activeId}
                    defaultOpen={defaultOpen}
                />
            )}
        </li>
    );
}
