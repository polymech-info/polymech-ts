import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { T, translate } from '@/i18n';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { fetchProducts, createProduct, updateProduct, deleteProduct, Product } from '@/modules/ecommerce/client-products';
import { fetchTypes } from '@/modules/types/client-types';
import { VariablesEditor } from '@/components/variables/VariablesEditor';
import { GroupPicker } from '@/components/admin/GroupPicker';
import { ProductTypeDataForms } from '@/components/admin/ProductTypeDataForms';
import { Badge } from '@/components/ui/badge';

/** Merge list row + optional snake_case / legacy keys so Edit form matches DB after Settings save (avoids race before loadProducts finishes). */
function normalizeProductSettings(raw: Record<string, unknown> | null | undefined): Record<string, unknown> {
    const s: Record<string, unknown> = raw && typeof raw === 'object' ? { ...raw } : {};
    const ids =
        s.assignedTypeIds ??
        s.assigned_type_ids;
    if (ids !== undefined) {
        s.assignedTypeIds = Array.isArray(ids) ? ids : [];
    }
    return s;
}

const PRODUCT_VARIABLE_SCHEMA = {
    enabled: { label: translate("Enabled"), description: translate("Is the product enabled?") },
    default_cost_units: { label: translate("Default Cost Units"), description: translate("Cost per use") },
    default_rate_limit: { label: translate("Default Rate Limit"), description: translate("Requests per window limit") },
    default_rate_window: { label: translate("Default Rate Window Time"), description: translate("Time window in seconds") },
    productTypeData: {
        label: translate("Type data (per type id)"),
        description: translate("JSON map of type id → payload; edited in Product Edit or here."),
    },
};

const ProductsManager = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
    const [settingsProduct, setSettingsProduct] = useState<Product | null>(null);
    /** Mirrors CategoryManager `meta.assignedTypes` — type ids allowed for this product's edit form */
    const [settingsAssignedTypeIds, setSettingsAssignedTypeIds] = useState<string[]>([]);

    const { data: allTypes = [] } = useQuery({
        queryKey: ['types', 'all', 'products'],
        queryFn: () => fetchTypes(),
        staleTime: 1000 * 60 * 2,
    });
    const assignableTypes = useMemo(
        () => allTypes.filter((t) => t.kind === 'structure' || t.kind === 'alias'),
        [allTypes]
    );

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        settings: {} as Record<string, any>
    });

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await fetchProducts();
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error(translate('Failed to load products'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOpen = () => {
        setFormData({
            name: '',
            slug: '',
            description: '',
            settings: {}
        });
        setIsCreateOpen(true);
    };

    const handleEditOpen = async (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            slug: product.slug,
            description: product.description || '',
            settings: normalizeProductSettings(product.settings as Record<string, unknown>),
        });
        try {
            const list = await fetchProducts();
            const fresh = list.find((row) => row.id === product.id) ?? product;
            setProducts(list);
            setEditingProduct(fresh);
            setFormData({
                name: fresh.name,
                slug: fresh.slug,
                description: fresh.description || '',
                settings: normalizeProductSettings(fresh.settings as Record<string, unknown>),
            });
        } catch (e) {
            console.error(e);
        }
    };

    const handleProductTypeDataChange = (typeId: string, data: Record<string, unknown>) => {
        setFormData((prev) => ({
            ...prev,
            settings: {
                ...(prev.settings || {}),
                productTypeData: {
                    ...((prev.settings?.productTypeData as Record<string, Record<string, unknown>>) || {}),
                    [typeId]: data,
                },
            },
        }));
    };

    const handleFormAssignedTypeToggle = (typeId: string, checked: boolean) => {
        setFormData((prev) => {
            const current = (prev.settings?.assignedTypeIds as string[] | undefined) || [];
            const nextIds = checked ? [...new Set([...current, typeId])] : current.filter((id) => id !== typeId);
            const ptd = { ...((prev.settings?.productTypeData as Record<string, Record<string, unknown>>) || {}) };
            if (!checked) delete ptd[typeId];
            return {
                ...prev,
                settings: {
                    ...(prev.settings || {}),
                    assignedTypeIds: nextIds,
                    productTypeData: ptd,
                },
            };
        });
    };

    const handleSave = async () => {
        try {
            const base = (editingProduct?.settings || {}) as Record<string, unknown>;
            const mergedSettings = { ...base, ...formData.settings } as Record<string, unknown>;
            const assignedIds = (mergedSettings.assignedTypeIds as string[] | undefined) || [];
            const ptd = (mergedSettings.productTypeData || {}) as Record<string, Record<string, unknown>>;
            const prunedTypeData = Object.fromEntries(
                Object.entries(ptd).filter(([k]) => assignedIds.includes(k))
            );
            const settingsPayload = {
                ...mergedSettings,
                productTypeData: prunedTypeData,
            };

            if (editingProduct) {
                await updateProduct(editingProduct.slug, {
                    name: formData.name,
                    description: formData.description,
                    settings: settingsPayload
                });
                toast.success(translate('Product updated successfully'));
                setIsCreateOpen(false);
                setEditingProduct(null);
            } else {
                await createProduct({
                    name: formData.name,
                    slug: formData.slug || undefined,
                    description: formData.description,
                    settings: settingsPayload
                });
                toast.success(translate('Product created successfully'));
                setIsCreateOpen(false);
                setEditingProduct(null);
            }
            loadProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error(translate('Failed to save product'));
        }
    };

    const handleDelete = async () => {
        if (!deletingProduct) return;
        try {
            const success = await deleteProduct(deletingProduct.slug);
            if (success) {
                toast.success(translate('Product deleted successfully'));
                loadProducts();
            } else {
                toast.error(translate('Failed to delete product'));
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error(translate('Failed to delete product'));
        } finally {
            setDeletingProduct(null);
        }
    };

    const settingsProductRef = useRef(settingsProduct);
    const settingsAssignedTypeIdsRef = useRef(settingsAssignedTypeIds);
    useEffect(() => {
        settingsProductRef.current = settingsProduct;
    }, [settingsProduct]);
    useEffect(() => {
        settingsAssignedTypeIdsRef.current = settingsAssignedTypeIds;
    }, [settingsAssignedTypeIds]);

    useEffect(() => {
        if (settingsProduct) {
            setSettingsAssignedTypeIds(settingsProduct.settings?.assignedTypeIds || []);
        }
    }, [settingsProduct]);

    const handleLoadSettings = useCallback(async () => {
        const s = settingsProductRef.current?.settings || {};
        const { assignedTypeIds: _a, ...rest } = s;
        return rest;
    }, []);

    const handleSaveSettings = useCallback(async (data: Record<string, any>) => {
        if (!settingsProduct) return;
        const prev = settingsProduct.settings || {};
        const assignedTypeIds = settingsAssignedTypeIdsRef.current;
        const nextSettings = {
            ...prev,
            ...data,
            assignedTypeIds,
        };
        await updateProduct(settingsProduct.slug, { settings: nextSettings });
        setSettingsProduct({ ...settingsProduct, settings: nextSettings });
        loadProducts();
    }, [settingsProduct]);

    if (loading) {
        return <div><T>Loading products...</T></div>;
    }

    return (
        <div>
            <div className="flex justify-end mb-4">
                <Button onClick={handleCreateOpen}>
                    <Plus className="mr-2 h-4 w-4" />
                    <T>Create Product</T>
                </Button>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead><T>Name</T></TableHead>
                            <TableHead><T>Slug</T></TableHead>
                            <TableHead><T>Status</T></TableHead>
                            <TableHead><T>Cost Units</T></TableHead>
                            <TableHead><T>Groups</T></TableHead>
                            <TableHead className="text-right"><T>Actions</T></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map(product => (
                            <TableRow key={product.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-muted p-2 rounded-md">
                                            <Package className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="font-medium">{product.name}</div>
                                            <div className="text-sm text-muted-foreground">{product.description || <span className="opacity-50 italic">No description</span>}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                    {product.slug}
                                </TableCell>
                                <TableCell>
                                    {product.settings?.enabled ? (
                                        <span className="text-green-600 dark:text-green-400 font-medium text-sm">Active</span>
                                    ) : (
                                        <span className="text-muted-foreground font-medium text-sm">Disabled</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {product.settings?.default_cost_units ?? 0}
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-1 flex-wrap max-w-[200px]">
                                        {(product.settings?.groups || []).map((group: string) => (
                                            <Badge key={group} variant="secondary" className="text-[10px] truncate max-w-[120px]">{group}</Badge>
                                        ))}
                                        {(!product.settings?.groups || product.settings.groups.length === 0) && (
                                            <span className="text-xs text-muted-foreground italic"><T>None</T></span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEditOpen(product)}><T>Edit</T></DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setSettingsProduct(product)}><T>Settings</T></DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-500 hover:text-red-600 focus:text-red-600"
                                                onClick={() => setDeletingProduct(product)}
                                            >
                                                <T>Delete</T>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {products.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    <T>No products found. Create one to get started.</T>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Editor Dialog */}
            <Dialog open={isCreateOpen || !!editingProduct} onOpenChange={(open) => {
                if (!open) {
                    setIsCreateOpen(false);
                    setEditingProduct(null);
                }
            }}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? <T>Edit Product</T> : <T>Create Product</T>}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name"><T>Name</T></Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Premium Subscription"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="slug"><T>Slug</T> {editingProduct ? '(Read Only)' : '(Optional)'}</Label>
                            <Input
                                id="slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                disabled={!!editingProduct}
                                placeholder="Autogenerated if left empty"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description"><T>Description</T></Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of the product"
                            />
                        </div>
                        <div className="grid gap-2 mt-2 border-t pt-4">
                            <Label><T>Assigned ACL Groups</T></Label>
                            <GroupPicker
                                multi={true}
                                value={formData.settings?.groups || []}
                                onSelect={(groupIdOrName) => {
                                    const currentGroups = formData.settings?.groups || [];
                                    if (!currentGroups.includes(groupIdOrName)) {
                                        setFormData({
                                            ...formData,
                                            settings: {
                                                ...(formData.settings || {}),
                                                groups: [...currentGroups, groupIdOrName]
                                            }
                                        });
                                    }
                                }}
                                onRemove={(groupIdOrName) => {
                                    const currentGroups = formData.settings?.groups || [];
                                    setFormData({
                                        ...formData,
                                        settings: {
                                            ...(formData.settings || {}),
                                            groups: currentGroups.filter((g: string) => g !== groupIdOrName)
                                        }
                                    });
                                }}
                            />
                            <p className="text-xs text-muted-foreground">
                                <T>Members of these groups will inherently be granted access to this product.</T>
                            </p>
                        </div>

                        <div className="grid gap-2 mt-2 border-t pt-4">
                            <Label><T>Assigned types</T></Label>
                            <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-2">
                                {assignableTypes.length === 0 && (
                                    <div className="text-xs text-muted-foreground p-1">
                                        <T>No assignable types found.</T>
                                    </div>
                                )}
                                {assignableTypes.map((type) => {
                                    const assigned = (formData.settings?.assignedTypeIds as string[] | undefined) || [];
                                    const checked = assigned.includes(type.id);
                                    return (
                                        <div key={type.id} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`product-form-type-${type.id}`}
                                                checked={checked}
                                                onCheckedChange={(v) =>
                                                    handleFormAssignedTypeToggle(type.id, v === true)
                                                }
                                            />
                                            <Label
                                                htmlFor={`product-form-type-${type.id}`}
                                                className="text-sm font-normal cursor-pointer"
                                            >
                                                {type.name}{' '}
                                                <span className="text-xs text-muted-foreground">({type.kind})</span>
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                <T>Structure and alias types enabled for this product. You can also change them under Product Settings.</T>
                            </p>
                        </div>

                        <div className="grid gap-2 mt-2 border-t pt-4">
                            <Label><T>Type data</T></Label>
                            <p className="text-xs text-muted-foreground">
                                <T>Structured fields from the types selected above (saved with this form).</T>
                            </p>
                            {(formData.settings?.assignedTypeIds?.length ?? 0) === 0 ? (
                                <p className="text-xs text-muted-foreground italic py-2 border rounded-md px-3 bg-muted/30">
                                    <T>Select one or more types above to edit type-based fields here.</T>
                                </p>
                            ) : (
                                <ProductTypeDataForms
                                    typeIds={formData.settings?.assignedTypeIds || []}
                                    types={allTypes}
                                    value={(formData.settings?.productTypeData || {}) as Record<string, Record<string, unknown>>}
                                    onChange={handleProductTypeDataChange}
                                />
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setIsCreateOpen(false);
                            setEditingProduct(null);
                        }}>
                            <T>Cancel</T>
                        </Button>
                        <Button onClick={handleSave} disabled={!formData.name}>
                            <T>Save</T>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle><T>Delete Product</T></DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-muted-foreground">
                            {translate("Are you sure you want to delete")} <span className="font-semibold text-foreground">{deletingProduct?.name}</span>?
                            {translate("This action cannot be undone and will disconnect any associated ACLs.")}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingProduct(null)}>
                            <T>Cancel</T>
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            <T>Delete</T>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Settings Dialog */}
            <Dialog open={!!settingsProduct} onOpenChange={(open) => !open && setSettingsProduct(null)}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle><T>Product Settings</T>: {settingsProduct?.name}</DialogTitle>
                    </DialogHeader>
                    {!!settingsProduct && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label><T>Assigned types</T></Label>
                                <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-2">
                                    {assignableTypes.length === 0 && (
                                        <div className="text-xs text-muted-foreground p-1">
                                            <T>No assignable types found.</T>
                                        </div>
                                    )}
                                    {assignableTypes.map((type) => (
                                        <div key={type.id} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`product-type-${type.id}`}
                                                checked={settingsAssignedTypeIds.includes(type.id)}
                                                onCheckedChange={async (checked) => {
                                                    if (!settingsProduct) return;
                                                    const next = checked
                                                        ? [...settingsAssignedTypeIds, type.id]
                                                        : settingsAssignedTypeIds.filter((id) => id !== type.id);
                                                    setSettingsAssignedTypeIds(next);
                                                    try {
                                                        const prev = settingsProduct.settings || {};
                                                        const nextSettings = {
                                                            ...prev,
                                                            assignedTypeIds: next,
                                                            productTypeData: prev.productTypeData || {},
                                                        };
                                                        await updateProduct(settingsProduct.slug, { settings: nextSettings });
                                                        setSettingsProduct({ ...settingsProduct, settings: nextSettings });
                                                        loadProducts();
                                                    } catch (e) {
                                                        console.error(e);
                                                        toast.error(translate('Failed to save types'));
                                                        setSettingsAssignedTypeIds(settingsProduct.settings?.assignedTypeIds || []);
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={`product-type-${type.id}`} className="text-sm font-normal cursor-pointer">
                                                {type.name}{' '}
                                                <span className="text-xs text-muted-foreground">({type.kind})</span>
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                    <T>These types drive the &quot;Type data&quot; section when editing this product.</T>
                                </p>
                            </div>
                            <VariablesEditor
                                onLoad={handleLoadSettings}
                                onSave={handleSaveSettings}
                                variableSchema={PRODUCT_VARIABLE_SCHEMA}
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProductsManager;
