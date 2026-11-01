import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { T } from '@/i18n';
import { formatSize } from '@/modules/storage/helpers';

export const CopyProgressDialog: React.FC<{
    open: boolean;
    busy: boolean;
    progress: number;
    fileProgress: number;
    filesDone: number;
    totalFiles: number;
    bytesTransferred: number;
    taskState?: string | null;
    error?: string | null;
    onOpenChange: (open: boolean) => void;
}> = ({
    open,
    busy,
    progress,
    fileProgress,
    filesDone,
    totalFiles,
    bytesTransferred,
    taskState,
    error,
    onOpenChange,
}) => {
    return (
        <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle><T>Copy Progress</T></DialogTitle>
                    <DialogDescription>
                        <T>Transfer progress for the current copy operation.</T>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground"><T>Total</T> {progress}%</div>
                        <Progress value={progress} className="h-2" />
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground"><T>Current file</T> {fileProgress}%</div>
                        <Progress value={fileProgress} className="h-2" />
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                        {filesDone}/{totalFiles} · {formatSize(bytesTransferred)}
                        {taskState ? ` · ${taskState}` : ''}
                    </p>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CopyProgressDialog;

