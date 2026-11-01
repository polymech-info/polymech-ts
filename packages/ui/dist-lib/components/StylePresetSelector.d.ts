import { default as React } from 'react';
import { QuickAction } from '../constants';
interface StylePresetSelectorProps {
    presets: QuickAction[];
    onSelect: (preset: QuickAction) => void;
    disabled?: boolean;
    activeId?: string;
    className?: string;
    variant?: 'default' | 'minimal' | 'compact';
}
export declare const StylePresetSelector: React.FC<StylePresetSelectorProps>;
export {};
