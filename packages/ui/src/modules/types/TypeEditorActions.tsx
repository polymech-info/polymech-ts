import React from 'react';
import { useActions } from '@/actions/useActions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TypeEditorActionsProps {
    actionIds?: string[];
    className?: string;
}

export const TypeEditorActions: React.FC<TypeEditorActionsProps> = ({
    actionIds = ['types.new', 'types.edit.visual', 'types.preview.toggle', 'types.translate', 'types.delete', 'types.save'],
    className
}) => {
    const { actions, executeAction } = useActions();

    const renderActionButton = (actionId: string) => {
        const action = actions[actionId];
        if (!action) return null;

        // Respect visible property if present, default to true
        if (action.visible === false) return null;

        const Icon = action.icon;

        // Determine variant based on metadata or conventions
        let variant: "default" | "destructive" | "outline" | "secondary" | "ghost" = "outline";

        if (actionId === 'types.save') variant = 'default';
        if (actionId === 'types.delete') variant = 'destructive';
        if (actionId === 'types.cancel') variant = 'ghost';
        if (action.metadata?.variant) variant = action.metadata.variant;
        if (action.metadata?.active) variant = 'secondary'; // Or default?

        return (
            <Button
                key={actionId}
                variant={variant}
                size="sm"
                onClick={() => executeAction(actionId)}
                disabled={action.disabled}
                className={cn("gap-2", action.metadata?.className)}
                title={action.tooltip}
            >
                {Icon && <Icon className="h-4 w-4" />}
                {action.label}
            </Button>
        );
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {actionIds.map(id => renderActionButton(id))}
        </div>
    );
};
