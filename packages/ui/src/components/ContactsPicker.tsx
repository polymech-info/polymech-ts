import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Search, Users, FolderOpen, Check, Loader2 } from 'lucide-react';
import { T, translate } from '@/i18n';
import {
    ContactGroup,
    fetchContactGroups, fetchGroupMembers,
} from '@/modules/contacts/client-contacts';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ContactsPickerProps {
    /** Currently selected group IDs (controlled). */
    value?: string[];
    /** Called whenever the selection changes. */
    onChange?: (groupIds: string[]) => void;
    /** If provided, wraps the picker in a Dialog triggered by `trigger`. */
    trigger?: React.ReactNode;
    /** Called when the dialog confirms selection. Only used in dialog mode. */
    onConfirm?: (groupIds: string[]) => void;
    /** Disable all interactions. */
    disabled?: boolean;
    /** Placeholder shown when nothing is selected. */
    placeholder?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ContactsPicker = ({
    value,
    onChange,
    trigger,
    onConfirm,
    disabled,
    placeholder,
}: ContactsPickerProps) => {
    const [groups, setGroups] = useState<ContactGroup[]>([]);
    const [memberCounts, setMemberCounts] = useState<Map<string, number>>(new Map());
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Dialog mode state
    const [open, setOpen] = useState(false);
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set(value ?? []));

    const selectedIds = new Set(value ?? []);
    const isDialog = !!trigger;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [g, members] = await Promise.all([
                fetchContactGroups(),
                fetchGroupMembers(),
            ]);
            setGroups(g);
            // Count contacts per group
            const counts = new Map<string, number>();
            for (const m of members) {
                counts.set(m.group_id, (counts.get(m.group_id) || 0) + 1);
            }
            setMemberCounts(counts);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Sync pendingIds when value changes externally (dialog mode)
    useEffect(() => { setPendingIds(new Set(value ?? [])); }, [value]);

    const toggle = (id: string) => {
        if (disabled) return;
        if (isDialog) {
            setPendingIds(prev => {
                const next = new Set(prev);
                next.has(id) ? next.delete(id) : next.add(id);
                return next;
            });
        } else {
            const next = new Set(selectedIds);
            next.has(id) ? next.delete(id) : next.add(id);
            onChange?.(Array.from(next));
        }
    };

    const handleConfirm = () => {
        const ids = Array.from(pendingIds);
        onChange?.(ids);
        onConfirm?.(ids);
        setOpen(false);
    };

    const filtered = groups.filter(g => {
        if (!search) return true;
        return g.name.toLowerCase().includes(search.toLowerCase());
    });

    const activeSet = isDialog ? pendingIds : selectedIds;

    // ─── Render list ──────────────────────────────────────────────────────────

    const listContent = (
        <div className="space-y-2">
            {groups.length > 5 && (
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        className="pl-8 h-8 text-sm"
                        placeholder={translate('Search groups…')}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            ) : filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                    <T>{groups.length === 0 ? 'No groups yet.' : 'No matching groups.'}</T>
                </p>
            ) : (
                <div className="divide-y rounded-lg border max-h-[300px] overflow-y-auto">
                    {filtered.map(g => {
                        const checked = activeSet.has(g.id);
                        const count = memberCounts.get(g.id) || 0;
                        return (
                            <div
                                key={g.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => !disabled && toggle(g.id)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(g.id); } }}
                                className={`flex items-center w-full gap-3 px-3 py-2.5 text-sm text-left transition-colors
                                    ${checked ? 'bg-primary/5' : 'hover:bg-muted/50'}
                                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <Checkbox checked={checked} tabIndex={-1} className="pointer-events-none" />
                                <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="flex-1 truncate">{g.name}</span>
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 tabular-nums">
                                    {count}
                                </Badge>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeSet.size > 0 && (
                <p className="text-xs text-muted-foreground text-right">
                    {activeSet.size} {translate(activeSet.size !== 1 ? 'groups selected' : 'group selected')}
                </p>
            )}
        </div>
    );

    // ─── Dialog mode ──────────────────────────────────────────────────────────

    if (isDialog) {
        return (
            <>
                <span onClick={() => !disabled && setOpen(true)}>{trigger}</span>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <T>Select Groups</T>
                            </DialogTitle>
                        </DialogHeader>
                        {listContent}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>
                                <T>Cancel</T>
                            </Button>
                            <Button onClick={handleConfirm}>
                                <Check className="h-3 w-3 mr-1" />
                                <T>Confirm</T>
                                {pendingIds.size > 0 && (
                                    <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                                        {pendingIds.size}
                                    </Badge>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    // ─── Inline mode ──────────────────────────────────────────────────────────

    return listContent;
};
