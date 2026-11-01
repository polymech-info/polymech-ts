import React, { useEffect, useImperativeHandle } from 'react';
import { TypeDefinition } from '../client-types';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { typeBuilderCollisionDetection } from './typeBuilderCollision';
import { arrayMove } from '@dnd-kit/sortable';
import { BuilderOutput, BuilderElement } from './types';
import { TypeBuilderContent } from './TypeBuilderContent';
import { DraggablePaletteItem } from './components';
import { useBuilderStore } from './useStore';

export * from './types';

export interface TypeBuilderRef {
    triggerSave: () => void;
}

/**
 * TypeBuilder
 * 
 * The top-level orchestrator for the visual schema builder.
 * 
 * Responsibilities:
 * 1. Establishing the `@dnd-kit` drag-and-drop context (`DndContext` and `DragOverlay`).
 * 2. Wiring drag events (start, end/drop) into the central `useBuilderStore` to manage field creation and sorting.
 * 3. Initializing the global drag-and-drop state when editing an existing type or creating a new one.
 * 
 * Note: It intentionally delegates actual visual rendering to `TypeBuilderContent` to ensure that inner hooks 
 * successfully resolve the context established by the wrap providers here.
 */
export const TypeBuilder = React.forwardRef<TypeBuilderRef, {
    onSave: (data: BuilderOutput) => void,
    onCancel: () => void,
    availableTypes: TypeDefinition[],
    initialData?: BuilderOutput,
    types: TypeDefinition[]; // Add types to props
    selectedType?: TypeDefinition;
    onUpdateMeta?: (meta: any) => Promise<void>;
}>(({ onSave, onCancel, availableTypes, initialData, types, selectedType, onUpdateMeta }, ref) => {

    const {
        mode,
        elements,
        typeName,
        typeDescription,
        fieldsToDelete,
        enumValues,
        flagValues,
        activeDragItem,
        setElements,
        setActiveDragItem,
        setSelectedId,
        initialize
    } = useBuilderStore();

    // Initialize store when component mounts or initialData changes
    useEffect(() => {
        initialize(initialData);
    }, [initialData, initialize]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    useImperativeHandle(ref, () => ({
        triggerSave: () => {
            if (typeName.trim()) {
                onSave({ mode, elements, name: typeName, description: typeDescription, fieldsToDelete, enumValues, flagValues });
            }
        }
    }));

    const handleDragStart = (e: any) => {
        setActiveDragItem(e.active.data.current as BuilderElement);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveDragItem(null);
        const { over, active } = event;

        if (!over) return;

        // If sorting elements inside canvas
        if (active.id !== over.id && elements.find(e => e.id === active.id) && elements.find(e => e.id === over.id)) {
            setElements(items => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
            return;
        }

        if (over.id === 'canvas' && active.data.current) {
            const dragged = active.data.current as BuilderElement;

            if (mode === 'alias') {
                if ('isCustom' in dragged) return;
                const newElement: BuilderElement = {
                    id: `field-${Date.now()}`,
                    type: dragged.type,
                    name: 'value',
                    title: dragged.title?.trim() ? dragged.title : dragged.type + ' Alias',
                    uiSchema: dragged.uiSchema && Object.keys(dragged.uiSchema).length > 0 ? { ...dragged.uiSchema } : {},
                    refId: dragged.refId
                };
                setElements([newElement]);
                setSelectedId(newElement.id);
            } else {
                const n = elements.length + 1;
                const newElement: BuilderElement = {
                    id: `field-${Date.now()}`,
                    type: dragged.type,
                    name: dragged.name?.trim() ? dragged.name : `field${n}`,
                    title: dragged.title?.trim() ? dragged.title : `Field ${n}`,
                    uiSchema: dragged.uiSchema && Object.keys(dragged.uiSchema).length > 0 ? { ...dragged.uiSchema } : {},
                    refId: dragged.refId,
                    ...(dragged.description !== undefined ? { description: dragged.description } : {}),
                };
                setElements(prev => [...prev, newElement]);
                setSelectedId(newElement.id);
            }
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={typeBuilderCollisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <TypeBuilderContent
                onCancel={onCancel}
                onSave={onSave}
                availableTypes={availableTypes}
                types={types}
                selectedType={selectedType}
                onUpdateMeta={onUpdateMeta}
            />
            <DragOverlay>
                {activeDragItem ? (
                    <div className="opacity-80 scale-105 pointer-events-none">
                        <DraggablePaletteItem item={activeDragItem} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
});
