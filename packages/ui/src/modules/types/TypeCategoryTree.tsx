import React, { useState, useMemo, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories, Category } from '@/modules/categories/client-categories';
import { TypeDefinition } from './client-types';
import { FolderTree, ChevronRight, ChevronDown, Loader2, Box, HelpCircle, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppConfig } from '@/hooks/useSystemInfo';

export interface TypeCategoryTreeProps {
    types: TypeDefinition[];
    renderItem: (type: TypeDefinition) => React.ReactNode;
    excludeFieldTypes?: boolean;
    className?: string;
    selectedId?: string | null;
    /** Extra collapsible folders (e.g. app pickers), rendered after Primitives */
    paletteExtraFolders?: TypeCategoryPaletteExtraFolder[];
    /** Extra draggable rows appended inside the Primitives folder (after DB primitives) */
    primitivePaletteExtras?: Array<{ id: string; node: React.ReactNode }>;
}

const COLLAPSED_KEY = 'typeCategoryTreeCollapsed';

type TreeRow = {
    id: string;             // unique identifier
    isFolder: boolean;      // true for groups/categories, false for actual types
    label: string;          // Name of the folder or type
    depth: number;          // Indentation level
    icon?: React.ReactNode; // Folder icon
    isExpanded?: boolean;   // Collapse state
    typeDef?: TypeDefinition; // Payload if it's a type
    parentId: string | null;  // Reference for 'ArrowLeft' to jump to parent folder
    /** Pre-rendered node (e.g. app picker drags); mutually exclusive with typeDef for rendering */
    customContent?: React.ReactNode;
};

export type TypeCategoryPaletteExtraFolder = {
    folderId: string;
    label: string;
    icon?: React.ReactNode;
    items: Array<{ id: string; node: React.ReactNode }>;
};

/** Recursively filter a category tree by meta.type */
const filterByType = (cats: Category[], type: string): Category[] =>
    cats.reduce<Category[]>((acc, cat) => {
        if (cat.meta?.type === type) {
            const filteredChildren = cat.children
                ? filterByType(cat.children.map(rel => rel.child), type)
                    .map(child => ({ child, parent_id: cat.id }))
                : undefined;
            acc.push({ ...cat, children: filteredChildren as any });
        }
        return acc;
    }, []);

export const TypeCategoryTree: React.FC<TypeCategoryTreeProps> = ({ 
    types, 
    renderItem, 
    excludeFieldTypes = true,
    className,
    selectedId,
    paletteExtraFolders,
    primitivePaletteExtras,
}) => {
    const appConfig = useAppConfig();
    const srcLang = appConfig?.i18n?.source_language;

    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => {
        try {
            const stored = localStorage.getItem(COLLAPSED_KEY);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch { return new Set(); }
    });

    const toggleExpand = useCallback((id: string) => {
        setCollapsedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...next]));
            return next;
        });
    }, []);

    const { data: allCategories = [], isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: () => fetchCategories({ includeChildren: true, sourceLang: srcLang }),
        staleTime: 1000 * 60 * 5,
    });

    const categoryTree = useMemo(() => filterByType(allCategories, 'types'), [allCategories]);

    const rows = useMemo(() => {
        const p: TypeDefinition[] = [];
        const u: TypeDefinition[] = [];
        const c: Record<string, TypeDefinition[]> = {};

        const filteredTypes = excludeFieldTypes ? types.filter(t => t.kind !== 'field') : types;

        filteredTypes.forEach(t => {
            if (t.kind === 'primitive') {
                p.push(t);
            } else {
                const cats = t.meta?.categoryIds || [];
                if (cats.length === 0) {
                    u.push(t);
                } else {
                    cats.forEach((catId: string) => {
                        if (!c[catId]) c[catId] = [];
                        c[catId].push(t);
                    });
                }
            }
        });

        // Sort primitives slightly
        const primitiveOrder = ['string', 'int', 'float', 'bool', 'object', 'array'];
        p.sort((a, b) => {
            const ia = primitiveOrder.indexOf(a.name);
            const ib = primitiveOrder.indexOf(b.name);
            if (ia !== -1 && ib !== -1) return ia - ib;
            if (ia !== -1) return -1;
            if (ib !== -1) return 1;
            return a.name.localeCompare(b.name);
        });

        // Sort others alphabetically
        u.sort((a, b) => a.name.localeCompare(b.name));
        Object.values(c).forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name)));

        const visible: TreeRow[] = [];

        const addFolder = (id: string, label: string, icon: React.ReactNode, childrenRowsFn: () => TreeRow[], depth: number, parentId: string | null) => {
            const isExpanded = !collapsedIds.has(id);
            visible.push({ id, isFolder: true, label, icon, depth, isExpanded, parentId });
            if (isExpanded) {
                visible.push(...childrenRowsFn());
            }
        };

        const renderCatNode = (cat: Category, depth: number, parentId: string | null): TreeRow[] => {
            const typesInCat = c[cat.id] || [];
            const childCats = cat.children ? cat.children.map(rel => rel.child) : [];
            const hasChildren = childCats.length > 0 || typesInCat.length > 0;

            if (!hasChildren && typesInCat.length === 0) return []; // hide empty
            
            const catId = `cat-${cat.id}`;
            const isExpanded = !collapsedIds.has(catId);
            
            const catRows: TreeRow[] = [{
                id: catId,
                isFolder: true,
                label: cat.name,
                depth,
                icon: <FolderTree className="h-3.5 w-3.5 shrink-0" />,
                isExpanded,
                parentId
            }];

            if (isExpanded) {
                childCats.forEach(childCat => {
                    catRows.push(...renderCatNode(childCat, depth + 1, catId));
                });
                typesInCat.forEach(t => {
                    catRows.push({
                        id: `type-${cat.id}-${t.id}`,
                        isFolder: false,
                        label: t.name,
                        depth: depth + 1,
                        typeDef: t,
                        parentId: catId
                    });
                });
            }
            return catRows;
        };

        // Primitives (+ optional synthetic entries e.g. category picker)
        const primitiveExtraRows: TreeRow[] =
            primitivePaletteExtras?.map((it) => ({
                id: it.id,
                isFolder: false,
                label: '',
                depth: 1,
                parentId: 'group-primitives',
                customContent: it.node,
            })) ?? [];

        if (p.length > 0 || primitiveExtraRows.length > 0) {
            addFolder('group-primitives', 'Primitives', <Box className="h-3.5 w-3.5 shrink-0" />, () => {
                const primRows: TreeRow[] = p.map((t) => ({
                    id: `prim-${t.id}`,
                    isFolder: false,
                    label: t.name,
                    depth: 1,
                    typeDef: t,
                    parentId: 'group-primitives',
                }));
                return [...primRows, ...primitiveExtraRows];
            }, 0, null);
        }

        // App pickers & other synthetic palette entries
        paletteExtraFolders?.forEach((group) => {
            addFolder(
                group.folderId,
                group.label,
                group.icon ?? <Link2 className="h-3.5 w-3.5 shrink-0" />,
                () =>
                    group.items.map((it) => ({
                        id: it.id,
                        isFolder: false,
                        label: '',
                        depth: 1,
                        parentId: group.folderId,
                        customContent: it.node,
                    })),
                0,
                null
            );
        });

        // Categories
        categoryTree.forEach(cat => {
            visible.push(...renderCatNode(cat, 0, null));
        });

        // Uncategorized
        if (u.length > 0) {
            addFolder('group-uncategorized', 'Uncategorized', <HelpCircle className="h-3.5 w-3.5 shrink-0" />, () => {
                return u.map(t => ({
                    id: `uncat-${t.id}`,
                    isFolder: false,
                    label: t.name,
                    depth: 1,
                    typeDef: t,
                    parentId: 'group-uncategorized'
                }));
            }, 0, null);
        }

        return visible;
    }, [types, excludeFieldTypes, categoryTree, collapsedIds, paletteExtraFolders, primitivePaletteExtras]);

    const [focusIdx, setFocusIdx] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Sync selectedId from props if provided and available in rows.
    useEffect(() => {
        if (selectedId) {
            // Find the first row that represents this selectedType
            const idx = rows.findIndex(r => !r.isFolder && r.typeDef?.id === selectedId);
            if (idx >= 0) {
                setFocusIdx(idx);
            }
        }
    }, [selectedId, rows]);

    const prevRowsRef = useRef(rows);
    useLayoutEffect(() => {
        if (rows.length === 0) return;
        if (rows === prevRowsRef.current) return;
        
        prevRowsRef.current = rows;
        // Make sure focus is bounded
        const idx = Math.min(focusIdx, rows.length - 1);
        setFocusIdx(idx);
    }, [rows, focusIdx]);

    useEffect(() => {
        rowRefs.current[focusIdx]?.scrollIntoView({ block: 'nearest' });
    }, [focusIdx]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.altKey || rows.length === 0) return;
        
        switch (e.key) {
            case 'ArrowDown': {
                e.preventDefault();
                setFocusIdx(prev => (prev < rows.length - 1 ? prev + 1 : 0));
                break;
            }
            case 'ArrowUp': {
                e.preventDefault();
                setFocusIdx(prev => (prev > 0 ? prev - 1 : rows.length - 1));
                break;
            }
            case 'ArrowRight': {
                e.preventDefault();
                const row = rows[focusIdx];
                if (!row) break;
                if (row.isFolder) {
                    if (!row.isExpanded) {
                        toggleExpand(row.id);
                    } else if (focusIdx < rows.length - 1) {
                        setFocusIdx(focusIdx + 1);
                    }
                } else if (focusIdx < rows.length - 1) {
                    setFocusIdx(focusIdx + 1);
                }
                break;
            }
            case 'ArrowLeft': {
                e.preventDefault();
                const row = rows[focusIdx];
                if (!row) break;
                if (row.isFolder && row.isExpanded) {
                    toggleExpand(row.id);
                } else if (row.parentId) {
                    const parentIdx = rows.findIndex(r => r.id === row.parentId);
                    if (parentIdx >= 0) {
                        setFocusIdx(parentIdx);
                    }
                }
                break;
            }
            case 'Enter': 
            case ' ': {
                e.preventDefault();
                const row = rows[focusIdx];
                if (!row) break;
                if (row.isFolder) {
                    toggleExpand(row.id);
                } else {
                    const el = rowRefs.current[focusIdx]?.querySelector('button, [role="button"]') as HTMLElement;
                    el?.click();
                }
                break;
            }
        }
    }, [rows, focusIdx, toggleExpand]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div 
            ref={containerRef}
            className={cn("flex flex-col select-none outline-none focus-visible:ring-1 focus-visible:ring-primary/50 rounded-md", className)}
            tabIndex={0}
            onKeyDown={handleKeyDown}
        >
            {rows.map((row, idx) => {
                const isFocused = idx === focusIdx;
                
                if (row.isFolder) {
                    return (
                        <div 
                            key={row.id}
                            ref={el => rowRefs.current[idx] = el}
                            onClick={() => {
                                setFocusIdx(idx);
                                toggleExpand(row.id);
                                containerRef.current?.focus({ preventScroll: true });
                            }}
                            className={cn(
                                "flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer transition-colors border-l-2 border-transparent my-[1px]",
                                isFocused ? "bg-muted border-primary text-foreground" : "hover:bg-muted/60"
                            )}
                            style={{ paddingLeft: `${8 + row.depth * 14}px` }}
                        >
                            <button className="shrink-0 p-0.5 rounded hover:bg-muted focus:outline-none">
                                {row.isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            </button>
                            {row.icon}
                            <span className="truncate">{row.label}</span>
                        </div>
                    );
                }

                // Node is a type layout wrapper or custom palette slot
                return (
                    <div 
                        key={row.id}
                        ref={el => rowRefs.current[idx] = el}
                        onClick={() => {
                            setFocusIdx(idx);
                            containerRef.current?.focus({ preventScroll: true });
                        }}
                        className={cn(
                            "group rounded-sm border-l-2 border-transparent relative my-[1px]",
                            isFocused ? "border-primary before:absolute before:inset-0 before:bg-muted/50 before:-z-10 before:rounded-sm" : ""
                        )}
                        style={{ paddingLeft: `${8 + row.depth * 14}px`, paddingRight: '8px', paddingTop: '2px', paddingBottom: '2px' }}
                    >
                        {row.customContent ?? (row.typeDef ? renderItem(row.typeDef) : null)}
                    </div>
                );
            })}
        </div>
    );
};
