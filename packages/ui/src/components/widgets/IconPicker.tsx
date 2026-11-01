import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { T } from '@/i18n';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';

// Common icons suitable for tabs
const COMMON_ICONS = [
    'Layout', 'Monitor', 'Smartphone', 'Tablet', 'Grid', 'List', 'Type', 'Image', 'Video', 'FileText',
    'Settings', 'User', 'Users', 'Home', 'Calendar', 'Clock', 'Map', 'Link', 'ExternalLink',
    'Star', 'Heart', 'Bell', 'Search', 'Menu', 'X', 'Check', 'Plus', 'Minus', 'Info', 'AlertCircle',
    'ChevronRight', 'ChevronDown', 'ArrowRight', 'ArrowLeft', 'Layers', 'Box', 'Package', 'ShoppingBag',
    'CreditCard', 'DollarSign', 'PieChart', 'BarChart', 'Activity', 'Zap', 'Terminal', 'Code', 'Database'
];

interface IconPickerProps {
    value?: string;
    onChange: (iconName: string) => void;
    className?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange, className }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filteredIcons = COMMON_ICONS.filter(iconName =>
        iconName.toLowerCase().includes(search.toLowerCase())
    );

    const SelectedIcon = value && (Icons as any)[value] ? (Icons as any)[value] : Icons.Square;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn("w-10 h-8 p-0 shrink-0", className)}
                    title={value || "Select Icon"}
                >
                    <SelectedIcon className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-2 w-64" align="start">
                <div className="space-y-2">
                    <Input
                        placeholder="Search icons..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8 text-xs"
                    />
                    <ScrollArea className="h-48">
                        <div className="grid grid-cols-5 gap-1">
                            {filteredIcons.map(iconName => {
                                const Icon = (Icons as any)[iconName];
                                if (!Icon) return null;
                                return (
                                    <Button
                                        key={iconName}
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800",
                                            value === iconName && "bg-slate-100 dark:bg-slate-800 text-primary border border-primary/20"
                                        )}
                                        onClick={() => {
                                            onChange(iconName);
                                            setOpen(false);
                                        }}
                                        title={iconName}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </Button>
                                );
                            })}
                        </div>
                        {filteredIcons.length === 0 && (
                            <div className="p-4 text-center text-xs text-slate-500">
                                <T>No icons found</T>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </PopoverContent>
        </Popover>
    );
};
