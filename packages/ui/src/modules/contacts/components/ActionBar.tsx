import React from 'react';
import { T, translate } from '@/i18n';
import { ContactGroup } from '@/modules/contacts/client-contacts';
import { Button } from '@/components/ui/button';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
    Plus, Download, Trash2, X, FolderOpen, Layers
} from 'lucide-react';
import { STATUSES } from './StatusBadge';

interface ActionBarProps {
    count: number;
    total: number;
    groups: ContactGroup[];
    onSetGroup: (groupId: string) => void;
    onRemoveGroups: () => void;
    onSetStatus: (status: string) => void;
    onDelete: () => void;
    onClear: () => void;
    onExport: (format: 'json' | 'vcard') => void;
    onNew: () => void;
    busy: boolean;
    resetKey: number;
}

export const ActionBar = ({
    count,
    total,
    groups,
    onSetGroup,
    onRemoveGroups,
    onSetStatus,
    onDelete,
    onClear,
    onExport,
    onNew,
    busy,
    resetKey,
}: ActionBarProps) => {
    const hasSelection = count > 0;

    return (
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border">
            <span className="text-sm font-medium mr-2">
                {count > 0 ? (
                    <span className="text-primary">{count} <T>selected</T></span>
                ) : (
                    <span className="text-muted-foreground"><T>Zero selected</T> ({total} <T>total</T>)</span>
                )}
            </span>

            {/* Set group */}
            <Select key={`g-${resetKey}`} onValueChange={v => v === '__none' ? onRemoveGroups() : onSetGroup(v)} disabled={busy || total === 0}>
                <SelectTrigger className="h-7 w-36 text-xs">
                    <FolderOpen className="h-3 w-3 mr-1 text-muted-foreground" />
                    <SelectValue placeholder={translate('Set group…')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="__none"><T>None</T></SelectItem>
                    {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
            </Select>

            {/* Set status */}
            <Select key={`s-${resetKey}`} onValueChange={onSetStatus} disabled={busy || total === 0}>
                <SelectTrigger className="h-7 w-36 text-xs">
                    <Layers className="h-3 w-3 mr-1 text-muted-foreground" />
                    <SelectValue placeholder={translate('Set status…')} />
                </SelectTrigger>
                <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{translate(s)}</SelectItem>)}
                </SelectContent>
            </Select>

            {/* Delete */}
            {count > 0 ? (
                <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={onDelete} disabled={busy}>
                    <Trash2 className="h-3 w-3" /><T>Delete ({count})</T>
                </Button>
            ) : (
                <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={onDelete} disabled={busy || total === 0}>
                    <Trash2 className="h-3 w-3" /><T>Delete All ({total})</T>
                </Button>
            )}

            {hasSelection && (
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onClear} disabled={busy}>
                    <X className="h-3 w-3 mr-1" /><T>Clear</T>
                </Button>
            )}

            <div className="flex items-center gap-2 ml-auto">
                <Select onValueChange={f => onExport(f as any)}>
                    <SelectTrigger className="h-7 w-28 text-xs">
                        <Download className="h-3 w-3 mr-1" /><T>Export</T>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="vcard">vCard (.vcf)</SelectItem>
                    </SelectContent>
                </Select>

                <Button size="sm" className="h-7 text-xs gap-1" onClick={onNew}>
                    <Plus className="h-3 w-3" /><T>New</T>
                </Button>
            </div>
        </div>
    );
};
