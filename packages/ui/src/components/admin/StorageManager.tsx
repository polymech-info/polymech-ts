import { useState, useEffect } from "react";
import { FileBrowserWidget } from "@/modules/storage";
import { AclEditor } from "@/modules/storage/AclEditor";
import { vfsIndex, vfsClearIndex, subscribeToVfsIndexStream } from "@/modules/storage/client-vfs";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { T, translate } from "@/i18n";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function StorageManager() {
    // Default to 'root' mount, but we could allow selecting mounts if there are multiple.
    // For now assuming 'root' is the main VFS.
    const [mount, setMount] = useState("home");
    const [currentPath, setCurrentPath] = useState("/");
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [manualPath, setManualPath] = useState("/");
    const [indexing, setIndexing] = useState(false);
    const [indexProgress, setIndexProgress] = useState(0);
    const [indexCountMsg, setIndexCountMsg] = useState("");
    const [fullText, setFullText] = useState(false);
    const { session } = useAuth();

    // The ACL editor shows permissions for the manual path.
    // Sync external file browser selections into the manual input.
    useEffect(() => {
        setManualPath(selectedPath || currentPath);
    }, [selectedPath, currentPath]);

    const targetPath = manualPath;

    useEffect(() => {
        if (!indexing) return;

        let eventSource: EventSource | undefined;
        let isMounted = true;

        subscribeToVfsIndexStream(mount, targetPath, (progress, msg) => {
            if (!isMounted) return;
            setIndexProgress(progress);
            setIndexCountMsg(msg);
        }, session?.access_token).then(es => {
            if (!isMounted) {
                es.close();
            } else {
                eventSource = es;
            }
        });

        return () => {
            isMounted = false;
            if (eventSource) eventSource.close();
        };
    }, [indexing, mount, targetPath, session]);

    const handleClearIndex = async () => {
        if (!confirm("Are you sure you want to clear the index for this path? This will not delete actual files.")) return;

        try {
            setIndexing(true);
            const data = await vfsClearIndex(mount, targetPath);
            toast.success(translate("Index cleared"), {
                description: data.message
            });
        } catch (err: any) {
            toast.error(translate("Failed to clear index"), {
                description: err.message
            });
        } finally {
            setIndexing(false);
        }
    };

    const handleIndex = async () => {
        try {
            setIndexing(true);
            setIndexProgress(0);
            setIndexCountMsg("Preparing indexing batch...");
            const data = await vfsIndex(mount, targetPath, fullText);
            toast.success(translate("Indexing completed"), {
                description: data.message
            });
        } catch (err: any) {
            toast.error(translate("Failed to index mount"), {
                description: err.message
            });
        } finally {
            // keep it somewhat visible for a second if extremely fast
            setTimeout(() => {
                setIndexing(false);
                setIndexProgress(0);
                setIndexCountMsg("");
            }, 1000);
        }
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-4 p-4">
            {/* Left Pane: File Browser */}
            <Card className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b bg-muted/20">
                    <h2 className="font-semibold"><T>File Browser</T></h2>
                </div>
                <div className="flex-1 overflow-auto bg-background">
                    <FileBrowserWidget
                        mount={mount}
                        path={currentPath}
                        onMountChange={(m) => {
                            setMount(m);
                            setCurrentPath('/');
                            setSelectedPath(null);
                        }}
                        onPathChange={(p) => {
                            setCurrentPath(p);
                            setSelectedPath(null); // Clear selection when navigating
                        }}
                        onSelect={setSelectedPath}
                        viewMode="list"
                        mode="simple"
                        canChangeMount={true}
                        allowFileViewer={false}
                        allowDownload={true}
                        allowPreview={false}
                        allowFileUpload={true}
                        allowFileDelete={true}
                        allowFileMove={true}
                        allowFileRename={true}
                        allowFolderCreate={true}
                        allowFolderDelete={true}
                        allowFolderMove={true}
                        allowFolderRename={true}
                        showToolbar={true}
                        index={false}
                        glob="*.*"
                        sortBy="name"
                    />
                </div>
            </Card>

            {/* Right Pane: ACL Editor */}
            <Card className="w-[400px] flex flex-col border-l shadow-lg">
                <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                    <h2 className="font-semibold"><T>Permissions & Tasks</T></h2>
                </div>
                <div className="flex-1 overflow-auto p-4">
                    <div className="mb-4">
                        <div className="text-sm font-medium text-muted-foreground"><T>Selected Path</T></div>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="bg-muted px-3 py-2 rounded-md border text-sm font-mono text-muted-foreground select-none">
                                {mount}:
                            </div>
                            <Input
                                value={targetPath}
                                onChange={(e) => setManualPath(e.target.value)}
                                className="font-mono"
                            />
                        </div>
                    </div>
                    <Separator className="my-4" />

                    <div className="mb-4">
                        <div className="text-sm font-medium text-muted-foreground mb-2"><T>Database Synchronization</T></div>
                        <div className="flex items-center space-x-2 mb-3">
                            <Checkbox
                                id="full-text-index"
                                checked={fullText}
                                onCheckedChange={(checked) => setFullText(checked as boolean)}
                                disabled={indexing}
                            />
                            <Label htmlFor="full-text-index" className="text-sm cursor-pointer">
                                <T>Full Text Search (extract text from files)</T>
                            </Label>
                        </div>
                        <div className="flex gap-2 items-center">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onClick={handleIndex}
                                disabled={indexing}
                            >
                                {indexing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                                <T>{indexing ? "Indexing..." : "Index Mount"}</T>
                            </Button>

                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={handleClearIndex}
                                disabled={indexing}
                                title={translate("Clear Index")}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        {indexing && (
                            <div className="mt-3 space-y-1">
                                <Progress value={indexProgress} className="h-2" />
                                <div className="text-xs text-muted-foreground text-center animate-pulse">
                                    {indexCountMsg || `${indexProgress}%`}
                                </div>
                            </div>
                        )}
                    </div>

                    <Separator className="my-4" />
                    <AclEditor mount={mount} path={targetPath} />
                </div>
            </Card>
        </div >
    );
}
