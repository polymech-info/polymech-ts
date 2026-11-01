import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Box } from 'lucide-react';
import { CategoryManager } from '@/components/widgets/CategoryManager';
import { BuilderMode, BuilderElement, BuilderOutput } from './types';
import { DraggablePaletteItem, CanvasElement, WidgetPicker } from './components';
import { TypeCategoryTree } from '../TypeCategoryTree';
import { EnumEditor, FlagsEditor } from './Editors';
import { resolvePrimitiveType } from './utils';
import { APP_PICKER_PALETTE_ENTRIES, ARRAY_ITEMS_APP_PICKER_ENTRIES, ARRAY_ITEMS_APP_PICKER_WIDGETS } from '../AppTypeWidgets';
import { TypeDefinition } from '../client-types';
import { FolderTree, Link2 } from 'lucide-react';
import { useBuilderStore } from './useStore';

/**
 * TypeBuilderContent
 * 
 * This is the core visual layout and state consumer of the TypeBuilder interface.
 * It is separated from the top-level `TypeBuilder` component to ensure that hooks (like `useBuilderStore` 
 * and `@dnd-kit` sorting/dropping context) have access to the appropriate Context Providers instantiated 
 * higher up in the component tree.
 * 
 * Responsibilities:
 * 1. Rendering the 3-pane layout: Left (Available Types/Palettes), Center (Drop Canvas), Right (Selected Field Details).
 * 2. Consuming and mutating shared state from `useBuilderStore`.
 * 3. Handling advanced field configurations (Widgets, Array Items, Array widget bindings, Enum/Flags values).
 */
export const TypeBuilderContent: React.FC<{
    onCancel: () => void;
    onSave: (data: BuilderOutput) => void;
    availableTypes: TypeDefinition[];
    types: TypeDefinition[];
    selectedType?: TypeDefinition;
    onUpdateMeta?: (meta: any) => Promise<void>;
}> = ({
    onCancel, onSave,
    availableTypes, types, selectedType, onUpdateMeta
}) => {
        const {
            mode, setMode, elements, setElements, selectedId, setSelectedId,
            deleteElement, removeElement, updateSelectedElement,
            typeName, setTypeName, typeDescription, setTypeDescription, fieldsToDelete,
            enumValues, setEnumValues, flagValues, setFlagValues
        } = useBuilderStore();

        const selectedElement = elements.find(e => e.id === selectedId);

        const [showCategoryManager, setShowCategoryManager] = React.useState(false);
        const { setNodeRef: setCanvasRef, isOver } = useDroppable({
            id: 'canvas',
        });

        const stringPrimitive = React.useMemo(
            () => availableTypes.find((t) => t.kind === 'primitive' && t.name === 'string'),
            [availableTypes]
        );

        const itemsTypeSelectValue = React.useMemo(() => {
            if (!selectedElement?.itemsTypeId) return '_none';
            const wid = selectedElement.uiSchema?.items?.['ui:widget'];
            if (
                stringPrimitive &&
                selectedElement.itemsTypeId === stringPrimitive.id &&
                typeof wid === 'string' &&
                ARRAY_ITEMS_APP_PICKER_WIDGETS.has(wid)
            ) {
                return `widget:${wid}`;
            }
            const t = availableTypes.find((x) => x.id === selectedElement.itemsTypeId);
            if (t?.kind === 'structure') return `struct:${selectedElement.itemsTypeId}`;
            return `prim:${selectedElement.itemsTypeId}`;
        }, [selectedElement?.itemsTypeId, selectedElement?.uiSchema, stringPrimitive, availableTypes]);

        const applyItemsTypeChange = React.useCallback(
            (val: string) => {
                if (!selectedElement) return;
                const stripItemsKey = (ui: Record<string, unknown> | undefined) => {
                    if (!ui?.items) return ui;
                    const { items: _i, ...rest } = ui;
                    return Object.keys(rest).length ? rest : undefined;
                };
                if (val === '_none') {
                    updateSelectedElement({ itemsTypeId: undefined, uiSchema: stripItemsKey(selectedElement.uiSchema as Record<string, unknown>) as BuilderElement['uiSchema'] });
                    return;
                }
                if (val.startsWith('widget:') && stringPrimitive) {
                    const w = val.slice('widget:'.length);
                    updateSelectedElement({
                        itemsTypeId: stringPrimitive.id,
                        uiSchema: {
                            ...(selectedElement.uiSchema || {}),
                            items: { 'ui:widget': w, 'ui:label': false },
                        },
                    });
                    return;
                }
                const id = val.startsWith('prim:') ? val.slice('prim:'.length) : val.startsWith('struct:') ? val.slice('struct:'.length) : val;
                updateSelectedElement({
                    itemsTypeId: id,
                    uiSchema: stripItemsKey(selectedElement.uiSchema as Record<string, unknown>) as BuilderElement['uiSchema'],
                });
            },
            [selectedElement, stringPrimitive, updateSelectedElement]
        );

        const primitivePaletteExtras = React.useMemo(() => {
            if ((mode !== 'structure' && mode !== 'alias') || !stringPrimitive) return undefined;
            return [
                {
                    id: 'palette-primitive-categoryPicker',
                    node: (
                        <DraggablePaletteItem
                            key="palette-primitive-categoryPicker"
                            item={{
                                id: 'palette-primitive-categoryPicker',
                                type: 'string',
                                name: 'categoryId',
                                title: 'Category',
                                refId: stringPrimitive.id,
                                uiSchema: { 'ui:widget': 'categoryPicker' },
                            }}
                        />
                    ),
                },
                {
                    id: 'palette-primitive-userPicker',
                    node: (
                        <DraggablePaletteItem
                            key="palette-primitive-userPicker"
                            item={{
                                id: 'palette-primitive-userPicker',
                                type: 'string',
                                name: 'userId',
                                title: 'User',
                                refId: stringPrimitive.id,
                                uiSchema: { 'ui:widget': 'userPicker' },
                            }}
                        />
                    ),
                },
                {
                    id: 'palette-primitive-groupPicker',
                    node: (
                        <DraggablePaletteItem
                            key="palette-primitive-groupPicker"
                            item={{
                                id: 'palette-primitive-groupPicker',
                                type: 'string',
                                name: 'groupName',
                                title: 'Group',
                                refId: stringPrimitive.id,
                                uiSchema: { 'ui:widget': 'groupPicker' },
                            }}
                        />
                    ),
                },
            ];
        }, [mode, stringPrimitive]);

        const paletteExtraFolders = React.useMemo(() => {
            if (mode !== 'structure' || !stringPrimitive) return undefined;
            return [
                {
                    folderId: 'group-app-pickers',
                    label: 'App pickers',
                    icon: <Link2 className="h-3.5 w-3.5 shrink-0" />,
                    items: APP_PICKER_PALETTE_ENTRIES.map((entry) => ({
                        id: `palette-app-${entry.widget}`,
                        node: (
                            <DraggablePaletteItem
                                key={`palette-app-${entry.widget}`}
                                item={{
                                    id: `palette-app-${entry.widget}`,
                                    type: 'string',
                                    name: entry.defaultFieldName,
                                    title: entry.paletteTitle,
                                    refId: stringPrimitive.id,
                                    uiSchema: { 'ui:widget': entry.widget },
                                }}
                            />
                        ),
                    })),
                },
            ];
        }, [mode, stringPrimitive]);

        return (
            <div className="flex h-full gap-6">
                {/* Palette */}
                <Card className="w-64 flex flex-col">
                    <CardHeader className="py-3 px-4 border-b">
                        <CardTitle className="text-sm font-medium">Palette</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-3 space-y-6 overflow-y-auto scrollbar-custom">
                        {mode !== 'alias' ? (
                            <TypeCategoryTree
                                types={availableTypes}
                                excludeFieldTypes={true}
                                primitivePaletteExtras={primitivePaletteExtras}
                                paletteExtraFolders={paletteExtraFolders}
                                renderItem={(t) => {
                                    const isPrimitive = t.kind === 'primitive';
                                    const item: BuilderElement = isPrimitive ? {
                                        id: `primitive-${t.id}`,
                                        type: t.name,
                                        name: t.name.charAt(0).toUpperCase() + t.name.slice(1),
                                        title: `${t.name.charAt(0).toUpperCase() + t.name.slice(1)}`,
                                        description: t.description || undefined,
                                        refId: t.id
                                    } : {
                                        id: `type-${t.id}`,
                                        type: t.name,
                                        name: t.name,
                                        title: t.name,
                                        description: t.description || undefined,
                                        isCustom: true,
                                        refId: t.id
                                    } as BuilderElement & { isCustom?: boolean, refId?: string };
                                    return <DraggablePaletteItem key={item.id} item={item} />;
                                }}
                            />
                        ) : (
                            <TypeCategoryTree
                                types={availableTypes.filter(t => t.kind === 'primitive')}
                                excludeFieldTypes={true}
                                primitivePaletteExtras={primitivePaletteExtras}
                                renderItem={(t) => {
                                    const item: BuilderElement = {
                                        id: `primitive-${t.id}`,
                                        type: t.name,
                                        name: t.name.charAt(0).toUpperCase() + t.name.slice(1),
                                        title: `New ${t.name.charAt(0).toUpperCase() + t.name.slice(1)}`,
                                        description: t.description || undefined,
                                        refId: t.id
                                    };
                                    return <DraggablePaletteItem key={item.id} item={item} />;
                                }}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Canvas */}
                <Card className={`flex-1 flex flex-col transition-colors ${isOver ? 'bg-muted/30 border-primary/50 ring-2 ring-primary/20' : ''}`}>
                    <CardHeader className="py-3 px-4 border-b flex flex-row justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Tabs value={mode} onValueChange={(v) => { setMode(v as BuilderMode); setElements([]); }} className="w-fit">
                                <TabsList className="h-7">
                                    <TabsTrigger value="structure" className="text-xs">Structure</TabsTrigger>
                                    <TabsTrigger value="alias" className="text-xs">Single</TabsTrigger>
                                    <TabsTrigger value="enum" className="text-xs">Enum</TabsTrigger>
                                    <TabsTrigger value="flags" className="text-xs">Flags</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
                            <Button size="sm" onClick={() => onSave({ mode, elements, name: typeName, description: typeDescription, fieldsToDelete, enumValues, flagValues })} disabled={!typeName.trim()}>
                                Save Type
                            </Button>
                        </div>
                    </CardHeader>
                    <div
                        ref={setCanvasRef}
                        className="flex-1 min-h-0 p-4 bg-muted/10 overflow-y-auto min-h-[min(420px,55vh)] transition-colors relative"
                    >
                        {isOver && (
                            <div className="absolute inset-0 bg-primary/10 rounded-md border-2 border-primary/40 border-dashed pointer-events-none z-0" />
                        )}
                        <div className="relative z-10 min-h-[min(380px,50vh)]">
                            {mode === 'enum' && (
                                <EnumEditor enumValues={enumValues} setEnumValues={setEnumValues} />
                            )}
                            {mode === 'flags' && (
                                <FlagsEditor flagValues={flagValues} setFlagValues={setFlagValues} />
                            )}
                            {(mode === 'structure' || mode === 'alias') && (
                                <>
                                    {elements.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg opacity-50 min-h-[250px]">
                                            <Box className="h-12 w-12 opacity-50 mb-2" />
                                            <p>
                                                {mode === 'alias'
                                                    ? "Drag a primitive type here to define the base type"
                                                    : "Drag items here to build your structure"
                                                }
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-w-md mx-auto">
                                            <SortableContext items={elements.map(e => e.id)} strategy={verticalListSortingStrategy}>
                                                {elements.map(el => (
                                                    <CanvasElement
                                                        key={el.id}
                                                        element={el}
                                                        isSelected={selectedId === el.id}
                                                        onSelect={() => setSelectedId(el.id)}
                                                        onDelete={() => deleteElement(el.id)}
                                                        onRemoveOnly={() => removeElement(el.id)}
                                                    />
                                                ))}
                                            </SortableContext>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Configuration Pane */}
                <Card className="w-80 flex flex-col">
                    <CardHeader className="py-3 px-4 border-b">
                        <CardTitle className="text-sm font-medium">Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                        <Tabs defaultValue={selectedElement ? "field" : "type"} value={selectedElement ? "field" : "type"} className="flex-1 flex flex-col">
                            <div className="px-4 py-2 border-b">
                                <TabsList className="w-full">
                                    <TabsTrigger value="type" className="flex-1" onClick={() => setSelectedId(null)}>Type Settings</TabsTrigger>
                                    <TabsTrigger value="field" className="flex-1" disabled={!selectedElement}>Field Settings</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="type" className="flex-1 p-4 space-y-4 m-0 overflow-y-auto">
                                <div className="space-y-2">
                                    <Label>Type Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={typeName}
                                        onChange={e => setTypeName(e.target.value)}
                                        placeholder="e.g. MyCustomType"
                                        className={!typeName.trim() ? "border-red-300" : ""}
                                    />
                                    <p className="text-[10px] text-muted-foreground">The unique name for this new type.</p>
                                </div>
                                {mode === 'alias' && (
                                    <div className="space-y-2">
                                        <Label>Parent Type</Label>
                                        <Select
                                            value={elements[0]?.type || ''}
                                            onValueChange={(val) => {
                                                const foundType = availableTypes.find(t => t.name === val);
                                                if (!foundType) return;

                                                const newItemId = `field-${Date.now()}`;
                                                const newItem: BuilderElement = {
                                                    id: elements.length > 0 ? elements[0].id : newItemId,
                                                    type: val,
                                                    name: 'value',
                                                    title: val + ' Alias',
                                                    uiSchema: {},
                                                    ...(foundType && { refId: foundType.id } as any)
                                                };
                                                setElements([newItem]);
                                                setSelectedId(newItem.id);
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a primitive type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableTypes.filter(t => t.kind === 'primitive').map(p => (
                                                    <SelectItem key={p.id} value={p.name}>{p.name.charAt(0).toUpperCase() + p.name.slice(1)}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-muted-foreground">The primitive type to alias.</p>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={typeDescription}
                                        onChange={e => setTypeDescription(e.target.value)}
                                        className="resize-none h-20"
                                        placeholder="What is this type for?"
                                    />
                                </div>
                                {selectedType?.id && (
                                    <div className="pt-4 border-t space-y-2">
                                        <Label>Categories</Label>
                                        <div className="text-[10px] text-muted-foreground mb-2">
                                            Assign this type to specific categories.
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-start"
                                            onClick={() => setShowCategoryManager(true)}
                                        >
                                            <FolderTree className="w-4 h-4 mr-2 opacity-70" />
                                            Manage Categories
                                        </Button>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="field" className="flex-1 p-4 m-0 overflow-y-auto">
                                {selectedElement ? (
                                    <div className="space-y-4">
                                        {mode === 'structure' && (
                                            <div className="space-y-2">
                                                <Label>Field Name (key)</Label>
                                                <Input
                                                    value={selectedElement.name}
                                                    onChange={e => updateSelectedElement({ name: e.target.value })}
                                                    placeholder="e.g. firstName"
                                                />
                                                <p className="text-[10px] text-muted-foreground">The property key in the JSON object.</p>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <Label>Title (Label)</Label>
                                            <Input
                                                value={selectedElement.title}
                                                onChange={e => updateSelectedElement({ title: e.target.value })}
                                                placeholder="e.g. First Name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Textarea
                                                value={selectedElement.description || ''}
                                                onChange={e => updateSelectedElement({ description: e.target.value })}
                                                className="resize-none h-20"
                                                placeholder="Helper text for the user..."
                                            />
                                        </div>

                                        <div className="flex flex-row items-center justify-between rounded-lg border p-3">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm">Required</Label>
                                                <p className="text-[10px] text-muted-foreground">
                                                    Ensure this field is always provided.
                                                </p>
                                            </div>
                                            <Switch
                                                checked={selectedElement.required || false}
                                                onCheckedChange={checked => updateSelectedElement({ required: checked })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Default Value</Label>
                                            <Input
                                                value={selectedElement.defaultValue ?? ''}
                                                onChange={e => updateSelectedElement({ defaultValue: e.target.value })}
                                                placeholder="e.g. initial value"
                                            />
                                            <p className="text-[10px] text-muted-foreground">The initial value for this field.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Group (Rendering)</Label>
                                            <Input
                                                value={selectedElement.group || ''}
                                                onChange={e => updateSelectedElement({ group: e.target.value })}
                                                placeholder="e.g. Content, Advanced, SEO"
                                            />
                                            <p className="text-[10px] text-muted-foreground">Used to group fields together during visual rendering.</p>
                                        </div>

                                        {resolvePrimitiveType(selectedElement.type, types) === 'array' && (
                                            <div className="pt-4 border-t">
                                                <h4 className="text-xs font-semibold mb-3">Array Configuration</h4>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Items Type</Label>
                                                    <Select
                                                        value={itemsTypeSelectValue}
                                                        onValueChange={applyItemsTypeChange}
                                                    >
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue placeholder="Select what each item is..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="_none" className="text-xs">None (generic)</SelectItem>
                                                            <div className="px-2 py-1.5 text-[0.625rem] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 mt-1">Primitives</div>
                                                            {availableTypes
                                                                .filter(t => t.kind === 'primitive' && t.name !== 'array')
                                                                .map(t => (
                                                                    <SelectItem key={t.id} value={`prim:${t.id}`} className="text-xs pl-4">
                                                                        {t.name.charAt(0).toUpperCase() + t.name.slice(1)}
                                                                    </SelectItem>
                                                                ))}
                                                            {stringPrimitive && (
                                                                <>
                                                                    <div className="px-2 py-1.5 text-[0.625rem] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 mt-1">App pickers</div>
                                                                    {ARRAY_ITEMS_APP_PICKER_ENTRIES.map((e) => (
                                                                        <SelectItem key={e.widget} value={`widget:${e.widget}`} className="text-xs pl-4">
                                                                            {e.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </>
                                                            )}
                                                            <div className="px-2 py-1.5 text-[0.625rem] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 mt-1">Structures</div>
                                                            {availableTypes
                                                                .filter(t => t.kind === 'structure')
                                                                .map(t => (
                                                                    <SelectItem key={t.id} value={`struct:${t.id}`} className="text-xs pl-4">
                                                                        {t.name}
                                                                    </SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        Choose the type for each array element. Structures render nested forms; app pickers store IDs/paths as strings.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-4 border-t">
                                            <h4 className="text-xs font-semibold mb-3">UI Schema</h4>
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Widget</Label>
                                                    <WidgetPicker
                                                        fieldType={selectedElement.type}
                                                        types={types}
                                                        value={selectedElement.uiSchema?.['ui:widget']}
                                                        onChange={(val) => {
                                                            const newUiSchema = { ...selectedElement.uiSchema };
                                                            if (val === undefined) {
                                                                delete newUiSchema['ui:widget'];
                                                            } else {
                                                                newUiSchema['ui:widget'] = val;
                                                            }
                                                            updateSelectedElement({ uiSchema: newUiSchema });
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Placeholder</Label>
                                                    <Input
                                                        value={selectedElement.uiSchema?.['ui:placeholder'] || ''}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            updateSelectedElement({
                                                                uiSchema: { ...selectedElement.uiSchema, 'ui:placeholder': val || undefined }
                                                            });
                                                        }}
                                                        placeholder="Placeholder text..."
                                                        className="h-8 text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-sm text-muted-foreground mt-10">
                                        Select an element on the canvas to configure it.
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>

                    {showCategoryManager && selectedType && (
                        <CategoryManager
                            isOpen={showCategoryManager}
                            onClose={() => setShowCategoryManager(false)}
                            currentPageId={selectedType.id}
                            currentPageMeta={selectedType.meta || {}}
                            onPageMetaUpdate={async (newMeta) => {
                                if (onUpdateMeta) {
                                    await onUpdateMeta(newMeta);
                                }
                            }}
                            filterByType="types"
                            defaultMetaType="types"
                        />
                    )}
                </Card>
            </div>
        );
    };
