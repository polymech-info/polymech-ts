import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { T } from '@/i18n';
import { Plus, Trash2, GripVertical, Settings2 } from 'lucide-react';
import { TabDefinition } from './TabsWidget';

// Local helpers since we might not have uuid/slugify
const generateId = () => Math.random().toString(36).substring(2, 9);

const slugify = (text: string) => text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text

import { IconPicker } from './IconPicker';

interface TabsPropertyEditorProps {
    value: TabDefinition[];
    onChange: (tabs: TabDefinition[]) => void;
    widgetInstanceId: string;
}

const SortableTabItem = ({
    tab,
    onRemove,
    onUpdate
}: {
    tab: TabDefinition;
    onRemove: (id: string) => void;
    onUpdate: (id: string, updates: Partial<TabDefinition>) => void;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: tab.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700/50 mb-2">
            <div className="flex items-center gap-2">
                <button {...attributes} {...listeners} className="cursor-grab hover:text-slate-900 dark:hover:text-slate-200 text-slate-400">
                    <GripVertical className="h-4 w-4" />
                </button>

                <IconPicker
                    value={tab.icon}
                    onChange={(newIcon) => onUpdate(tab.id, { icon: newIcon })}
                />

                <Input
                    value={tab.label}
                    onChange={(e) => onUpdate(tab.id, { label: e.target.value })}
                    className="h-8 text-sm flex-1"
                    placeholder="Tab Label"
                />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(tab.id)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            {/* Optional: Icon picker or other details here */}
            <div className="pl-6 text-[10px] text-slate-400 font-mono truncate">
                ID: {tab.layoutId}
            </div>
        </div>
    );
};

export const TabsPropertyEditor: React.FC<TabsPropertyEditorProps> = ({
    value = [],
    onChange,
    widgetInstanceId
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = value.findIndex((item) => item.id === active.id);
            const newIndex = value.findIndex((item) => item.id === over.id);
            onChange(arrayMove(value, oldIndex, newIndex));
        }
    };

    const handleAddTab = () => {
        const label = `New Tab ${value.length + 1}`;
        // Use a UUID for the layout ID to ensure DB compatibility
        // The ID format should comprise 'layout-' prefix followed by a UUID.
        // We can use crypto.randomUUID() if available, or a simple fallback.
        const uuid = self.crypto?.randomUUID ? self.crypto.randomUUID() :
            'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });

        const layoutId = `layout-${uuid}`;

        // We can use a simpler ID for the tab itself, or reuse the UUID
        const newId = uuid;

        const newTab: TabDefinition = {
            id: newId,
            label: label,
            layoutId: layoutId,
            icon: 'Square' // Default icon
        };

        onChange([...value, newTab]);
    };

    const handleRemoveTab = (id: string) => {
        if (confirm("Are you sure? The layout for this tab will be detached (but not deleted from DB immediately).")) {
            onChange(value.filter(t => t.id !== id));
        }
    };

    const handleUpdateTab = (id: string, updates: Partial<TabDefinition>) => {
        onChange(value.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    return (
        <div className="space-y-4">
            <div className="text-xs text-slate-500">
                <T>Manage your tabs below. Drag to reorder.</T>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={value.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {value.map((tab) => (
                            <SortableTabItem
                                key={tab.id}
                                tab={tab}
                                onRemove={handleRemoveTab}
                                onUpdate={handleUpdateTab}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <Button
                onClick={handleAddTab}
                variant="outline"
                size="sm"
                className="w-full border-dashed"
            >
                <Plus className="h-4 w-4 mr-2" />
                <T>Add Tab</T>
            </Button>
        </div>
    );
};
