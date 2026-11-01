import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories, type Category } from '@/modules/categories/client-categories';
import { useAppConfig } from '@/hooks/useSystemInfo';
import HomeWidget, { type HomeWidgetProps } from '@/components/widgets/HomeWidget';
import { CategoryPickerField } from '@/components/widgets/CategoryPickerField';
import { T, translate } from '@/i18n';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export interface CategoryFeedWidgetProps extends HomeWidgetProps {
    /** Content type filter (passed to HomeWidget as `initialContentType`) */
    filterType?: 'posts' | 'pages' | 'pictures';
    /** Show picture/post title on feed cards (HomeWidget; default true). */
    showTitle?: boolean;
    /** Show picture/post description on feed cards (HomeWidget; default false). */
    showDescription?: boolean;
    [key: string]: any;
}

/** Flatten category tree to find a category by ID */
const findCategoryById = (cats: Category[], id: string): Category | undefined => {
    for (const cat of cats) {
        if (cat.id === id) return cat;
        if (cat.children) {
            for (const rel of cat.children) {
                const found = findCategoryById([rel.child], id);
                if (found) return found;
            }
        }
    }
    return undefined;
};

const CategoryFeedWidget: React.FC<CategoryFeedWidgetProps> = ({
    categoryId,
    heading = '',
    headingLevel = 'h2',
    filterType,
    isEditMode = false,
    onPropsChange,
    // HomeWidget pass-through props
    sortBy,
    viewMode,
    showCategories,
    categorySlugs: propCategorySlugs,
    userId,
    showSortBar,
    showLayoutToggles,
    showFooter,
    center,
    columns,
    showTitle,
    showDescription,
    showAuthor,
    showSocial,
    variables,
    searchQuery,
    fillHeight,
    ...rest
}) => {
    const appConfig = useAppConfig();
    const srcLang = appConfig?.i18n?.source_language;

    // Fetch categories to resolve slug from ID
    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: () => fetchCategories({ includeChildren: true, sourceLang: srcLang }),
        staleTime: 1000 * 60 * 5,
    });

    // Resolve slug from selected categoryId, fall back to inherited categorySlugs prop
    const selectedCategory = useMemo(
        () => categoryId ? findCategoryById(categories, categoryId) : undefined,
        [categories, categoryId]
    );

    const categorySlugs = selectedCategory?.slug || propCategorySlugs || '';

    // Build heading element
    const HeadingTag = headingLevel || 'h2';
    const headingClasses = cn(
        'font-bold text-foreground',
        HeadingTag === 'h1' && 'text-3xl lg:text-4xl',
        HeadingTag === 'h2' && 'text-2xl lg:text-3xl',
        HeadingTag === 'h3' && 'text-xl lg:text-2xl',
        HeadingTag === 'h4' && 'text-lg lg:text-xl',
    );

    const renderHeading = () => {
        if (isEditMode) {
            return (
                <div className="px-4 pt-4 pb-2 flex flex-col gap-2">
                    {/* Heading text input */}
                    <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap w-16">
                            <T>Heading</T>
                        </Label>
                        <Input
                            value={heading}
                            onChange={(e) => onPropsChange?.({ heading: e.target.value })}
                            placeholder={translate('Section heading...')}
                            className="h-8 text-sm"
                        />
                    </div>

                    {/* Heading level selector */}
                    <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap w-16">
                            <T>Level</T>
                        </Label>
                        <Select
                            value={headingLevel}
                            onValueChange={(v) => onPropsChange?.({ headingLevel: v })}
                        >
                            <SelectTrigger className="h-8 w-24 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="h1">H1</SelectItem>
                                <SelectItem value="h2">H2</SelectItem>
                                <SelectItem value="h3">H3</SelectItem>
                                <SelectItem value="h4">H4</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Content type filter */}
                    <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap w-16">
                            <T>Filter</T>
                        </Label>
                        <Select
                            value={filterType || 'all'}
                            onValueChange={(v) => onPropsChange?.({ filterType: v === 'all' ? undefined : v })}
                        >
                            <SelectTrigger className="h-8 w-32 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all"><T>All</T></SelectItem>
                                <SelectItem value="posts"><T>Posts</T></SelectItem>
                                <SelectItem value="pages"><T>Pages</T></SelectItem>
                                <SelectItem value="pictures"><T>Pictures</T></SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Category picker */}
                    <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap w-16">
                            <T>Category</T>
                        </Label>
                        <CategoryPickerField
                            value={categoryId || ''}
                            onSelect={(id) => onPropsChange?.({ categoryId: id })}
                        />
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
                        <Label className="text-xs text-muted-foreground"><T>Show Title</T></Label>
                        <Switch
                            checked={showTitle !== false}
                            onCheckedChange={(v) => onPropsChange?.({ showTitle: v })}
                        />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs text-muted-foreground"><T>Show Description</T></Label>
                        <Switch
                            checked={!!showDescription}
                            onCheckedChange={(v) => onPropsChange?.({ showDescription: v })}
                        />
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div>
            {renderHeading()}
            <HomeWidget
                sortBy={sortBy}
                viewMode={viewMode}
                showCategories={showCategories}
                categorySlugs={categorySlugs}
                categoryId={categoryId}
                userId={userId}
                showSortBar={showSortBar}
                showLayoutToggles={showLayoutToggles}
                showFooter={showFooter}
                showTitle={showTitle}
                showDescription={showDescription}
                showAuthor={showAuthor}
                showSocial={showSocial}
                center={center}
                columns={columns === 'auto' ? 'auto' : (Number(columns) || 4)}
                variables={variables}
                searchQuery={searchQuery}
                initialContentType={filterType}
                heading={heading}
                headingLevel={headingLevel}
                fillHeight={fillHeight}
            />
        </div>
    );
};

export default CategoryFeedWidget;
