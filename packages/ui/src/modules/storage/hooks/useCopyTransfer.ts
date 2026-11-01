import { useCallback, useEffect, useMemo, useState } from 'react';
import type { INode } from '@/modules/storage/types';
import type { AppEvent } from '@/types-server';
import type { FilePickerResult } from '@/modules/storage/FilePicker';
import { vfsGetTaskStatus, vfsResolveTaskConflict, vfsStartTransferTask, type VfsTaskStatus } from '@/modules/storage/client-vfs';

export type CopyConflictPreset = 'ask' | 'overwrite_all' | 'skip_all' | 'if_newer' | 'rename_all' | 'error';

type StreamLike = {
    subscribe: (cb: (event: AppEvent) => void) => () => void;
};

export function useCopyTransfer(params: {
    mount: string;
    selectedSources: INode[];
    stream?: StreamLike | null;
    onCompleted: () => void;
}) {
    const { mount, selectedSources, stream, onCompleted } = params;

    const [copyDialogOpen, setCopyDialogOpen] = useState(false);
    const [copyIncludePatterns, setCopyIncludePatterns] = useState<string>('**/*');
    const [copyExcludePatterns, setCopyExcludePatterns] = useState<string>('**/node_modules/**');
    const [copyExcludeDefault, setCopyExcludeDefault] = useState(true);
    const [copyConflictPreset, setCopyConflictPreset] = useState<CopyConflictPreset>('ask');

    const [copyBusy, setCopyBusy] = useState(false);
    const [copyError, setCopyError] = useState<string | null>(null);
    const [copyTaskId, setCopyTaskId] = useState<string | null>(null);
    const [copyTaskState, setCopyTaskState] = useState<VfsTaskStatus['state'] | null>(null);
    const [copyConflict, setCopyConflict] = useState<VfsTaskStatus['conflict'] | undefined>(undefined);
    const [resolvingConflict, setResolvingConflict] = useState(false);
    const [copyProgress, setCopyProgress] = useState({
        open: false,
        progress: 0,
        fileProgress: 0,
        filesDone: 0,
        totalFiles: 0,
        bytesTransferred: 0,
    });
    const [frozenCopySources, setFrozenCopySources] = useState<INode[]>([]);

    const copyEnabled = useMemo(
        () => selectedSources.length > 0 && !copyBusy,
        [selectedSources.length, copyBusy]
    );

    const parsePatternCsv = useCallback((raw: string): string[] => {
        return raw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }, []);

    const handleCopyRequest = useCallback(() => {
        if (!copyEnabled) return;
        setFrozenCopySources(selectedSources);
        setCopyError(null);
        setCopyDialogOpen(true);
    }, [copyEnabled, selectedSources]);

    useEffect(() => {
        if (!stream || !copyTaskId) return;
        const unsubscribe = stream.subscribe((event: AppEvent) => {
            if (event.kind !== 'system' || event.type !== 'vfs-task') return;
            if (String((event.data as any)?.id || '') !== copyTaskId) return;

            const task = event.data as unknown as VfsTaskStatus;
            setCopyTaskState(task.state);
            setCopyConflict(task.conflict);
            setCopyProgress((prev) => ({
                ...prev,
                progress: Number(task.progress || prev.progress || 0),
                fileProgress: task.state === 'paused_for_conflict'
                    ? prev.fileProgress
                    : Number(task.progress || prev.fileProgress || 0),
                filesDone: Number(task.filesDone || prev.filesDone || 0),
                totalFiles: Number(task.totalFiles || prev.totalFiles || 0),
                bytesTransferred: Number(task.bytesCopied || prev.bytesTransferred || 0),
            }));

            if (task.state === 'completed' || task.state === 'failed' || task.state === 'cancelled') {
                setCopyBusy(false);
                setResolvingConflict(false);
                if (task.state === 'completed') {
                    onCompleted();
                    setTimeout(() => setCopyProgress((prev) => ({ ...prev, open: false })), 800);
                } else {
                    setCopyError(task.error || `Task ${task.state}`);
                }
                setCopyTaskId(null);
            }
        });
        return unsubscribe;
    }, [stream, copyTaskId, onCompleted]);

    useEffect(() => {
        if (!copyTaskId || copyTaskState !== 'paused_for_conflict' || copyConflict) return;
        let active = true;
        const t = window.setTimeout(async () => {
            try {
                const status = await vfsGetTaskStatus(copyTaskId);
                if (!active) return;
                setCopyTaskState(status.state);
                setCopyConflict(status.conflict);
                setCopyProgress((prev) => ({
                    ...prev,
                    progress: Number(status.progress || prev.progress || 0),
                    filesDone: Number(status.filesDone || prev.filesDone || 0),
                    totalFiles: Number(status.totalFiles || prev.totalFiles || 0),
                    bytesTransferred: Number(status.bytesCopied || prev.bytesTransferred || 0),
                }));
            } catch {
                // no-op fallback
            }
        }, 350);
        return () => {
            active = false;
            window.clearTimeout(t);
        };
    }, [copyTaskId, copyTaskState, copyConflict]);

    const handleCopyConfirm = useCallback(async (result: FilePickerResult) => {
        const destinationDirectory = (result.fullPath || '/').replace(/^\/+/, '');
        const includePatterns = parsePatternCsv(copyIncludePatterns);
        const excludePatterns = parsePatternCsv(copyExcludePatterns);
        const items = frozenCopySources;
        if (items.length === 0) return;

        const conflictMode = copyConflictPreset === 'ask' ? 'manual' : 'auto';
        const conflictStrategy = copyConflictPreset === 'ask'
            ? 'error'
            : copyConflictPreset === 'rename_all'
                ? 'rename'
                : copyConflictPreset;

        setCopyBusy(true);
        setCopyError(null);
        setCopyConflict(undefined);
        setCopyProgress({
            open: true,
            progress: 0,
            fileProgress: 0,
            filesDone: 0,
            totalFiles: items.length,
            bytesTransferred: 0,
        });

        try {
            const started = await vfsStartTransferTask({
                operation: 'copy',
                sources: items.map((node) => ({
                    mount,
                    path: node.path.replace(/^\/+/, ''),
                })),
                destination: { mount: result.mount, path: destinationDirectory },
                conflictMode,
                conflictStrategy: conflictStrategy as any,
                includePatterns,
                excludePatterns,
                excludeDefault: copyExcludeDefault,
            });
            setCopyTaskId(started.taskId);
            setCopyTaskState('running');
            setCopyDialogOpen(false);
        } catch (err: any) {
            setCopyError(err?.message || String(err));
            setCopyBusy(false);
            setCopyTaskId(null);
            setCopyTaskState(null);
        }
    }, [
        mount,
        parsePatternCsv,
        copyIncludePatterns,
        copyExcludePatterns,
        frozenCopySources,
        copyConflictPreset,
        copyExcludeDefault,
    ]);

    const resolveConflictDecision = useCallback(async (decision: string) => {
        if (!copyTaskId) return;
        setResolvingConflict(true);
        try {
            const res = await vfsResolveTaskConflict(copyTaskId, decision);
            if (res.success) {
                setCopyConflict(undefined);
                const status = await vfsGetTaskStatus(copyTaskId).catch(() => null);
                if (status) {
                    setCopyTaskState(status.state);
                    setCopyConflict(status.conflict);
                }
            } else {
                setCopyError('Conflict decision was not accepted. Please try again.');
            }
        } finally {
            setResolvingConflict(false);
        }
    }, [copyTaskId]);

    return {
        copyEnabled,
        copyDialogOpen,
        setCopyDialogOpen,
        copyIncludePatterns,
        setCopyIncludePatterns,
        copyExcludePatterns,
        setCopyExcludePatterns,
        copyExcludeDefault,
        setCopyExcludeDefault,
        copyConflictPreset,
        setCopyConflictPreset,
        copyBusy,
        copyError,
        copyTaskState,
        copyConflict,
        resolvingConflict,
        copyProgress,
        handleCopyRequest,
        handleCopyConfirm,
        resolveConflictDecision,
        setCopyConflict,
        setCopyProgress,
    };
}

