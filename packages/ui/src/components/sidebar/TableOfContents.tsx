import React, { useMemo } from 'react';
import { MarkdownHeading, generateToC } from '@/lib/toc';
import { TableOfContentsList } from './TableOfContentsList';
import { T, translate } from '@/i18n';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface TableOfContentsProps {
    headings: MarkdownHeading[];
    title?: string;
    minHeadingLevel?: number;
    maxHeadingLevel?: number;
}

export function TableOfContents({
    headings,
    title = "On this page",
    minHeadingLevel = 2,
    maxHeadingLevel = 4,
    className
}: TableOfContentsProps & { className?: string }) {

    const [searchQuery, setSearchQuery] = React.useState('');
    const [activeId, setActiveId] = React.useState<string>('');

    // Generate full TOC
    const fullToc = useMemo(() => {
        return generateToC(headings, {
            minHeadingLevel,
            maxHeadingLevel,
            title
        });
    }, [headings, minHeadingLevel, maxHeadingLevel, title]);

    // Filter TOC based on search
    const filteredToc = useMemo(() => {
        if (!searchQuery.trim()) return fullToc;

        const query = searchQuery.toLowerCase();

        const filterTree = (items: typeof fullToc): typeof fullToc => {
            return items.map(item => {
                const updatedChildren = filterTree(item.children);
                const matches = item.text.toLowerCase().includes(query) || updatedChildren.length > 0;

                if (matches) {
                    return { ...item, children: updatedChildren };
                }
                return null;
            }).filter(Boolean) as typeof fullToc;
        };

        return filterTree(fullToc);
    }, [fullToc, searchQuery]);

    // Scroll Spy
    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: '-20% 0px -35% 0px' }
        );

        headings.forEach(({ slug }) => {
            const element = document.getElementById(slug);
            if (element) observer.observe(element);
        });

        // Also observe 'top' if it exists (usually mapped to title in generating TOC)
        const top = document.getElementById('_top');
        if (top) observer.observe(top);

        return () => observer.disconnect();
    }, [headings]);

    if (!fullToc || fullToc.length === 0) return null;

    return (
        <div className={className}>
            <div className="relative mb-4 px-2">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={translate("Search page or heading...")}
                    className="h-8 pl-8 text-xs bg-muted/50 border-input/60 focus-visible:ring-1"
                    autoFocus={false}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    tabIndex={-1}
                />
            </div>

            <nav className="text-sm">
                <TableOfContentsList
                    toc={filteredToc}
                    activeId={activeId}
                    defaultOpen={!!searchQuery} // Expand all when searching
                />
            </nav>
        </div>
    );
}
