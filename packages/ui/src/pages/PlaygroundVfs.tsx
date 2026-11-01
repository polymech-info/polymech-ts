import React from 'react';
import FileBrowser from '@/modules/storage/FileBrowser';
import { useAppStore } from '@/store/appStore';
import { FilePickerField, parseVfsStoredPath, type FilePickerResult } from '@/modules/storage';
import { Button } from '@/components/ui/button';
import { readVfsFileText, writeVfsFile } from '@/modules/storage/client-vfs';

const PlaygroundVfs = () => {
    const fileBrowserImmersive = useAppStore((s) => s.fileBrowserImmersive);
    const [pickedPath, setPickedPath] = React.useState<string>('home:/');
    const [saveAsPath, setSaveAsPath] = React.useState<string>('home:/untitled.txt');
    const [saveAsMeta, setSaveAsMeta] = React.useState<FilePickerResult | null>(null);
    const [isWriting, setIsWriting] = React.useState(false);
    const [writeStatus, setWriteStatus] = React.useState<string>('');
    const [browserRefreshKey, setBrowserRefreshKey] = React.useState(0);

    const handleWriteDummy = React.useCallback(async (targetPath?: string, targetMeta?: FilePickerResult | null) => {
        setIsWriting(true);
        setWriteStatus('');
        try {
            const effectivePath = targetPath || saveAsPath;
            const parsed = parseVfsStoredPath(effectivePath);
            const cleanPath = parsed.path.replace(/^\/+/, '');
            const now = new Date().toISOString();
            const payload = [
                '# Save As playground',
                `timestamp: ${now}`,
                `target: ${parsed.mount}:${parsed.path}`,
                `overwrite confirmed: ${String(targetMeta?.overwrite ?? saveAsMeta?.overwrite ?? false)}`,
                '',
                'dummy content',
            ].join('\n');

            await writeVfsFile(parsed.mount, cleanPath, payload);
            const roundtrip = await readVfsFileText(parsed.mount, cleanPath);
            const firstLine = roundtrip.split('\n')[0] || '(empty)';
            setWriteStatus(`Written and verified: ${parsed.mount}:${parsed.path} | first line: ${firstLine}`);
            setBrowserRefreshKey((k) => k + 1);
        } catch (err: any) {
            setWriteStatus(`Write failed: ${err?.message || String(err)}`);
        } finally {
            setIsWriting(false);
        }
    }, [saveAsMeta?.overwrite, saveAsPath]);

    return (
        <div
            className={fileBrowserImmersive ? 'min-h-0 flex flex-col' : 'min-h-0 gap-2 p-2 md:gap-3 md:p-3'}
            style={{
                height: fileBrowserImmersive ? '100vh' : 'calc(100vh - 56px)',
                minHeight: fileBrowserImmersive ? '100dvh' : undefined,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {!fileBrowserImmersive && (
            <div className="border rounded-md p-2 md:p-3 bg-card/40 space-y-2 md:space-y-3 shrink-0">
                <div className="text-sm font-semibold">File Picker Test</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Pick existing file/folder</div>
                        <FilePickerField value={pickedPath} onChange={(v) => setPickedPath(v || '')} mode="pick" />
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Save As (overwrite, initial selection, masks)</div>
                        <FilePickerField
                            value={saveAsPath}
                            onChange={(v) => setSaveAsPath(v || '')}
                            mode="saveAs"
                            initialFileName="report.md"
                            initialOverwrite={false}
                            initialMask="*.md,*.txt,*.json"
                            onResultChange={(result) => {
                                setSaveAsMeta(result);
                                setSaveAsPath(result.encoded);
                                // In playground, Save As should materialize a file immediately.
                                void handleWriteDummy(result.encoded, result);
                            }}
                        />
                    </div>
                </div>
                <div className="text-[11px] font-mono text-muted-foreground break-all">
                    picked: {pickedPath || '-'}<br />
                    saveAs: {saveAsPath || '-'}<br />
                    overwrite: {saveAsMeta ? String(saveAsMeta.overwrite) : '-'} | mask: {saveAsMeta?.mask || '-'}
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => { void handleWriteDummy(); }} disabled={isWriting || !saveAsPath}>
                        {isWriting ? 'Writing…' : 'Write dummy data (Save As target)'}
                    </Button>
                    {writeStatus && <span className="text-xs font-mono text-muted-foreground">{writeStatus}</span>}
                </div>
            </div>
            )}
            <div style={{ flex: 1, minHeight: 0 }}>
                <FileBrowser
                    key={browserRefreshKey}
                    allowPanels={true}
                    mode="simple"
                    disableRoutingSync={true}
                    initialMount="home"
                    initialChrome="ribbon"
                />
            </div>
        </div>
    );
};

export default PlaygroundVfs;
