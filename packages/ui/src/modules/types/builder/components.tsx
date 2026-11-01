import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { GripVertical, Trash2 } from 'lucide-react';
import { BuilderElement } from './types';
import { getIconForType, resolvePrimitiveType, WIDGET_OPTIONS } from './utils';
import { TypeDefinition } from '../client-types';

/**
 * DraggablePaletteItem
 * 
 * Represents an item in the left-hand sidebar palette (e.g., primitive types or existing models)
 * that the user can drag and drop onto the builder canvas to add a new field to their structure.
 * 
 * Utilizes `@dnd-kit/core`'s `useDraggable` hook to enable drag capabilities.
 * 
 * @param props.item - The element object containing type, title, and other metadata.
 */

export const DraggablePaletteItem = ({ item }: { item: BuilderElement }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: item.id,
        data: item,
    });

    const Icon = getIconForType(item.type);

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`flex items-center gap-2 p-2 border rounded-md cursor-grab hover:bg-muted ${isDragging ? 'opacity-50' : 'bg-background'}`}
        >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <Icon className="h-4 w-4" />
            <span className="text-sm font-medium">{item.title || item.name}</span>
        </div>
    );
};

/**
 * CanvasElement
 * 
 * Represents a field that has been dropped onto the central builder canvas.
 * 
 * Enables reordering via drag-and-drop using `@dnd-kit/sortable`'s `useSortable` hook.
 * It also encapsulates a delete/remove confirmation dialog, specifically distinguishing
 * between removing an inline primitive field versus unlinking/deleting a complex referenced type.
 * 
 * @param props.element - The active element structure currently on the canvas.
 * @param props.isSelected - Indicates whether this element is actively selected in the canvas.
 * @param props.onSelect - Callback triggered when the user clicks the element to edit its properties.
 * @param props.onDelete - Callback to permanently delete a referenced type from the underlying database.
 * @param props.onRemoveOnly - Optional callback to merely unlink the field from the structure without destroying the type.
 */
export const CanvasElement = ({
    element,
    isSelected,
    onSelect,
    onDelete,
    onRemoveOnly
}: {
    element: BuilderElement,
    isSelected: boolean,
    onSelect: () => void,
    onDelete: () => void,
    onRemoveOnly?: () => void
}) => {
    const Icon = getIconForType(element.type);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const primitiveTypes = ['string', 'number', 'int', 'float', 'boolean', 'bool', 'array', 'object'];
    const isPrimitive = primitiveTypes.includes(element.type.toLowerCase());

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: element.id, data: element });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className={`p-3 border rounded-md mb-2 cursor-pointer flex items-center justify-between group ${isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50 bg-background'}`}
        >
            <div className="flex items-center gap-2">
                <div {...attributes} {...listeners} className="cursor-grab hover:bg-muted p-1 rounded -ml-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground opacity-50 hover:opacity-100" />
                </div>
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{element.title || element.name}</span>
                    <span className="text-xs text-muted-foreground">
                        {element.type}
                        {element.group && <span className="ml-2 px-1.5 py-0.5 rounded-full bg-secondary text-[10px] text-secondary-foreground">{element.group}</span>}
                    </span>
                </div>
            </div>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Field?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div>
                                {isPrimitive ? (
                                    <>This will remove the field "{element.title || element.name}" from the structure.</>
                                ) : (
                                    <>
                                        Choose how to remove the field "{element.title || element.name}":
                                        <ul className="mt-2 space-y-1 text-xs">
                                            <li><strong>Remove Only:</strong> Unlink from this structure but keep the field type in the database</li>
                                            <li><strong>Delete in Database:</strong> Remove from structure and permanently delete the field type</li>
                                        </ul>
                                    </>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        {isPrimitive ? (
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onRemoveOnly) onRemoveOnly();
                                    setShowDeleteDialog(false);
                                }}
                            >
                                Remove
                            </AlertDialogAction>
                        ) : (
                            <>
                                {onRemoveOnly && (
                                    <AlertDialogAction
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveOnly();
                                            setShowDeleteDialog(false);
                                        }}
                                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                    >
                                        Remove Only
                                    </AlertDialogAction>
                                )}
                                <AlertDialogAction
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete();
                                        setShowDeleteDialog(false);
                                    }}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Delete in Database
                                </AlertDialogAction>
                            </>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

/**
 * WidgetPicker
 * 
 * A specialized select input that allows users to pick a custom RJSF widget
 * (e.g. a date picker, color picker, or app browser) for the current field.
 * 
 * It filters the list of available widgets based on the field's underlying primitive type.
 * If no predefined widget matches the user's needs, it supports entering a freeform "custom" string.
 * 
 * @param props.value - The currently selected custom widget's name (or undefined if defaulting).
 * @param props.onChange - Callback to map the updated widget selection back to the field's UI schema.
 * @param props.fieldType - The type identifier of the current element.
 * @param props.types - Full registry of all available type definitions (to resolve complex primitives).
 */
export const WidgetPicker = ({ value, onChange, fieldType, types }: { value: string | undefined, onChange: (val: string | undefined) => void, fieldType: string, types: TypeDefinition[] }) => {
    const primitiveType = resolvePrimitiveType(fieldType, types);

    const filteredOptions = WIDGET_OPTIONS.map(group => ({
        ...group,
        options: group.options.filter(opt => !opt.types || (opt.types as string[]).includes(primitiveType))
    })).filter(group => group.options.length > 0);

    const isCustom = value !== undefined && (value === '' || !filteredOptions.some(g => g.options.some(o => o.value === value)));
    const selectedKey = value === undefined ? 'default' : (isCustom ? 'custom' : value);

    return (
        <div className="space-y-2">
            <Select value={selectedKey} onValueChange={(val) => {
                if (val === 'default') onChange(undefined);
                else if (val === 'custom') onChange('');
                else onChange(val);
            }}>
                <SelectTrigger className="h-8 text-xs w-full">
                    <SelectValue placeholder={`Select a widget (${primitiveType})`} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="default" className="text-xs">Default (Auto)</SelectItem>
                    <SelectItem value="custom" className="text-xs font-medium">Custom...</SelectItem>
                    {filteredOptions.map(group => (
                        <React.Fragment key={group.label}>
                            <div className="px-2 py-1.5 text-[0.625rem] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 mt-1">
                                {group.label}
                            </div>
                            {group.options.map(opt => (
                                <SelectItem key={opt.value} value={opt.value} className="text-xs pl-4">
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </React.Fragment>
                    ))}
                </SelectContent>
            </Select>
            {selectedKey === 'custom' && (
                <Input
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    placeholder="Enter custom widget name..."
                    className="h-8 text-xs"
                    autoFocus
                />
            )}
        </div>
    );
};
