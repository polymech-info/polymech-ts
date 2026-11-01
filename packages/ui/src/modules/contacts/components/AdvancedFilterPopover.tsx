import React from 'react';
import { T, translate } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
    Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Plus, SlidersHorizontal, X } from 'lucide-react';

export interface AdvancedFilter {
    field: string;
    op: string;
    value: string;
    metaKey?: string;
}

export const ADV_FIELDS = [
    { id: 'name', label: 'Name' },
    { id: 'organization', label: 'Organization' },
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'website', label: 'Website' },
    { id: 'tags', label: 'Tag' },
    { id: 'city', label: 'City' },
    { id: 'country', label: 'Country' },
    { id: 'status', label: 'Status' },
    { id: 'group', label: 'Group' },
    { id: 'meta_all', label: 'Any Metadata' },
    { id: 'meta_key', label: 'Metadata (By Key)' }
];

export const ADV_OPS = ['contains', 'does not contain', 'equals', 'does not equal', 'starts with', 'ends with', 'is empty', 'is not empty', 'is any of'];

interface AdvancedFilterPopoverProps {
    filters: AdvancedFilter[];
    onFiltersChange: (filters: AdvancedFilter[]) => void;
}

export const AdvancedFilterPopover = ({
    filters,
    onFiltersChange,
}: AdvancedFilterPopoverProps) => {
    const addRule = () => onFiltersChange([...filters, { field: 'name', op: 'contains', value: '' }]);
    const removeRule = (i: number) => onFiltersChange(filters.filter((_, idx) => idx !== i));
    const updateRule = (i: number, patch: Partial<AdvancedFilter>) => {
        const next = [...filters];
        next[i] = { ...next[i], ...patch };
        onFiltersChange(next);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className={`absolute right-1 h-6 w-6 rounded-sm ${filters.length ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-max min-w-[320px] max-w-[95vw] p-3 shadow-xl">
                <div className="space-y-3">
                    <div>
                        <h4 className="text-sm font-semibold mb-1"><T>Advanced Search</T></h4>
                        <p className="text-xs text-muted-foreground"><T>Requires all specific rules to match.</T></p>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto overflow-x-hidden px-1 py-1 -mx-1 -my-1">
                        {filters.map((f, i) => (
                            <div key={i} className="flex gap-1 items-center animate-in fade-in slide-in-from-top-1">
                                <Select value={f.field} onValueChange={v => updateRule(i, { field: v })}>
                                    <SelectTrigger className="h-7 w-[90px] text-xs px-2 shrink-0">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ADV_FIELDS.map(af => <SelectItem key={af.id} value={af.id}>{translate(af.label)}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {f.field === 'meta_key' && (
                                    <Input className="h-7 text-xs w-[100px] shrink-0" value={f.metaKey || ''} placeholder={translate('Key')}
                                        onChange={e => updateRule(i, { metaKey: e.target.value })} />
                                )}
                                <Select value={f.op} onValueChange={v => updateRule(i, { op: v })}>
                                    <SelectTrigger className="h-7 w-[110px] text-xs px-2 shrink-0">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ADV_OPS.map(op => <SelectItem key={op} value={op}><T>{op}</T></SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {!['is empty', 'is not empty'].includes(f.op) && (
                                    <Input className="h-7 text-xs flex-1 min-w-[60px]" value={f.value} placeholder={translate('value')}
                                        onChange={e => updateRule(i, { value: e.target.value })} />
                                )}
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0"
                                    onClick={() => removeRule(i)}>
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                        {filters.length === 0 && (
                            <div className="py-4 text-center text-xs text-muted-foreground border rounded bg-muted/30">
                                <T>No specific field rules yet.</T>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t">
                        <Button size="sm" variant="outline" className="h-7 text-xs flex-1"
                            onClick={addRule}>
                            <Plus className="h-3 w-3 mr-1" /><T>Add Rule</T>
                        </Button>
                        {filters.length > 0 && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onFiltersChange([])}>
                                <T>Clear</T>
                            </Button>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
