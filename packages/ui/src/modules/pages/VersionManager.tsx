import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { History, Trash2, Plus, Loader2, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { T, translate } from "@/i18n";
import { fetchPageVersions, createPageVersion, deletePageVersion, restorePageVersion } from "./client-pages";

interface VersionManagerProps {
    isOpen: boolean;
    onClose: () => void;
    pageId: string;
    pageTitle?: string;
    /** Called when user wants to restore/view a version */
    onSelectVersion?: (versionId: string) => void;
    /** Called after a successful restore */
    onRestore?: () => void;
}

export const VersionManager = ({ isOpen, onClose, pageId, pageTitle, onSelectVersion, onRestore }: VersionManagerProps) => {
    const [actionLoading, setActionLoading] = useState(false);
    const queryClient = useQueryClient();

    const { data: versions = [], isLoading } = useQuery({
        queryKey: ['page-versions', pageId],
        queryFn: () => fetchPageVersions(pageId),
        enabled: isOpen && !!pageId,
    });

    const handleCreate = async () => {
        setActionLoading(true);
        try {
            await createPageVersion(pageId);
            toast.success(translate("Version created"));
            queryClient.invalidateQueries({ queryKey: ['page-versions', pageId] });
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || translate("Failed to create version"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (versionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(translate("Delete this version?"))) return;

        setActionLoading(true);
        try {
            await deletePageVersion(pageId, versionId);
            toast.success(translate("Version deleted"));
            queryClient.invalidateQueries({ queryKey: ['page-versions', pageId] });
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || translate("Failed to delete version"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleRestore = async (versionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(translate("Restore this version? Current content will be overwritten."))) return;

        setActionLoading(true);
        try {
            await restorePageVersion(pageId, versionId);
            toast.success(translate("Version restored"));
            onRestore?.();
            onClose();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || translate("Failed to restore version"));
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[70vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        <T>Versions</T>
                        {pageTitle && <span className="text-muted-foreground font-normal text-sm ml-1">— {pageTitle}</span>}
                    </DialogTitle>
                    <DialogDescription>
                        <T>Manage saved snapshots of this page.</T>
                    </DialogDescription>
                </DialogHeader>

                {/* Actions */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                        {versions.length} {versions.length === 1 ? translate('version') : translate('versions')}
                    </span>
                    <Button size="sm" variant="outline" onClick={handleCreate} disabled={actionLoading}>
                        {actionLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                        <T>Snapshot</T>
                    </Button>
                </div>

                {/* Version list */}
                <div className="flex-1 overflow-y-auto min-h-0 border rounded-md">
                    {isLoading ? (
                        <div className="flex justify-center p-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
                    ) : versions.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-8">
                            <T>No versions yet.</T>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {versions.map((v: any) => (
                                <div
                                    key={v.id}
                                    className={cn(
                                        "flex items-center justify-between p-3 hover:bg-muted/50 group",
                                        onSelectVersion && "cursor-pointer"
                                    )}
                                    onClick={() => onSelectVersion?.(v.id)}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium truncate">
                                            {v.meta?.version_label || v.meta?.version_of_title || v.title}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {formatDate(v.created_at)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-0.5 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => handleRestore(v.id, e)}
                                            disabled={actionLoading}
                                            title={translate("Restore")}
                                        >
                                            <Undo2 className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                                            onClick={(e) => handleDelete(v.id, e)}
                                            disabled={actionLoading}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
