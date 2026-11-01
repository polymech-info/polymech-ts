import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories, type Category } from '@/modules/categories/client-categories';
import { useAppConfig } from '@/hooks/useSystemInfo';
import { T, translate } from '@/i18n';
import { FolderTree, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';

/** Flatten category tree with depth for hierarchical display */
const flattenCategories = (cats: Category[], depth = 0): Array<Category & { depth: number }> => {
    const result: Array<Category & { depth: number }> = [];
    for (const cat of cats) {
        result.push({ ...cat, depth });
        if (cat.children && cat.children.length > 0) {
            for (const rel of cat.children) {
                result.push(...flattenCategories([rel.child], depth + 1));
            }
        }
    }
    return result;
};

export interface CategoryPickerFieldProps {
    /** Currently selected category ID */
    value: string;
    /** Called when a category is selected */
    onSelect: (categoryId: string) => void;
    /** Optional: only show categories whose meta.type matches */
    filterType?: string;
}

export const CategoryPickerField: React.FC<CategoryPickerFieldProps> = ({
    value,
    onSelect,
    filterType,
}) => {
    const appConfig = useAppConfig();
    const srcLang = appConfig?.i18n?.source_language;
    const [open, setOpen] = useState(false);

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: () => fetchCategories({ includeChildren: true, sourceLang: srcLang }),
        staleTime: 1000 * 60 * 5,
    });

    const flatCats = useMemo(() => {
        let cats = categories;
        if (filterType) {
            cats = cats.filter(c => c.meta?.type === filterType);
        }
        return flattenCategories(cats);
    }, [categories, filterType]);

    const selectedCategory = useMemo(
        () => flatCats.find(c => c.id === value),
        [flatCats, value]
    );

    const handleSelect = useCallback((id: string) => {
        onSelect(id === value ? '' : id);
        setOpen(false);
    }, [value, onSelect]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 justify-between text-xs font-normal"
                    role="combobox"
                    aria-expanded={open}
                >
                    <span className="flex items-center gap-1.5 truncate">
                        <FolderTree className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {selectedCategory?.name || translate('Select category...')}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={translate('Search categories...')} />
                    <CommandList>
                        <CommandEmpty><T>No categories found</T></CommandEmpty>
                        <CommandGroup>
                            {flatCats.map(cat => (
                                <CommandItem
                                    key={cat.id}
                                    value={cat.name}
                                    onSelect={() => handleSelect(cat.id)}
                                    className="text-sm"
                                >
                                    <span
                                        className="truncate"
                                        style={{ paddingLeft: `${cat.depth * 12}px` }}
                                    >
                                        {cat.name}
                                    </span>
                                    {cat.id === value && (
                                        <Check className="ml-auto h-4 w-4 shrink-0" />
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
