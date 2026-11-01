import React from 'react';
import { Button } from '@/components/ui/button';
import { QuickAction } from '@/constants';
import { cn } from '@/lib/utils';

interface StylePresetSelectorProps {
    presets: QuickAction[];
    onSelect: (preset: QuickAction) => void;
    disabled?: boolean;
    activeId?: string;
    className?: string;
    variant?: 'default' | 'minimal' | 'compact';
}

export const StylePresetSelector: React.FC<StylePresetSelectorProps> = ({
    presets,
    onSelect,
    disabled = false,
    activeId,
    className = '',
    variant = 'default',
}) => {
    if (presets.length === 0) return null;

    return (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
            {presets.map((preset) => (
                <Button
                    key={preset.id}
                    type="button"
                    variant={variant === 'minimal' ? 'ghost' : 'secondary'}
                    size="sm"
                    disabled={disabled}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(preset);
                    }}
                    className={cn(
                        variant === 'minimal'
                            ? 'h-6 px-2.5 text-xs text-white border border-white/20 hover:bg-white/20 hover:text-white rounded-full bg-black/40 backdrop-blur-md shadow-sm transition-all duration-200 hover:scale-105'
                            : 'h-8 px-3 text-xs',
                        activeId === preset.id && 'ring-2 ring-primary bg-primary/20',
                        "transition-all duration-200"
                    )}
                    title={preset.prompt}
                >
                    {preset.icon && <span className="mr-1.5">{preset.icon}</span>}
                    <span>{preset.name}</span>
                </Button>
            ))}
        </div>
    );
};
