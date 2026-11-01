import { useQuery } from "@tanstack/react-query";
import { fetchCategories, type Category } from "@/modules/categories/client-categories";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useCallback, useMemo } from "react";
import { FolderTree, ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAppConfig } from '@/hooks/useSystemInfo';

interface CategoryTreeViewProps {
    /** Called after a category is selected (useful for closing mobile sheet) */
    onNavigate?: () => void;
    /** Only show categories whose meta.type matches this value */
    filterType?: string;
}

const COLLAPSED_KEY = 'categoryTreeCollapsed';

/** Recursively filter a category tree by meta.type */
const filterByType = (cats: Category[], type: string): Category[] =>
    cats.reduce<Category[]>((acc, cat) => {
        if (cat.meta?.type === type) {
            // Category matches — include it, but also filter its children
            const filteredChildren = cat.children
                ? cat.children.filter(rel => !rel.child.meta?.type || rel.child.meta.type === type)
                : undefined;
            acc.push({ ...cat, children: filteredChildren });
        }
        return acc;
    }, []);

const CategoryTreeView = ({ onNavigate, filterType }: CategoryTreeViewProps) => {
    const params = useParams();
    const wildcardPath = params['*'];
    const activeSlug = wildcardPath ? wildcardPath.split('/').filter(Boolean).pop() : undefined;
    const navigate = useNavigate();

    // Track explicitly collapsed nodes (everything else is expanded by default)
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => {
        try {
            const stored = localStorage.getItem(COLLAPSED_KEY);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch { return new Set(); }
    });

    const appConfig = useAppConfig();
    const srcLang = appConfig?.i18n?.source_language;

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: () => fetchCategories({ includeChildren: true, sourceLang: srcLang }),
        staleTime: 1000 * 60 * 5,
    });

    const filteredCategories = useMemo(
        () => filterType ? filterByType(categories, filterType) : categories,
        [categories, filterType]
    );

    const toggleExpand = useCallback((id: string) => {
        setCollapsedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...next]));
            return next;
        });
    }, []);

    const handleSelect = useCallback((slug: string | null) => {
        if (slug) {
            navigate(`/categories/${slug}`);
        } else {
            navigate('/');
        }
        onNavigate?.();
    }, [navigate, onNavigate]);

    const renderNode = (cat: Category, depth: number = 0, parentPath: string = '') => {
        const fullPath = parentPath ? `${parentPath}/${cat.slug}` : cat.slug;
        const hasChildren = cat.children && cat.children.length > 0;
        const isActive = cat.slug === activeSlug;
        const isExpanded = hasChildren && !collapsedIds.has(cat.id);

        return (
            <div key={cat.id}>
                <Collapsible open={isExpanded} onOpenChange={() => hasChildren && toggleExpand(cat.id)}>
                    <div
                        className={cn(
                            "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors",
                            "hover:bg-muted/60",
                            isActive && "bg-primary/10 text-primary font-medium",
                        )}
                        style={{ paddingLeft: `${8 + depth * 14}px` }}
                    >
                        {/* Expand/collapse chevron */}
                        {hasChildren ? (
                            <CollapsibleTrigger asChild>
                                <button
                                    className="shrink-0 p-0.5 rounded hover:bg-muted"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {isExpanded
                                        ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                        : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                    }
                                </button>
                            </CollapsibleTrigger>
                        ) : (
                            <span className="w-[18px] shrink-0" /> /* spacer */
                        )}

                        {/* Category label — clickable to navigate */}
                        <button
                            className="flex items-center gap-1.5 truncate text-left flex-1 min-w-0"
                            onClick={() => handleSelect(fullPath)}
                        >
                            <FolderTree className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                            <span className="truncate">{cat.name}</span>
                        </button>
                    </div>

                    {hasChildren && (
                        <CollapsibleContent>
                            {cat.children!.map(rel => renderNode(rel.child, depth + 1, fullPath))}
                        </CollapsibleContent>
                    )}
                </Collapsible>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <nav className="flex flex-col gap-0.5 py-2 text-sm select-none">
            {/* Category tree */}
            {filteredCategories.map(cat => renderNode(cat))}
        </nav>
    );
};

export default CategoryTreeView;
