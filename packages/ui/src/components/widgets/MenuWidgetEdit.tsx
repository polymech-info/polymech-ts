import React, { useState, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { T, translate } from '@/i18n';
import {
    Plus,
    Trash2,
    GripVertical,
    FileText,
    FolderTree,
    FolderOpen,
    Link as LinkIcon,
    Menu as MenuIcon,
    Pencil,
} from 'lucide-react';
import { PagePickerDialog } from '@/modules/pages/PagePickerDialog';
import { CategoryManager } from '@/components/widgets/CategoryManager';
import { FileBrowserWidget } from '@/modules/storage/FileBrowserWidget';
import type { INode } from '@/modules/storage/types';
import type { MenuItemData } from './MenuWidgetView';
import { typeIcon } from './MenuWidgetView';

// ─── Types ────────────────────────────────────────────────────

export interface MenuWidgetEditProps {
    items?: MenuItemData[];
    orientation?: 'horizontal' | 'vertical';
    isEditMode?: boolean;
    onPropsChange?: (props: Record<string, any>) => void;
    [key: string]: any;
}

// ─── Helpers ──────────────────────────────────────────────────

const generateId = () => Math.random().toString(36).substring(2, 9);

const typeBadge = (type: MenuItemData['type']) => {
    const colors: Record<string, string> = {
        custom: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        page: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        category: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        file: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return (
        <span className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium', colors[type] || colors.custom)}>
            {typeIcon(type)}
            {type}
        </span>
    );
};

// ─── Sortable Item ────────────────────────────────────────────

const SortableMenuItem = ({
    item,
    onRemove,
    onUpdate,
    onRePick,
}: {
    item: MenuItemData;
    onRemove: (id: string) => void;
    onUpdate: (id: string, updates: Partial<MenuItemData>) => void;
    onRePick?: (item: MenuItemData) => void;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md border border-border/50 mb-1.5">
            <button {...attributes} {...listeners} className="cursor-grab hover:text-foreground text-muted-foreground shrink-0">
                <GripVertical className="h-4 w-4" />
            </button>

            {typeBadge(item.type)}

            <Input
                value={item.label}
                onChange={(e) => onUpdate(item.id, { label: e.target.value })}
                className="h-7 text-sm flex-1 min-w-0"
                placeholder={translate("Label")}
            />

            {item.type === 'custom' && (
                <Input
                    value={item.href || ''}
                    onChange={(e) => onUpdate(item.id, { href: e.target.value })}
                    className="h-7 text-xs w-36 text-muted-foreground"
                    placeholder="https://..."
                />
            )}

            {item.type !== 'custom' && onRePick && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRePick(item)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-primary shrink-0"
                    title={translate('Change source')}
                >
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
            )}

            {item.type === 'category' && (
                <label
                    className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer select-none shrink-0"
                    title={translate('Show subcategories')}
                >
                    <input
                        type="checkbox"
                        checked={!!item.showChildren}
                        onChange={(e) => onUpdate(item.id, { showChildren: e.target.checked })}
                        className="h-3 w-3 rounded"
                    />
                    <T>Subs</T>
                </label>
            )}

            <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(item.id)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </Button>
        </div>
    );
};

// ─── Edit Component ───────────────────────────────────────────

const MenuWidgetEdit: React.FC<MenuWidgetEditProps> = ({
    items = [],
    onPropsChange,
}) => {
    const [showPagePicker, setShowPagePicker] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [showFilePicker, setShowFilePicker] = useState(false);
    const [filePickerMount, setFilePickerMount] = useState('home');
    const [filePickerPath, setFilePickerPath] = useState('/');
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [selectedFileNode, setSelectedFileNode] = useState<INode | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // ── Mutation helpers ──

    const updateItems = useCallback((newItems: MenuItemData[]) => {
        onPropsChange?.({ items: newItems });
        console.log(newItems);
    }, [onPropsChange]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex(i => i.id === active.id);
            const newIndex = items.findIndex(i => i.id === over.id);
            updateItems(arrayMove(items, oldIndex, newIndex));
        }
    }, [items, updateItems]);

    const handleAddCustom = useCallback(() => {
        const newItem: MenuItemData = {
            id: generateId(),
            label: 'New Link',
            type: 'custom',
            href: '',
        };
        updateItems([...items, newItem]);
    }, [items, updateItems]);

    const handleUpdate = useCallback((id: string, updates: Partial<MenuItemData>) => {
        updateItems(items.map(i => i.id === id ? { ...i, ...updates } : i));
    }, [items, updateItems]);

    const handleRemove = useCallback((id: string) => {
        updateItems(items.filter(i => i.id !== id));
    }, [items, updateItems]);

    const handleRePick = useCallback((item: MenuItemData) => {
        setEditingItemId(item.id);
        if (item.type === 'page') setShowPagePicker(true);
        else if (item.type === 'category') setShowCategoryPicker(true);
        else if (item.type === 'file') setShowFilePicker(true);
    }, []);

    const handlePageSelect = useCallback((page: any | null) => {
        if (!page) return;
        console.log(page);
        const updates = {
            label: page.title || 'Page',
            type: 'page' as const,
            targetPageId: page.id,
            targetPageSlug: page.slug,
            targetPageOwner: page.user_id || page.owner,
        };
        if (editingItemId) {
            handleUpdate(editingItemId, updates);
            setEditingItemId(null);
        } else {
            updateItems([...items, { id: generateId(), ...updates }]);
        }
    }, [items, updateItems, editingItemId, handleUpdate]);

    const handleCategoryPick = useCallback((categoryIds: string[], allCategories?: any[]) => {
        const catMap = new Map((allCategories || []).map(c => [c.id, c]));
        if (editingItemId) {
            const catId = categoryIds[0];
            const cat = catMap.get(catId);
            handleUpdate(editingItemId, {
                label: cat?.name || 'Category',
                type: 'category' as const,
                categoryId: catId,
                categorySlug: cat?.slug || catId,
            });
            setEditingItemId(null);
        } else {
            const existing = new Set(items.filter(i => i.type === 'category').map(i => i.categoryId));
            const newOnes = categoryIds.filter(id => !existing.has(id));
            if (newOnes.length === 0) return;
            const additions: MenuItemData[] = newOnes.map(id => {
                const cat = catMap.get(id);
                return {
                    id: generateId(),
                    label: cat?.name || 'Category',
                    type: 'category' as const,
                    categoryId: id,
                    categorySlug: cat?.slug || id,
                };
            });
            updateItems([...items, ...additions]);
        }
    }, [items, updateItems, editingItemId, handleUpdate]);

    const handleFileConfirm = useCallback(() => {
        if (!selectedFileNode) return;
        const nodeName = selectedFileNode.name || selectedFileNode.path.split('/').pop() || selectedFileNode.path;
        const updates = {
            label: nodeName,
            type: 'file' as const,
            fileMount: filePickerMount,
            filePath: selectedFileNode.path,
            openInNewTab: true,
        };
        if (editingItemId) {
            handleUpdate(editingItemId, updates);
            setEditingItemId(null);
        } else {
            updateItems([...items, { id: generateId(), ...updates }]);
        }
        setSelectedFileNode(null);
        setShowFilePicker(false);
    }, [items, updateItems, filePickerMount, selectedFileNode, editingItemId, handleUpdate]);

    return (
        <div className="p-3 pb-20 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MenuIcon className="h-4 w-4" />
                    <T>Menu</T>
                    <span className="text-xs">({items.length})</span>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                            <Plus className="h-3 w-3 mr-1" />
                            <T>Add Link</T>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleAddCustom}>
                            <LinkIcon className="mr-2 h-4 w-4" />
                            <T>Custom Link</T>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowPagePicker(true)}>
                            <FileText className="mr-2 h-4 w-4" />
                            <T>Internal Page</T>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowCategoryPicker(true)}>
                            <FolderTree className="mr-2 h-4 w-4" />
                            <T>Category</T>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowFilePicker(true)}>
                            <FolderOpen className="mr-2 h-4 w-4" />
                            <T>File / Folder</T>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Sortable Items */}
            {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-md">
                    <MenuIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <T>No menu items yet. Click "Add Link" to get started.</T>
                </div>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                        {items.map(item => (
                            <SortableMenuItem
                                key={item.id}
                                item={item}
                                onRemove={handleRemove}
                                onUpdate={handleUpdate}
                                onRePick={handleRePick}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            )}

            {/* Page Picker Dialog */}
            <PagePickerDialog
                isOpen={showPagePicker}
                onClose={() => setShowPagePicker(false)}
                onSelect={handlePageSelect}
            />

            {/* Category Picker Dialog */}
            <CategoryManager
                isOpen={showCategoryPicker}
                onClose={() => setShowCategoryPicker(false)}
                mode="pick"
                filterByType="pages"
                onPick={handleCategoryPick}
                selectedCategoryIds={items.filter(i => i.type === 'category').map(i => i.categoryId!).filter(Boolean)}
            />

            {/* File Picker Dialog */}
            <Dialog open={showFilePicker} onOpenChange={(open) => { if (!open) { setShowFilePicker(false); setSelectedFileNode(null); } }}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle><T>Select File or Folder</T></DialogTitle>
                        <DialogDescription>
                            <T>Pick a file or folder to add as a menu link (opens in new tab)</T>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 min-h-0 overflow-hidden" style={{ height: 400 }}>
                        <FileBrowserWidget
                            mount={filePickerMount}
                            path={filePickerPath}
                            mode="simple"
                            viewMode="list"
                            showToolbar={true}
                            canChangeMount={true}
                            allowFileViewer={false}
                            allowLightbox={false}
                            allowDownload={false}
                            jail={false}
                            minHeight="400px"
                            showStatusBar={false}
                            glob="*.*"
                            sortBy="name"
                            onSelectNode={(node: INode | null) => setSelectedFileNode(node)}
                            onMountChange={(m: string) => {
                                setFilePickerMount(m);
                                setFilePickerPath('/');
                                setSelectedFileNode(null);
                            }}
                            onPathChange={(p: string) => setFilePickerPath(p)}
                        />
                    </div>
                    {selectedFileNode && (
                        <div className="px-3 py-2 bg-muted/50 rounded-md text-sm flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="truncate">{selectedFileNode.name || selectedFileNode.path}</span>
                        </div>
                    )}
                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <Button variant="outline" onClick={() => { setShowFilePicker(false); setSelectedFileNode(null); }} type="button">
                            <T>Cancel</T>
                        </Button>
                        <Button onClick={handleFileConfirm} disabled={!selectedFileNode} type="button">
                            <T>Select</T>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MenuWidgetEdit;
