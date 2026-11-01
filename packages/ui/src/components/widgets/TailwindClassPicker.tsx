import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { T } from '@/i18n';

interface TailwindClassGroup {
    label: string;
    classes: string[];
}

const TAILWIND_GROUPS: TailwindClassGroup[] = [
    {
        label: 'Layout & Sizing',
        classes: [
            'flex', 'grid', 'hidden', 'block', 'inline-block',
            'flex-col', 'flex-row', 'flex-wrap',
            'items-center', 'items-start', 'items-end', 'items-stretch',
            'justify-center', 'justify-between', 'justify-start', 'justify-end',
            'gap-1', 'gap-2', 'gap-4', 'gap-6', 'gap-8',
            'w-full', 'h-full', 'w-screen', 'h-screen',
            'max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl',
            'min-h-screen', 'min-h-[200px]',
            'relative', 'absolute', 'fixed', 'sticky', 'top-0', 'left-0', 'z-10', 'z-50',
            'overflow-hidden', 'overflow-auto'
        ]
    },
    {
        label: 'Spacing',
        classes: [
            'p-0', 'p-1', 'p-2', 'p-4', 'p-6', 'p-8', 'p-12',
            'px-2', 'px-4', 'px-6', 'px-8',
            'py-2', 'py-4', 'py-6', 'py-8',
            'm-0', 'm-2', 'm-4', 'm-8', 'm-auto',
            'mt-2', 'mt-4', 'mt-8', 'mb-2', 'mb-4', 'mb-8',
            'mx-auto'
        ]
    },
    {
        label: 'Typography',
        classes: [
            'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl',
            'font-thin', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-black',
            'tracking-tighter', 'tracking-tight', 'tracking-normal', 'tracking-wide', 'tracking-wider',
            'leading-none', 'leading-tight', 'leading-snug', 'leading-normal', 'leading-relaxed', 'leading-loose',
            'text-center', 'text-left', 'text-right', 'text-justify',
            'uppercase', 'lowercase', 'capitalize',
            'underline', 'line-through', 'no-underline',
            'truncate', 'break-words', 'whitespace-nowrap'
        ]
    },
    {
        label: 'Colors (Semantic)',
        classes: [
            'text-foreground', 'text-muted-foreground', 'text-primary', 'text-primary-foreground',
            'text-secondary', 'text-secondary-foreground', 'text-accent', 'text-accent-foreground',
            'text-destructive', 'text-white', 'text-black', 'text-transparent',
            'bg-background', 'bg-foreground', 'bg-card', 'bg-popover',
            'bg-primary', 'bg-secondary', 'bg-muted', 'bg-accent', 'bg-destructive',
            'bg-white', 'bg-black', 'bg-transparent'
        ]
    },
    {
        label: 'Appearance',
        classes: [
            'border', 'border-2', 'border-t', 'border-b', 'border-input', 'border-primary', 'border-border',
            'rounded-none', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-full',
            'shadow-sm', 'shadow', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl', 'shadow-none',
            'opacity-0', 'opacity-25', 'opacity-50', 'opacity-75', 'opacity-100',
            'backdrop-blur-none', 'backdrop-blur-sm', 'backdrop-blur', 'backdrop-blur-md', 'backdrop-blur-lg', 'backdrop-blur-xl',
            'grayscale', 'grayscale-0', 'invert', 'invert-0'
        ]
    },
    {
        label: 'Animation (Enter/Exit)',
        classes: [
            'animate-in', 'animate-out',
            'fade-in', 'fade-out',
            'zoom-in', 'zoom-out', 'zoom-in-95', 'zoom-in-50',
            'slide-in-from-top-2', 'slide-in-from-bottom-2', 'slide-in-from-left-2', 'slide-in-from-right-2',
            'duration-100', 'duration-200', 'duration-300', 'duration-500', 'duration-700', 'duration-1000',
            'ease-in', 'ease-out', 'ease-in-out',
            'delay-100', 'delay-200', 'delay-300', 'delay-500'
        ]
    }
];

interface TailwindClassPickerProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export const TailwindClassPicker: React.FC<TailwindClassPickerProps> = ({
    value = '',
    onChange,
    placeholder = "Select classes...",
    className
}) => {
    const [open, setOpen] = useState(false);

    // Split current value into array of classes
    const currentClasses = useMemo(() => {
        return value.trim().split(/\s+/).filter(Boolean);
    }, [value]);

    const handleSelect = (cls: string) => {
        const newClasses = currentClasses.includes(cls)
            ? currentClasses.filter(c => c !== cls)
            : [...currentClasses, cls];

        onChange(newClasses.join(' '));
    };

    const removeClass = (cls: string) => {
        onChange(currentClasses.filter(c => c !== cls).join(' '));
    };


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="relative flex-1">
                <Input
                    value={value}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className="font-mono text-xs pr-8"
                />
            </div>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        title="Pick Tailwind Classes"
                    >
                        <Wand2 className="h-4 w-4 text-blue-500" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="end">
                    <Command>
                        <CommandInput placeholder="Search classes..." />
                        <CommandList className="max-h-[300px]">
                            <CommandEmpty>No class found.</CommandEmpty>
                            {TAILWIND_GROUPS.map((group) => (
                                <CommandGroup key={group.label} heading={group.label}>
                                    {group.classes.map((cls) => (
                                        <CommandItem
                                            key={cls}
                                            value={cls}
                                            onSelect={() => handleSelect(cls)}
                                            className="text-xs"
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    currentClasses.includes(cls) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {cls}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            ))}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
};
