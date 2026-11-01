import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { T } from '@/i18n';

export const CopyConflictDialog: React.FC<{
    open: boolean;
    conflict?: { source: string; destination: string };
    resolving: boolean;
    error?: string | null;
    onDecision: (decision: 'overwrite' | 'overwrite_all' | 'skip' | 'skip_all' | 'cancel') => void;
    onOpenChange?: (open: boolean) => void;
}> = ({ open, conflict, resolving, error, onDecision, onOpenChange }) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle><T>Confirm File Overwrite</T></DialogTitle>
                    <DialogDescription>
                        <T>A file conflict was found. Choose how to continue.</T>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 text-xs font-mono">
                    <p>Overwrite: {conflict?.destination}</p>
                    <p>With: {conflict?.source}</p>
                </div>
                <div className="flex justify-end gap-2">
                    {error && <p className="text-xs text-red-500 mr-auto self-center">{error}</p>}
                    <Button size="sm" disabled={resolving} onClick={() => onDecision('overwrite')}>Yes</Button>
                    <Button size="sm" variant="secondary" disabled={resolving} onClick={() => onDecision('overwrite_all')}>All</Button>
                    <Button size="sm" variant="secondary" disabled={resolving} onClick={() => onDecision('skip')}>Skip</Button>
                    <Button size="sm" variant="secondary" disabled={resolving} onClick={() => onDecision('skip_all')}>Skip All</Button>
                    <Button size="sm" variant="destructive" disabled={resolving} onClick={() => onDecision('cancel')}>Cancel</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CopyConflictDialog;

