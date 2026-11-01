import React from 'react';
import { widgetRegistry } from '@/lib/widgetRegistry';
import { GripVertical } from 'lucide-react';

interface DragPreviewProps {
    data: {
        type: 'existing-widget' | 'new-widget';
        widgetId?: string;
        widgetInstanceId?: string;
        widgetDefId?: string;
        label?: string;
    };
}

export const DragPreview: React.FC<DragPreviewProps> = ({ data }) => {
    const defId = data.widgetDefId || data.widgetId;
    const widgetDef = defId ? widgetRegistry.get(defId) : null;
    const Icon = widgetDef?.metadata.icon || GripVertical;
    const name = data.label || widgetDef?.metadata.name || 'Widget';

    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/90 text-white text-sm font-medium shadow-xl backdrop-blur-sm border border-blue-400/50 pointer-events-none">
            <Icon className="h-4 w-4" />
            <span>{name}</span>
        </div>
    );
};
