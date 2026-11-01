import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { T } from '@/i18n';
import type { CopyConflictPreset } from './hooks/useCopyTransfer';

export const CopyTransferOptions: React.FC<{
    includePatterns: string;
    excludePatterns: string;
    excludeDefault: boolean;
    conflictPreset: CopyConflictPreset;
    onIncludePatternsChange: (v: string) => void;
    onExcludePatternsChange: (v: string) => void;
    onExcludeDefaultChange: (v: boolean) => void;
    onConflictPresetChange: (v: CopyConflictPreset) => void;
    error?: string | null;
}> = ({
    includePatterns,
    excludePatterns,
    excludeDefault,
    conflictPreset,
    onIncludePatternsChange,
    onExcludePatternsChange,
    onExcludeDefaultChange,
    onConflictPresetChange,
    error,
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
                <Label className="text-xs"><T>Include</T></Label>
                <Input
                    value={includePatterns}
                    onChange={(e) => onIncludePatternsChange(e.target.value)}
                    placeholder="**/*"
                    className="h-8 text-xs font-mono"
                />
            </div>
            <div className="space-y-1">
                <Label className="text-xs"><T>Exclude</T></Label>
                <Input
                    value={excludePatterns}
                    onChange={(e) => onExcludePatternsChange(e.target.value)}
                    placeholder="**/node_modules/**"
                    className="h-8 text-xs font-mono"
                />
            </div>
            <div className="space-y-1">
                <Label className="text-xs"><T>Conflict handling</T></Label>
                <Select value={conflictPreset} onValueChange={(v) => onConflictPresetChange(v as CopyConflictPreset)}>
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ask">Ask per conflict</SelectItem>
                        <SelectItem value="overwrite_all">Overwrite all</SelectItem>
                        <SelectItem value="skip_all">Skip all</SelectItem>
                        <SelectItem value="if_newer">Only if newer</SelectItem>
                        <SelectItem value="rename_all">Rename all</SelectItem>
                        <SelectItem value="error">Stop on first conflict</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-end justify-between border rounded-md px-3 py-2">
                <Label className="text-xs"><T>Exclude defaults</T></Label>
                <Switch checked={excludeDefault} onCheckedChange={onExcludeDefaultChange} />
            </div>
            {error && (
                <p className="text-xs text-red-500 md:col-span-2">{error}</p>
            )}
        </div>
    );
};

export default CopyTransferOptions;

