import React from 'react';
import { T, translate } from '@/i18n';
import { ContactGroup } from '@/modules/contacts/client-contacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';

interface GroupsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groups: ContactGroup[];
    newGroupName: string;
    onNewGroupNameChange: (name: string) => void;
    onCreateGroup: () => void;
    onDeleteGroup: (id: string) => void;
    busy: boolean;
}

export const GroupsDialog = ({
    open,
    onOpenChange,
    groups,
    newGroupName,
    onNewGroupNameChange,
    onCreateGroup,
    onDeleteGroup,
    busy,
}: GroupsDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle><T>Contact Groups</T></DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <Input placeholder={translate('New group name…')} value={newGroupName}
                            onChange={e => onNewGroupNameChange(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && onCreateGroup()} />
                        <Button size="sm" onClick={onCreateGroup} disabled={busy || !newGroupName.trim()}>
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>
                    <div className="divide-y rounded-lg border">
                        {groups.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-4"><T>No groups yet.</T></p>
                        )}
                        {groups.map(g => (
                            <div key={g.id} className="flex items-center justify-between px-3 py-2 text-sm group">
                                <span>{g.name}</span>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                                    onClick={() => onDeleteGroup(g.id)}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
