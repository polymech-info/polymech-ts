import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchCategories, createCategory, updateCategory, deleteCategory, Category } from "@/modules/categories/client-categories";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, FolderTree, Link as LinkIcon, Check, X, Loader2, Hash, Languages, Shield } from "lucide-react";
import { ACLEditorContent } from "@/modules/acl/ACLEditorContent";
import CollapsibleSection from "@/components/CollapsibleSection";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { T, translate } from "@/i18n";
import { VariablesEditor } from '@/components/variables/VariablesEditor';
import { updatePageMeta } from "@/modules/pages/client-pages";
import { fetchTypes } from "@/modules/types/client-types";
import { CategoryTranslationDialog } from "@/modules/i18n/CategoryTranslationDialog";
import { useAppConfig } from '@/hooks/useSystemInfo';
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CategoryManagerProps {
    isOpen: boolean;
    onClose: () => void;
    currentPageId?: string; // If provided, allows linking page to category
    currentPageMeta?: any;
    onPageMetaUpdate?: (newMeta: any, newCategories?: Category[]) => void;
    filterByType?: string; // Filter categories by meta.type (e.g., 'layout', 'page', 'email')
    defaultMetaType?: string; // Default type to set in meta when creating new categories
    /** Picker mode: simplified view for selecting categories */
    mode?: 'manage' | 'pick';
    /** Called in pick mode when user confirms selection */
    onPick?: (categoryIds: string[], categories?: Category[]) => void;
    /** Pre-selected category IDs for pick mode */
    selectedCategoryIds?: string[];
    /** If true, renders as a standalone view rather than a Dialog */
    asView?: boolean;
}

export const CategoryManager = ({ isOpen, onClose, currentPageId, currentPageMeta, onPageMetaUpdate, filterByType, defaultMetaType, mode = 'manage', onPick, selectedCategoryIds: externalSelectedIds, asView }: CategoryManagerProps) => {
    const [actionLoading, setActionLoading] = useState(false);
    const { user } = useAuth();
    const systemUserId = import.meta.env.VITE_SYSTEM_USER_ID;
    const [ownershipTab, setOwnershipTab] = useState<'system'|'own'>('system');

    // Entity Types selector state
    const envTypes = import.meta.env.VITE_ENTITY_TYPES;
    const ENTITY_TYPES = envTypes ? ['all', ...envTypes.split(',').map(s => s.trim())] : ['all', 'pages', 'posts', 'pictures', 'types', 'products'];
    const [activeFilter, setActiveFilter] = useState<string>(filterByType || 'all');

    // Selection state
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    // Picker mode state
    const [pickerSelectedIds, setPickerSelectedIds] = useState<string[]>(externalSelectedIds || []);

    // Editing/Creating state
    const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [creationParentId, setCreationParentId] = useState<string | null>(null);
    const [showVariablesEditor, setShowVariablesEditor] = useState(false);
    const [showTranslationDialog, setShowTranslationDialog] = useState(false);
    const appConfig = useAppConfig();
    const srcLang = appConfig?.i18n?.source_language;

    // Initial linked category from page meta
    const getLinkedCategoryIds = (): string[] => {
        if (!currentPageMeta) return [];
        if (Array.isArray(currentPageMeta.categoryIds)) return currentPageMeta.categoryIds;
        if (currentPageMeta.categoryId) return [currentPageMeta.categoryId];
        return [];
    };

    const linkedCategoryIds = getLinkedCategoryIds();

    // React Query Integration
    const { data: categories = [], isLoading: loading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const data = await fetchCategories({ includeChildren: true, sourceLang: srcLang });
            // Only show root-level categories (those without a parent)
            return data.filter(cat => !cat.parent_category_id);
        }
    });

    const { data: types = [] } = useQuery({
        queryKey: ['types', 'assignable'],
        queryFn: async () => {
            const allTypes = await fetchTypes();
            // Filter for structures and aliases as requested
            return allTypes.filter(t => t.kind === 'structure' || t.kind === 'alias');
        }
    });

    const handleCreateStart = (parentId: string | null = null) => {
        setIsCreating(true);
        setCreationParentId(parentId);
        setEditingCategory({
            name: "",
            slug: "",
            description: "",
            visibility: "public"
        });
    };

    const handleEditStart = (category: Category) => {
        setIsCreating(false);
        setEditingCategory({ ...category });
    };

    const queryClient = useQueryClient();

    const handleSave = async () => {
        if (!editingCategory || !editingCategory.name || !editingCategory.slug) {
            toast.error(translate("Name and Slug are required"));
            return;
        }

        setActionLoading(true);
        try {
            if (isCreating) {
                // Apply default meta type if provided
                const categoryData: any = {
                    ...editingCategory,
                    parentId: creationParentId || undefined,
                    relationType: 'generalization'
                };

                // Set meta.type if defaultMetaType is provided or derived from activeFilter
                const targetType = defaultMetaType || (activeFilter !== 'all' ? activeFilter : undefined);
                if (targetType) {
                    categoryData.meta = {
                        ...(categoryData.meta || {}),
                        type: targetType
                    };
                }

                await createCategory(categoryData);
                toast.success(translate("Category created"));
            } else if (editingCategory.id) {
                await updateCategory(editingCategory.id, editingCategory);
                toast.success(translate("Category updated"));
            }
            setEditingCategory(null);
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        } catch (error) {
            console.error(error);
            toast.error(isCreating ? translate("Failed to create category") : translate("Failed to update category"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(translate("Are you sure you want to delete this category?"))) return;

        setActionLoading(true);
        try {
            await deleteCategory(id);
            toast.success(translate("Category deleted"));
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            if (selectedCategoryId === id) setSelectedCategoryId(null);
        } catch (error) {
            console.error(error);
            toast.error(translate("Failed to delete category"));
        } finally {
            setActionLoading(false);
        }
    };

    // Helper to find category in tree
    const findCategory = (id: string, cats: Category[]): Category | null => {
        for (const cat of cats) {
            if (cat.id === id) return cat;
            if (cat.children) {
                const found = cat.children.find(rel => rel.child.id === id)?.child;
                if (found) return found; // Direct child match

                // Deep search in children's children not strictly needed if flattened? 
                // Using recursive search on children
                const deep = cat.children.map(c => findCategory(id, [c.child])).find(c => c);
                if (deep) return deep;
            }
        }
        return null;
    };

    // Flatten categories for easy lookup
    const getAllCategoriesFlattened = (cats: Category[]): Category[] => {
        let flat: Category[] = [];
        cats.forEach(c => {
            flat.push(c);
            if (c.children) {
                c.children.forEach(childRel => {
                    flat = [...flat, ...getAllCategoriesFlattened([childRel.child])];
                });
            }
        });
        return flat;
    };

    const handleLinkPage = async () => {
        if (!currentPageId || !selectedCategoryId) return;

        const currentIds = getLinkedCategoryIds();
        if (currentIds.includes(selectedCategoryId)) return;

        setActionLoading(true);
        try {
            const newIds = [...currentIds, selectedCategoryId];
            const newMeta = { ...currentPageMeta, categoryIds: newIds, categoryId: null };

            // Resolve category objects
            const allCats = getAllCategoriesFlattened(categories);
            const resolvedCategories = newIds.map(id => findCategory(id, categories) || allCats.find(c => c.id === id)).filter(Boolean) as Category[];

            // Use callback if provided, otherwise fall back to updatePageMeta
            if (onPageMetaUpdate) {
                await onPageMetaUpdate(newMeta, resolvedCategories);
            } else {
                await updatePageMeta(currentPageId, { categoryIds: newIds, categoryId: null });
            }

            toast.success(translate("Added to category"));
        } catch (error) {
            console.error(error);
            toast.error(translate("Failed to link"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnlinkPage = async () => {
        if (!currentPageId || !selectedCategoryId) return;

        const currentIds = getLinkedCategoryIds();
        if (!currentIds.includes(selectedCategoryId)) return;

        setActionLoading(true);
        try {
            const newIds = currentIds.filter(id => id !== selectedCategoryId);
            const newMeta = { ...currentPageMeta, categoryIds: newIds, categoryId: null };

            // Resolve category objects
            const allCats = getAllCategoriesFlattened(categories);
            const resolvedCategories = newIds.map(id => findCategory(id, categories) || allCats.find(c => c.id === id)).filter(Boolean) as Category[];

            // Use callback if provided, otherwise fall back to updatePageMeta
            if (onPageMetaUpdate) {
                await onPageMetaUpdate(newMeta, resolvedCategories);
            } else {
                await updatePageMeta(currentPageId, { categoryIds: newIds, categoryId: null });
            }

            toast.success(translate("Removed from category"));
        } catch (error) {
            console.error(error);
            toast.error(translate("Failed to unlink"));
        } finally {
            setActionLoading(false);
        }
    };

    // Picker mode: toggle category in selection
    const togglePickerCategory = (catId: string) => {
        setPickerSelectedIds(prev =>
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        );
    };

    // Render Logic
    const renderPickerItem = (cat: Category, level: number = 0): React.ReactNode => {
        const isPicked = pickerSelectedIds.includes(cat.id);
        return (
            <div key={cat.id}>
                <div
                    className={cn(
                        "flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer",
                        isPicked && "bg-primary/10"
                    )}
                    style={{ marginLeft: `${level * 16}px` }}
                    onClick={() => togglePickerCategory(cat.id)}
                >
                    <Checkbox checked={isPicked} onCheckedChange={() => togglePickerCategory(cat.id)} />
                    <FolderTree className="h-3 w-3 text-muted-foreground opacity-50" />
                    <span className={cn("text-sm", isPicked && "font-semibold text-primary")}>{cat.name}</span>
                </div>
                {cat.children
                    ?.filter(childRel => activeFilter === 'all' || (childRel.child as any).meta?.type === activeFilter)
                    .map(childRel => renderPickerItem(childRel.child, level + 1))
                }
            </div>
        );
    };

    const renderCategoryItem = (cat: Category, level: number = 0) => {
        const isSelected = selectedCategoryId === cat.id;
        const isLinked = linkedCategoryIds.includes(cat.id);

        return (
            <div key={cat.id}>
                <div
                    className={cn(
                        "flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer group",
                        isSelected && "bg-muted",
                        isLinked && !isSelected && "bg-primary/5"
                    )}
                    style={{ marginLeft: `${level * 16}px` }}
                    onClick={() => {
                        setSelectedCategoryId(cat.id);
                    }}
                >
                    <div className="flex items-center gap-2">
                        {isLinked ? (
                            <Check className="h-4 w-4 text-primary" />
                        ) : (
                            <FolderTree className="h-3 w-3 text-muted-foreground opacity-50" />
                        )}
                        <span className={cn("text-sm", isLinked && "font-semibold text-primary")}>{cat.name}</span>
                        <span className="text-xs text-muted-foreground">({cat.slug})</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleCreateStart(cat.id); }}>
                            <Plus className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleEditStart(cat); }}>
                            <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => handleDelete(cat.id, e)}>
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
                {cat.children
                    ?.filter(childRel => activeFilter === 'all' || (childRel.child as any).meta?.type === activeFilter)
                    .map(childRel => renderCategoryItem(childRel.child, level + 1))
                }
            </div>
        );
    };

    // Picker mode: simplified dialog
    if (mode === 'pick') {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-lg max-h-[70vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle><T>Select Categories</T></DialogTitle>
                        <DialogDescription>
                            <T>Choose one or more categories for your page.</T>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="px-1 py-2">
                        <Tabs value={ownershipTab} onValueChange={(val: any) => setOwnershipTab(val)} className="w-full">
                            <TabsList className="h-8 w-full justify-start rounded-md bg-muted p-1">
                                <TabsTrigger value="system" className="text-xs px-4 py-1"><T>System</T></TabsTrigger>
                                <TabsTrigger value="own" className="text-xs px-4 py-1"><T>Own</T></TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                    <div className="flex-1 overflow-y-auto min-h-0 border rounded-md p-2">
                        {loading ? (
                            <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                        ) : (
                            <div className="space-y-1">
                                {categories
                                    .filter(cat => ownershipTab === 'system' ? cat.owner_id === systemUserId : cat.owner_id === user?.id)
                                    .map(cat => renderPickerItem(cat))}
                                {categories.filter(cat => ownershipTab === 'system' ? cat.owner_id === systemUserId : cat.owner_id === user?.id).length === 0 && <div className="text-center text-sm text-muted-foreground py-8"><T>No categories found.</T></div>}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose}><T>Cancel</T></Button>
                        <Button onClick={() => { onPick?.(pickerSelectedIds, categories.flatMap(c => [c, ...(c.children || []).map(r => r.child)])); onClose(); }}><T>Done</T></Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    const innerContent = (
        <>
            <div className={asView ? "mb-4" : "mb-4"}>
                {asView ? (
                    <div>
                        <h2 className="text-lg font-semibold"><T>Category Manager</T></h2>
                        <p className="text-sm text-muted-foreground"><T>Manage categories and organize your content structure.</T></p>
                    </div>
                ) : (
                    <DialogHeader>
                        <DialogTitle><T>Category Manager</T></DialogTitle>
                        <DialogDescription>
                            <T>Manage categories and organize your content structure.</T>
                        </DialogDescription>
                    </DialogHeader>
                )}
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
                {/* Left: Category Tree */}
                <div className="flex-1 border rounded-md p-2 overflow-y-auto min-h-0 basis-[60%] md:basis-auto">
                    <div className="flex justify-between items-center mb-2 px-2 gap-2">
                        <Tabs value={ownershipTab} onValueChange={(val: any) => setOwnershipTab(val)} className="-ml-2">
                            <TabsList className="h-8 bg-transparent">
                                <TabsTrigger value="system" className="text-xs px-3 py-1 data-[state=active]:bg-muted"><T>System</T></TabsTrigger>
                                <TabsTrigger value="own" className="text-xs px-3 py-1 data-[state=active]:bg-muted"><T>Own</T></TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <div className="flex items-center gap-2">
                            {(!filterByType) && (
                                <Select value={activeFilter} onValueChange={setActiveFilter}>
                                    <SelectTrigger className="h-8 w-[120px]">
                                        <SelectValue placeholder="Type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ENTITY_TYPES.map(t => (
                                            <SelectItem key={t} value={t}><T>{t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</T></SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleCreateStart(null)}>
                                <Plus className="h-3 w-3 mr-1" />
                                <T>Root Category</T>
                            </Button>
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : (
                        <div className="space-y-1">
                            {categories
                                .filter(cat => activeFilter === 'all' || (cat as any).meta?.type === activeFilter)
                                .filter(cat => ownershipTab === 'system' ? cat.owner_id === systemUserId : cat.owner_id === user?.id)
                                .map(cat => renderCategoryItem(cat))}
                            {categories
                                .filter(cat => activeFilter === 'all' || (cat as any).meta?.type === activeFilter)
                                .filter(cat => ownershipTab === 'system' ? cat.owner_id === systemUserId : cat.owner_id === user?.id)
                                .length === 0 && <div className="text-center text-sm text-muted-foreground py-8"><T>No categories found.</T></div>}
                        </div>
                    )}
                </div>

                {/* Right: Editor or Actions */}
                <div className="border rounded-md p-4 flex flex-col gap-4 overflow-y-auto bg-muted/10 w-full md:w-[450px] border-t md:border-l-0 md:border-l min-h-[50%] md:min-h-0">
                    {editingCategory ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-sm">{isCreating ? translate("New Category") : translate("Edit Category")}</h3>
                                <Button variant="ghost" size="sm" onClick={() => setEditingCategory(null)}><X className="h-4 w-4" /></Button>
                            </div>
                            <div className="space-y-2">
                                <Label><T>Name</T></Label>
                                <Input
                                    value={editingCategory.name}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        const slug = isCreating ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : editingCategory.slug;
                                        setEditingCategory({ ...editingCategory, name, slug })
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label><T>Slug</T></Label>
                                <Input
                                    value={editingCategory.slug}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label><T>Visibility</T></Label>
                                <Select
                                    value={editingCategory.visibility}
                                    onValueChange={(val: any) => setEditingCategory({ ...editingCategory, visibility: val })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="public"><T>Public</T></SelectItem>
                                        <SelectItem value="unlisted"><T>Unlisted</T></SelectItem>
                                        <SelectItem value="private"><T>Private</T></SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Input
                                    value={editingCategory.description || ''}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label><T>Variables</T></Label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => setShowVariablesEditor(true)}
                                    >
                                        <Hash className="mr-2 h-4 w-4" />
                                        <T>Manage Variables</T>
                                        {editingCategory.meta?.variables && Object.keys(editingCategory.meta.variables).length > 0 && (
                                            <span className="ml-auto text-xs text-muted-foreground">
                                                {Object.keys(editingCategory.meta.variables).length} defined
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label><T>Assigned Types</T></Label>
                                <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-2">
                                    {types.length === 0 && <div className="text-xs text-muted-foreground p-1"><T>No assignable types found.</T></div>}
                                    {types.map(type => (
                                        <div key={type.id} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`type-${type.id}`}
                                                checked={(editingCategory.meta?.assignedTypes || []).includes(type.id)}
                                                onCheckedChange={(checked) => {
                                                    const current = editingCategory.meta?.assignedTypes || [];
                                                    const newTypes = checked
                                                        ? [...current, type.id]
                                                        : current.filter((id: string) => id !== type.id);

                                                    setEditingCategory({
                                                        ...editingCategory,
                                                        meta: {
                                                            ...(editingCategory.meta || {}),
                                                            assignedTypes: newTypes
                                                        }
                                                    });
                                                }}
                                            />
                                            <Label htmlFor={`type-${type.id}`} className="text-sm font-normal cursor-pointer">
                                                {type.name} <span className="text-xs text-muted-foreground">({type.kind})</span>
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                    <T>Assign types to allow using them in this category.</T>
                                </div>
                            </div>
                            {/* Translate button — only for existing categories */}
                            {!isCreating && editingCategory.id && (
                                <div className="space-y-2">
                                    <Label><T>Translations</T></Label>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => setShowTranslationDialog(true)}
                                    >
                                        <Languages className="mr-2 h-4 w-4" />
                                        <T>Translate</T>
                                    </Button>
                                </div>
                            )}

                            <Button className="w-full" onClick={handleSave} disabled={actionLoading}>
                                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <T>Save</T>
                            </Button>
                        </div>
                    ) : selectedCategoryId ? (
                        <div className="space-y-4">
                            <div className="border-b pb-2">
                                <h3 className="font-semibold text-lg">{categories.find(c => c.id === selectedCategoryId)?.name || 'Selected'}</h3>
                                <p className="text-xs text-muted-foreground mb-1">{selectedCategoryId}</p>
                                {categories.find(c => c.id === selectedCategoryId)?.description && (
                                    <p className="text-sm text-foreground/80 italic">
                                        {categories.find(c => c.id === selectedCategoryId)?.description}
                                    </p>
                                )}
                            </div>

                            {currentPageId && (
                                <div className="bg-background rounded p-3 border space-y-2">
                                    <Label className="text-xs uppercase text-muted-foreground"><T>Current Page Link</T></Label>
                                    {linkedCategoryIds.includes(selectedCategoryId) ? (
                                        <div className="text-sm">
                                            <div className="flex items-center gap-2 text-green-600 mb-2">
                                                <Check className="h-4 w-4" />
                                                <T>Page linked to this category</T>
                                            </div>
                                            <Button size="sm" variant="outline" className="w-full" onClick={handleUnlinkPage} disabled={actionLoading}>
                                                <T>Remove from Category</T>
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button size="sm" className="w-full" onClick={handleLinkPage} disabled={actionLoading}>
                                            <LinkIcon className="mr-2 h-4 w-4" />
                                            <T>Add to Category</T>
                                        </Button>
                                    )}
                                </div>
                            )}

                            <div className="text-xs text-muted-foreground">
                                <T>Select a category to see actions or click edit/add icons in the tree.</T>
                            </div>

                            {/* Category ACL / Permissions */}
                            <CollapsibleSection
                                title={<span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /><T>Permissions</T></span>}
                                initiallyOpen={false}
                                storageKey="cat-acl-open"
                                minimal
                            >
                                <ACLEditorContent
                                    resourceType="category"
                                    resourceId={selectedCategoryId}
                                    resourceName={categories.find(c => c.id === selectedCategoryId)?.name || ''}
                                    availablePermissions={['read', 'list', 'write', 'delete']}
                                />
                            </CollapsibleSection>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm text-center">
                            <T>Select a category to manage or link.</T>
                        </div>
                    )}
                </div>
            </div>

            {!asView && (
                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={onClose}><T>Close</T></Button>
                </DialogFooter>
            )}

            {/* Nested Dialog for Variables */}
            <Dialog open={showVariablesEditor} onOpenChange={setShowVariablesEditor}>
                <DialogContent className="max-w-4xl h-[70vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle><T>Category Variables</T></DialogTitle>
                        <DialogDescription>
                            <T>Define variables available to pages in this category.</T>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 min-h-0">
                        {editingCategory && (
                            <VariablesEditor
                                onLoad={async () => {
                                    return (editingCategory.meta?.variables as Record<string, any>) || {};
                                }}
                                onSave={async (newVars) => {
                                    setEditingCategory({
                                        ...editingCategory,
                                        meta: {
                                            ...(editingCategory.meta || {}),
                                            variables: newVars
                                        }
                                    });
                                    setShowVariablesEditor(false);
                                }}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Category Translation Dialog */}
            {showTranslationDialog && editingCategory?.id && (
                <CategoryTranslationDialog
                    open={showTranslationDialog}
                    onOpenChange={setShowTranslationDialog}
                    categoryId={editingCategory.id}
                    categoryName={editingCategory.name || ''}
                    categoryDescription={editingCategory.description}
                />
            )}
        </>
    );

    if (asView) {
        return <div className="flex flex-col h-full">{innerContent}</div>;
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
                {innerContent}
            </DialogContent>
        </Dialog>
    );
};

