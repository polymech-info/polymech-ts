import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, Trash2, Search, Video, ExternalLink, RefreshCw, HardDrive, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { T, translate } from '@/i18n';
import { toast } from 'sonner';
import {
    fetchVideos, deleteVideos, scanVideoDisk, deleteVideoFolders,
    type VideoEntry, type DiskVideoFolder
} from '@/modules/posts/client-videos';
import { serverUrl } from '@/lib/db';

/** Normalize URLs: DB may store relative paths or old localhost URLs. */
const rewriteUrl = (url: string): string => {
    if (!url) return url;
    const serverBase = serverUrl;
    if (!serverBase) return url;
    const apiIdx = url.indexOf('/api/');
    if (apiIdx !== -1) return `${serverBase}${url.slice(apiIdx)}`;
    return url;
};

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatDate = (dateStr: string) => {
    try {
        return new Date(dateStr).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch { return dateStr; }
};

const VideoManager: React.FC = () => {
    // Database state
    const [dbVideos, setDbVideos] = useState<VideoEntry[]>([]);
    const [dbLoading, setDbLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [selectedDbIds, setSelectedDbIds] = useState<Set<string>>(new Set());

    // Disk state
    const [diskFolders, setDiskFolders] = useState<DiskVideoFolder[]>([]);
    const [diskLoading, setDiskLoading] = useState(true);
    const [storageDir, setStorageDir] = useState('');
    const [selectedDiskFolders, setSelectedDiskFolders] = useState<Set<string>>(new Set());
    const [deletingFolders, setDeletingFolders] = useState(false);

    // DB-only orphans
    const [selectedDbOnlyIds, setSelectedDbOnlyIds] = useState<Set<string>>(new Set());
    const [deletingDbOnly, setDeletingDbOnly] = useState(false);

    const [searchText, setSearchText] = useState('');

    const loadAll = useCallback(async () => {
        const dbPromise = (async () => {
            try {
                setDbLoading(true);
                setDbVideos(await fetchVideos());
            } catch (err: any) {
                toast.error(translate('Failed to load videos from DB'), { description: err.message });
            } finally { setDbLoading(false); }
        })();

        const diskPromise = (async () => {
            try {
                setDiskLoading(true);
                const result = await scanVideoDisk();
                setDiskFolders(result.folders);
                setStorageDir(result.storageDir);
            } catch (err: any) {
                toast.error(translate('Failed to scan disk'), { description: err.message });
            } finally { setDiskLoading(false); }
        })();

        await Promise.all([dbPromise, diskPromise]);
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    // Cross-reference maps
    const dbByPlaybackId = useMemo(() => {
        const map = new Map<string, VideoEntry>();
        for (const v of dbVideos) {
            const pid = v.meta?.mux_playback_id;
            if (pid) map.set(pid, v);
        }
        return map;
    }, [dbVideos]);

    const diskFolderNames = useMemo(() => new Set(diskFolders.map(f => f.name)), [diskFolders]);

    const orphanDiskFolders = useMemo(() =>
        diskFolders.filter(f => !dbByPlaybackId.has(f.name)),
        [diskFolders, dbByPlaybackId]
    );

    const orphanDbEntries = useMemo(() =>
        dbVideos.filter(v => {
            const pid = v.meta?.mux_playback_id;
            return !pid || !diskFolderNames.has(pid);
        }),
        [dbVideos, diskFolderNames]
    );

    const filteredDbVideos = useMemo(() => {
        if (!searchText) return dbVideos;
        const q = searchText.toLowerCase();
        return dbVideos.filter(v =>
            (v.title || '').toLowerCase().includes(q) ||
            (v.id || '').toLowerCase().includes(q) ||
            (v.meta?.mux_playback_id || '').toLowerCase().includes(q)
        );
    }, [dbVideos, searchText]);

    // ── Delete handlers ───────────────────────────────────────────────

    const handleDeleteDbVideos = async () => {
        const ids = Array.from(selectedDbIds);
        if (!ids.length) return;
        if (!confirm(translate(`Delete ${ids.length} video(s)? Removes files from disk AND database.`))) return;
        try {
            setDeleting(true);
            const r = await deleteVideos(ids);
            toast.success(`Deleted ${r.deleted} video(s)`);
            setSelectedDbIds(new Set());
            await loadAll();
        } catch (err: any) { toast.error(err.message); }
        finally { setDeleting(false); }
    };

    const handleDeleteDiskFolders = async () => {
        const names = Array.from(selectedDiskFolders);
        if (!names.length) return;
        if (!confirm(translate(`Delete ${names.length} disk folder(s)? This removes files permanently.`))) return;
        try {
            setDeletingFolders(true);
            const r = await deleteVideoFolders(names);
            toast.success(`Deleted ${r.deleted} folder(s)`);
            setSelectedDiskFolders(new Set());
            await loadAll();
        } catch (err: any) { toast.error(err.message); }
        finally { setDeletingFolders(false); }
    };

    const handleDeleteDbOnly = async () => {
        const ids = Array.from(selectedDbOnlyIds);
        if (!ids.length) return;
        if (!confirm(translate(`Delete ${ids.length} DB-only entry/entries? These have no files on disk.`))) return;
        try {
            setDeletingDbOnly(true);
            const r = await deleteVideos(ids);
            toast.success(`Deleted ${r.deleted} entry/entries`);
            setSelectedDbOnlyIds(new Set());
            await loadAll();
        } catch (err: any) { toast.error(err.message); }
        finally { setDeletingDbOnly(false); }
    };

    const isLoading = dbLoading || diskLoading;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Video className="h-6 w-6" />
                <h1 className="text-2xl font-bold"><T>Video Management</T></h1>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Database className="h-4 w-4" /> <T>In Database</T>
                    </div>
                    <div className="text-2xl font-bold">{dbLoading ? '…' : dbVideos.length}</div>
                </div>
                <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <HardDrive className="h-4 w-4" /> <T>On Disk</T>
                    </div>
                    <div className="text-2xl font-bold">{diskLoading ? '…' : diskFolders.length}</div>
                    {!diskLoading && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                            {formatBytes(diskFolders.reduce((sum, f) => sum + f.totalSize, 0))}
                        </div>
                    )}
                </div>
                <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 mb-1">
                        <HardDrive className="h-4 w-4" /> <T>Disk Only</T>
                    </div>
                    <div className="text-2xl font-bold">{isLoading ? '…' : orphanDiskFolders.length}</div>
                    <div className="text-xs text-muted-foreground mt-0.5"><T>No DB entry</T></div>
                </div>
                <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400 mb-1">
                        <Database className="h-4 w-4" /> <T>DB Only</T>
                    </div>
                    <div className="text-2xl font-bold">{isLoading ? '…' : orphanDbEntries.length}</div>
                    <div className="text-xs text-muted-foreground mt-0.5"><T>No disk files</T></div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={loadAll} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                    <T>Refresh</T>
                </Button>

                {selectedDbIds.size > 0 && (
                    <Button size="sm" variant="destructive" onClick={handleDeleteDbVideos} disabled={deleting}>
                        {deleting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                        <T>Delete</T> ({selectedDbIds.size})
                    </Button>
                )}

                {dbVideos.length > 0 && (
                    <div className="flex items-center gap-2 ml-auto max-w-xs">
                        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input placeholder={translate("Search...")} value={searchText}
                            onChange={e => setSearchText(e.target.value)} className="h-8" />
                    </div>
                )}
            </div>

            {/* ── Database Videos Table ───────────────────────────────── */}
            <div>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Database className="h-5 w-5" /> <T>Database Videos</T>
                </h2>

                {dbLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : filteredDbVideos.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground border rounded-lg"><T>No videos found in database.</T></div>
                ) : (
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                            <colgroup>
                                <col style={{ width: 40 }} />
                                <col style={{ width: 80 }} />
                                <col />
                                <col style={{ width: 80 }} />
                                <col style={{ width: 90 }} />
                                <col style={{ width: 60 }} />
                                <col style={{ width: 150 }} />
                                <col style={{ width: 50 }} />
                            </colgroup>
                            <thead>
                                <tr className="bg-muted/50 border-b">
                                    <th className="px-2 py-2">
                                        <Checkbox
                                            checked={filteredDbVideos.length > 0 && selectedDbIds.size === filteredDbVideos.length}
                                            onCheckedChange={(c) => setSelectedDbIds(c ? new Set(filteredDbVideos.map(v => v.id)) : new Set())}
                                        />
                                    </th>
                                    <th className="text-left px-2 py-2 font-medium text-muted-foreground"><T>Thumb</T></th>
                                    <th className="text-left px-2 py-2 font-medium text-muted-foreground"><T>Title</T></th>
                                    <th className="text-left px-2 py-2 font-medium text-muted-foreground"><T>Duration</T></th>
                                    <th className="text-left px-2 py-2 font-medium text-muted-foreground"><T>Res</T></th>
                                    <th className="text-center px-2 py-2 font-medium text-muted-foreground"><T>Disk</T></th>
                                    <th className="text-left px-2 py-2 font-medium text-muted-foreground"><T>Created</T></th>
                                    <th className="text-center px-2 py-2 font-medium text-muted-foreground"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredDbVideos.map(video => {
                                    const hasDisk = video.meta?.mux_playback_id ? diskFolderNames.has(video.meta.mux_playback_id) : false;
                                    return (
                                        <tr key={video.id}
                                            className={`group transition-colors hover:bg-muted/30 ${selectedDbIds.has(video.id) ? 'bg-primary/5' : ''}`}>
                                            <td className="px-2 py-2.5 align-middle">
                                                <Checkbox checked={selectedDbIds.has(video.id)}
                                                    onCheckedChange={(c) => setSelectedDbIds(prev => {
                                                        const next = new Set(prev);
                                                        c ? next.add(video.id) : next.delete(video.id);
                                                        return next;
                                                    })} />
                                            </td>
                                            <td className="px-2 py-2.5 align-middle">
                                                {video.thumbnail_url ? (
                                                    <img src={rewriteUrl(video.thumbnail_url)} alt="" className="w-14 h-10 object-cover rounded" loading="lazy" />
                                                ) : (
                                                    <div className="w-14 h-10 bg-muted rounded flex items-center justify-center">
                                                        <Video className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-2 py-2.5 align-middle overflow-hidden">
                                                <div className="truncate font-medium" title={video.title}>{video.title || translate('Untitled')}</div>
                                                <div className="text-xs text-muted-foreground font-mono truncate" title={video.id}>{video.id.slice(0, 8)}…</div>
                                            </td>
                                            <td className="px-2 py-2.5 align-middle text-muted-foreground">{formatDuration(video.meta?.duration)}</td>
                                            <td className="px-2 py-2.5 align-middle">
                                                <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${video.meta?.max_stored_resolution === 'UHD' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' :
                                                        video.meta?.max_stored_resolution === 'HD' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' :
                                                            'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                    }`}>{video.meta?.max_stored_resolution || '—'}</span>
                                            </td>
                                            <td className="px-2 py-2.5 align-middle text-center">
                                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${hasDisk ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                    title={hasDisk ? translate('Files on disk') : translate('Missing from disk')} />
                                            </td>
                                            <td className="px-2 py-2.5 align-middle text-xs text-muted-foreground">{formatDate(video.created_at)}</td>
                                            <td className="px-2 py-2.5 align-middle text-center">
                                                {video.image_url && (
                                                    <a href={rewriteUrl(video.image_url)} target="_blank" rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-muted transition-colors"
                                                        title={translate('Open video')}>
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Orphan Disk Folders (no DB entry) ──────────────────── */}
            {!isLoading && orphanDiskFolders.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                            <HardDrive className="h-5 w-5" /> <T>Disk Only</T>
                            <span className="text-sm font-normal text-muted-foreground">— <T>no database entry</T></span>
                        </h2>
                        <div className="ml-auto flex items-center gap-2">
                            <Button size="sm" variant="outline"
                                onClick={() => setSelectedDiskFolders(prev =>
                                    prev.size === orphanDiskFolders.length ? new Set() : new Set(orphanDiskFolders.map(f => f.name))
                                )}>
                                {selectedDiskFolders.size === orphanDiskFolders.length ? translate('Deselect All') : translate('Select All')}
                            </Button>
                            {selectedDiskFolders.size > 0 && (
                                <Button size="sm" variant="destructive" onClick={handleDeleteDiskFolders} disabled={deletingFolders}>
                                    {deletingFolders ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                                    <T>Delete</T> ({selectedDiskFolders.size})
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
                                    <th className="px-2 py-2 w-10">
                                        <Checkbox
                                            checked={orphanDiskFolders.length > 0 && selectedDiskFolders.size === orphanDiskFolders.length}
                                            onCheckedChange={(c) => setSelectedDiskFolders(c ? new Set(orphanDiskFolders.map(f => f.name)) : new Set())}
                                        />
                                    </th>
                                    <th className="text-left px-3 py-2 font-medium text-muted-foreground"><T>Folder Name</T></th>
                                    <th className="text-right px-3 py-2 font-medium text-muted-foreground"><T>Files</T></th>
                                    <th className="text-right px-3 py-2 font-medium text-muted-foreground"><T>Size</T></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-100 dark:divide-amber-900/30">
                                {orphanDiskFolders.map(f => (
                                    <tr key={f.name} className={`hover:bg-amber-50/50 dark:hover:bg-amber-900/10 ${selectedDiskFolders.has(f.name) ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}>
                                        <td className="px-2 py-2">
                                            <Checkbox checked={selectedDiskFolders.has(f.name)}
                                                onCheckedChange={(c) => setSelectedDiskFolders(prev => {
                                                    const next = new Set(prev);
                                                    c ? next.add(f.name) : next.delete(f.name);
                                                    return next;
                                                })} />
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">{f.name}</td>
                                        <td className="px-3 py-2 text-right text-muted-foreground">{f.fileCount}</td>
                                        <td className="px-3 py-2 text-right text-muted-foreground">{formatBytes(f.totalSize)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Orphan DB Entries (no disk files) ──────────────────── */}
            {!isLoading && orphanDbEntries.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                            <Database className="h-5 w-5" /> <T>DB Only</T>
                            <span className="text-sm font-normal text-muted-foreground">— <T>no files on disk</T></span>
                        </h2>
                        <div className="ml-auto flex items-center gap-2">
                            <Button size="sm" variant="outline"
                                onClick={() => setSelectedDbOnlyIds(prev =>
                                    prev.size === orphanDbEntries.length ? new Set() : new Set(orphanDbEntries.map(v => v.id))
                                )}>
                                {selectedDbOnlyIds.size === orphanDbEntries.length ? translate('Deselect All') : translate('Select All')}
                            </Button>
                            {selectedDbOnlyIds.size > 0 && (
                                <Button size="sm" variant="destructive" onClick={handleDeleteDbOnly} disabled={deletingDbOnly}>
                                    {deletingDbOnly ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                                    <T>Delete</T> ({selectedDbOnlyIds.size})
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="border border-rose-200 dark:border-rose-800 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-rose-50 dark:bg-rose-900/20 border-b border-rose-200 dark:border-rose-800">
                                    <th className="px-2 py-2 w-10">
                                        <Checkbox
                                            checked={orphanDbEntries.length > 0 && selectedDbOnlyIds.size === orphanDbEntries.length}
                                            onCheckedChange={(c) => setSelectedDbOnlyIds(c ? new Set(orphanDbEntries.map(v => v.id)) : new Set())}
                                        />
                                    </th>
                                    <th className="text-left px-3 py-2 font-medium text-muted-foreground"><T>Title</T></th>
                                    <th className="text-left px-3 py-2 font-medium text-muted-foreground"><T>ID</T></th>
                                    <th className="text-left px-3 py-2 font-medium text-muted-foreground"><T>Playback ID</T></th>
                                    <th className="text-left px-3 py-2 font-medium text-muted-foreground"><T>Created</T></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-rose-100 dark:divide-rose-900/30">
                                {orphanDbEntries.map(v => (
                                    <tr key={v.id} className={`hover:bg-rose-50/50 dark:hover:bg-rose-900/10 ${selectedDbOnlyIds.has(v.id) ? 'bg-rose-50 dark:bg-rose-900/20' : ''}`}>
                                        <td className="px-2 py-2">
                                            <Checkbox checked={selectedDbOnlyIds.has(v.id)}
                                                onCheckedChange={(c) => setSelectedDbOnlyIds(prev => {
                                                    const next = new Set(prev);
                                                    c ? next.add(v.id) : next.delete(v.id);
                                                    return next;
                                                })} />
                                        </td>
                                        <td className="px-3 py-2 font-medium truncate">{v.title || translate('Untitled')}</td>
                                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{v.id.slice(0, 12)}…</td>
                                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{v.meta?.mux_playback_id?.slice(0, 12) || '—'}…</td>
                                        <td className="px-3 py-2 text-xs text-muted-foreground">{formatDate(v.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Storage Dir Info */}
            {storageDir && (
                <div className="text-xs text-muted-foreground">
                    <T>Storage directory</T>: <code className="bg-muted px-1 py-0.5 rounded">{storageDir}</code>
                </div>
            )}
        </div>
    );
};

export default VideoManager;
