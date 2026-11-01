// Type Builder Editors for Enum and Flags
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ListOrdered, Flag, Plus, Trash2 } from 'lucide-react';
import { EnumValueEntry, FlagValueEntry } from './types';

export const EnumEditor = ({
    enumValues,
    setEnumValues
}: {
    enumValues: EnumValueEntry[];
    setEnumValues: (values: EnumValueEntry[]) => void;
}) => {
    return (
        <div className="max-w-lg mx-auto space-y-3">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <ListOrdered className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Enum Values</span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{enumValues.length}</span>
                </div>
            </div>
            {enumValues.length > 0 && (
                <div className="grid grid-cols-[1fr_1fr_auto] gap-x-2 gap-y-0 px-1 mb-1">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Value</span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Label</span>
                    <span className="w-7" />
                </div>
            )}
            {enumValues.map((entry, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center group">
                    <Input
                        value={entry.value}
                        onChange={(e) => {
                            const updated = [...enumValues];
                            updated[idx] = { ...entry, value: e.target.value };
                            setEnumValues(updated);
                        }}
                        placeholder="e.g. draft"
                        className="h-8 text-xs font-mono"
                    />
                    <Input
                        value={entry.label}
                        onChange={(e) => {
                            const updated = [...enumValues];
                            updated[idx] = { ...entry, label: e.target.value };
                            setEnumValues(updated);
                        }}
                        placeholder="e.g. Draft"
                        className="h-8 text-xs"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setEnumValues(enumValues.filter((_, i) => i !== idx))}
                    >
                        <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                </div>
            ))}
            <button
                onClick={() => setEnumValues([...enumValues, { value: '', label: '', order: enumValues.length }])}
                className="w-full py-2 text-xs font-medium border border-dashed rounded-md text-primary hover:bg-primary/5 hover:border-primary/50 transition-colors flex items-center justify-center gap-1.5"
            >
                <Plus className="h-3 w-3" /> Add Value
            </button>
        </div>
    );
};

export const FlagsEditor = ({
    flagValues,
    setFlagValues
}: {
    flagValues: FlagValueEntry[];
    setFlagValues: (values: FlagValueEntry[]) => void;
}) => {
    return (
        <div className="max-w-lg mx-auto space-y-3">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Flag Values</span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{flagValues.length}</span>
                </div>
            </div>
            {flagValues.length > 0 && (
                <div className="grid grid-cols-[1fr_80px_auto] gap-x-2 gap-y-0 px-1 mb-1">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Name</span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Bit</span>
                    <span className="w-7" />
                </div>
            )}
            {flagValues.map((entry, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_80px_auto] gap-2 items-center group">
                    <Input
                        value={entry.name}
                        onChange={(e) => {
                            const updated = [...flagValues];
                            updated[idx] = { ...entry, name: e.target.value };
                            setFlagValues(updated);
                        }}
                        placeholder="e.g. can_edit"
                        className="h-8 text-xs font-mono"
                    />
                    <Input
                        type="number"
                        value={entry.bit}
                        onChange={(e) => {
                            const updated = [...flagValues];
                            updated[idx] = { ...entry, bit: parseInt(e.target.value) || 0 };
                            setFlagValues(updated);
                        }}
                        className="h-8 text-xs font-mono text-center"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setFlagValues(flagValues.filter((_, i) => i !== idx))}
                    >
                        <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                </div>
            ))}
            <button
                onClick={() => {
                    const nextBit = flagValues.length > 0
                        ? Math.max(...flagValues.map(f => f.bit)) * 2
                        : 1;
                    setFlagValues([...flagValues, { name: '', bit: nextBit }]);
                }}
                className="w-full py-2 text-xs font-medium border border-dashed rounded-md text-primary hover:bg-primary/5 hover:border-primary/50 transition-colors flex items-center justify-center gap-1.5"
            >
                <Plus className="h-3 w-3" /> Add Flag
            </button>
            <p className="text-[10px] text-muted-foreground italic">
                Bit values should be powers of 2 (1, 2, 4, 8, 16...) for proper bitmasking.
            </p>
        </div>
    );
};
