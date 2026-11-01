import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, $setSelection, $getRoot, createCommand, LexicalCommand, COMMAND_PRIORITY_NORMAL, KEY_DOWN_COMMAND, RangeSelection } from 'lexical';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { mergeRegister } from '@lexical/utils';
import { RealmPlugin, addComposerChild$, usePublisher, insertMarkdown$ } from '@mdxeditor/editor';
import { Link, FileText, ExternalLink, Trash2, ImageIcon, FolderOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { T, translate } from '@/i18n';
import { PagePickerDialog } from '@/modules/pages/PagePickerDialog';
import { Page } from '@/modules/pages/types';
import { ImagePickerDialog } from '@/components/widgets/ImagePickerDialog';
import { FileBrowserWidget } from '@/modules/storage/FileBrowserWidget';
import { vfsUrl } from '@/modules/storage/helpers';
import type { INode } from '@/modules/storage/types';
import { useAuth } from '@/hooks/useAuth';
import { serverUrl } from '@/lib/db';

export const OPEN_LINK_EDITOR_COMMAND: LexicalCommand<void> = createCommand('OPEN_LINK_EDITOR_COMMAND');

// ── Dialog-based link editor ────────────────────────────────────────

function LinkEditorComponent() {
    const [editor] = useLexicalComposerContext();
    const { user } = useAuth();

    const [isOpen, setIsOpen] = useState(false);
    const [url, setUrl] = useState('');
    const [title, setTitle] = useState('');
    const [selectedText, setSelectedText] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [pagePickerOpen, setPagePickerOpen] = useState(false);
    const [imagePickerOpen, setImagePickerOpen] = useState(false);
    const [filePickerOpen, setFilePickerOpen] = useState(false);
    const [filePickerMount, setFilePickerMount] = useState('home');
    const [filePickerPath, setFilePickerPath] = useState('/');
    const [folderLayout, setFolderLayout] = useState<'list' | 'thumbs'>('list');
    const [folderToolbar, setFolderToolbar] = useState(true);

    // Re-apply URL params when folder display options change
    useEffect(() => {
        if (!url.startsWith('/app/filebrowser/')) return;
        const base = url.split('?')[0];
        const params = new URLSearchParams();
        if (folderLayout !== 'list') params.set('view', folderLayout);
        if (!folderToolbar) params.set('toolbar', '0');
        const qs = params.toString();
        setUrl(qs ? `${base}?${qs}` : base);
    }, [folderLayout, folderToolbar]);

    const urlInputRef = useRef<HTMLInputElement>(null);
    const savedSelectionRef = useRef<RangeSelection | null>(null);
    const insertMarkdown = usePublisher(insertMarkdown$);

    /** Safe link insertion: tries to restore selection + TOGGLE_LINK, falls back to insertMarkdown */
    const safeInsertLink = useCallback((linkUrl: string, linkTitle: string) => {
        let selectionRestored = false;
        if (savedSelectionRef.current) {
            try {
                editor.update(() => {
                    $setSelection(savedSelectionRef.current!.clone());
                });
                selectionRestored = true;
            } catch {
                // Stale node — skip, insertMarkdown path will handle it
            }
        }

        if (selectedText && selectionRestored) {
            setTimeout(() => {
                try {
                    editor.dispatchCommand(TOGGLE_LINK_COMMAND, {
                        url: linkUrl,
                        title: linkTitle || undefined,
                    });
                } catch { /* stale selection fallback */ }
            }, 0);
        } else {
            // Ensure a valid cursor exists before inserting markdown
            try {
                editor.update(() => {
                    const root = $getRoot();
                    const lastChild = root.getLastDescendant();
                    if (lastChild) {
                        lastChild.selectEnd();
                    } else {
                        root.selectEnd();
                    }
                });
            } catch { /* worst case, insertMarkdown may still work */ }
            setTimeout(() => {
                insertMarkdown(`[${linkTitle || linkUrl}](${linkUrl})`);
            }, 0);
        }
    }, [editor, selectedText, insertMarkdown]);

    const openDialog = useCallback(() => {
        try {
            editor.getEditorState().read(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) return;

                // Save the selection for later restoration
                savedSelectionRef.current = selection.clone() as RangeSelection;

                const text = selection.getTextContent();
                setSelectedText(text);

                // Check if we're inside an existing link
                const nodes = selection.getNodes();
                let existingUrl = '';
                let existingTitle = '';
                let foundLink = false;

                for (const node of nodes) {
                    const parent = node.getParent();
                    if ($isLinkNode(parent)) {
                        existingUrl = parent.getURL();
                        existingTitle = parent.getTitle() || '';
                        foundLink = true;
                        break;
                    }
                }

                setIsEditing(foundLink);
                setUrl(existingUrl);
                setTitle(existingTitle || text);
            });
        } catch {
            // Stale state (e.g., slash command removed trigger node)
            savedSelectionRef.current = null;
            setSelectedText('');
            setIsEditing(false);
            setUrl('');
            setTitle('');
        }

        setIsOpen(true);
        setTimeout(() => urlInputRef.current?.focus(), 150);
    }, [editor]);

    // Register Ctrl+K shortcut and command
    useEffect(() => {
        return mergeRegister(
            editor.registerCommand(
                KEY_DOWN_COMMAND,
                (event: KeyboardEvent) => {
                    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                        event.preventDefault();
                        openDialog();
                        return true;
                    }
                    return false;
                },
                COMMAND_PRIORITY_NORMAL
            ),
            editor.registerCommand(
                OPEN_LINK_EDITOR_COMMAND,
                () => {
                    openDialog();
                    return true;
                },
                COMMAND_PRIORITY_NORMAL
            )
        );
    }, [editor, openDialog]);

    const handleSave = useCallback(() => {
        if (!url.trim()) return;

        const linkUrl = url.trim();
        const linkTitle = title.trim() || '';

        safeInsertLink(linkUrl, linkTitle);

        setIsOpen(false);
        setUrl('');
        setTitle('');
        savedSelectionRef.current = null;
        try { editor.focus(); } catch { }
    }, [editor, url, title, safeInsertLink]);

    const handleRemoveLink = useCallback(() => {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        setIsOpen(false);
        setUrl('');
        setTitle('');
        try { editor.focus(); } catch { }
    }, [editor]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setUrl('');
        setTitle('');
        try { editor.focus(); } catch { }
    }, [editor]);

    const handlePageSelect = useCallback((page: Page | null) => {
        if (page) {
            const ownerId = page.owner || user?.id || '';
            const linkUrl = `/user/${ownerId}/pages/${page.slug}`;
            const linkTitle = page.title;

            safeInsertLink(linkUrl, linkTitle);

            setIsOpen(false);
            setUrl('');
            setTitle('');
            savedSelectionRef.current = null;
            try { editor.focus(); } catch { }
        }
        setPagePickerOpen(false);
    }, [editor, user, safeInsertLink]);

    const handleImageSelect = useCallback((pictureId: string) => {
        // We won't use this - we use onSelectPicture instead
    }, []);

    const handleImageSelectPicture = useCallback((picture: { id: string; title: string; image_url: string }) => {
        const linkUrl = serverUrl
            ? `${serverUrl}/api/images/render?url=${encodeURIComponent(picture.image_url)}`
            : picture.image_url;
        const linkTitle = picture.title || 'Image';

        safeInsertLink(linkUrl, linkTitle);

        setIsOpen(false);
        setUrl('');
        setTitle('');
        savedSelectionRef.current = null;
        setImagePickerOpen(false);
        try { editor.focus(); } catch { }
    }, [editor, safeInsertLink]);

    const handleFileSelect = useCallback((filePath: string | null) => {
        if (!filePath) return;
        const linkUrl = vfsUrl('get', filePickerMount, filePath);
        const fileName = filePath.split('/').pop() || filePath;

        safeInsertLink(linkUrl, fileName);

        setIsOpen(false);
        setUrl('');
        setTitle('');
        savedSelectionRef.current = null;
        setFilePickerOpen(false);
        try { editor.focus(); } catch { }
    }, [editor, safeInsertLink, filePickerMount]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            handleClose();
        }
    }, [handleSave, handleClose]);

    const buildPageUrl = useCallback((slug: string) => {
        const ownerId = user?.id || '';
        return `/user/${ownerId}/pages/${slug}`;
    }, [user]);

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
                <DialogContent className="sm:max-w-md" onInteractOutside={(e) => { if (pagePickerOpen || imagePickerOpen || filePickerOpen) e.preventDefault(); }}>
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing ? <T>Edit Link</T> : <T>Insert Link</T>}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedText ? (
                                <><T>Link text</T>: "<span className="font-medium text-foreground">{selectedText}</span>"</>
                            ) : (
                                <T>Add a link to the selected text.</T>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="url" className="w-full">
                        <TabsList className="w-full grid grid-cols-4">
                            <TabsTrigger value="url" className="gap-1.5">
                                <ExternalLink className="h-3.5 w-3.5" />
                                URL
                            </TabsTrigger>
                            <TabsTrigger value="page" className="gap-1.5">
                                <FileText className="h-3.5 w-3.5" />
                                <T>Page</T>
                            </TabsTrigger>
                            <TabsTrigger value="image" className="gap-1.5">
                                <ImageIcon className="h-3.5 w-3.5" />
                                <T>Image</T>
                            </TabsTrigger>
                            <TabsTrigger value="file" className="gap-1.5">
                                <FolderOpen className="h-3.5 w-3.5" />
                                <T>File</T>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="url" className="space-y-3 mt-3">
                            <div className="space-y-1.5">
                                <Label><T>URL</T></Label>
                                <Input
                                    ref={urlInputRef}
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="https://..."
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label><T>Title</T> <span className="text-muted-foreground text-xs">({translate('optional')})</span></Label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={translate('Link title...')}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="page" className="space-y-3 mt-3">
                            <div className="space-y-1.5">
                                <Label><T>Page Link</T></Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={buildPageUrl('page-slug')}
                                        className="flex-1"
                                    />
                                    <Button
                                        variant="outline"
                                        className="shrink-0"
                                        onClick={() => setPagePickerOpen(true)}
                                        type="button"
                                    >
                                        <FileText className="h-4 w-4 mr-1.5" />
                                        <T>Browse</T>
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label><T>Title</T> <span className="text-muted-foreground text-xs">({translate('optional')})</span></Label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={translate('Link title...')}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="image" className="space-y-3 mt-3">
                            <div className="space-y-1.5">
                                <Label><T>Image Link</T></Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={translate('Image URL...')}
                                        className="flex-1"
                                    />
                                    <Button
                                        variant="outline"
                                        className="shrink-0"
                                        onClick={() => setImagePickerOpen(true)}
                                        type="button"
                                    >
                                        <ImageIcon className="h-4 w-4 mr-1.5" />
                                        <T>Browse</T>
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label><T>Title</T> <span className="text-muted-foreground text-xs">({translate('optional')})</span></Label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={translate('Link title...')}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="file" className="space-y-3 mt-3">
                            <div className="space-y-1.5">
                                <Label><T>File Link</T></Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="/api/vfs/get/home/..."
                                        className="flex-1"
                                    />
                                    <Button
                                        variant="outline"
                                        className="shrink-0"
                                        onClick={() => setFilePickerOpen(true)}
                                        type="button"
                                    >
                                        <FolderOpen className="h-4 w-4 mr-1.5" />
                                        <T>Browse</T>
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label><T>Title</T> <span className="text-muted-foreground text-xs">({translate('optional')})</span></Label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={translate('Link title...')}
                                />
                            </div>
                            <div className="flex gap-4 items-center">
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs text-muted-foreground whitespace-nowrap"><T>Layout</T></Label>
                                    <Select value={folderLayout} onValueChange={(v: 'list' | 'thumbs') => setFolderLayout(v)}>
                                        <SelectTrigger className="h-7 w-24 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="list">List</SelectItem>
                                            <SelectItem value="thumbs">Thumbs</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Checkbox
                                        id="folder-toolbar"
                                        checked={folderToolbar}
                                        onCheckedChange={(v) => setFolderToolbar(!!v)}
                                    />
                                    <Label htmlFor="folder-toolbar" className="text-xs text-muted-foreground cursor-pointer">
                                        <T>Toolbar</T>
                                    </Label>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex justify-between items-center pt-2">
                        {isEditing ? (
                            <Button
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={handleRemoveLink}
                                type="button"
                            >
                                <Trash2 className="h-4 w-4 mr-1.5" />
                                <T>Remove Link</T>
                            </Button>
                        ) : (
                            <div />
                        )}
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleClose} type="button">
                                <T>Cancel</T>
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={!url.trim()}
                                type="button"
                            >
                                <T>Save</T>
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <PagePickerDialog
                isOpen={pagePickerOpen}
                onClose={() => setPagePickerOpen(false)}
                onSelect={handlePageSelect}
            />

            <ImagePickerDialog
                isOpen={imagePickerOpen}
                onClose={() => setImagePickerOpen(false)}
                onSelect={handleImageSelect}
                onSelectPicture={handleImageSelectPicture}
            />

            <Dialog open={filePickerOpen} onOpenChange={(open) => { if (!open) setFilePickerOpen(false); }}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle><T>Select File</T></DialogTitle>
                        <DialogDescription>
                            <T>Browse your files to create a download link</T>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 min-h-0 overflow-hidden" style={{ height: 400 }}>
                        <FileBrowserWidget
                            mount={filePickerMount}
                            path={filePickerPath}
                            mode="simple"
                            viewMode="list"
                            showToolbar={true}
                            canChangeMount={true}
                            glob="*.*"
                            sortBy="name"
                            onSelectNode={(node: INode | null) => {
                                if (node) {
                                    const isDir = node.type === 'dir' || node.mime === 'inode/directory';
                                    const nodeName = node.name || node.path.split('/').pop() || node.path;
                                    if (isDir) {
                                        // Folder → use app route with display options
                                        const cleanPath = node.path.replace(/^\/+/, '');
                                        let folderUrl = cleanPath
                                            ? `/app/filebrowser/${filePickerMount}/${cleanPath}`
                                            : `/app/filebrowser/${filePickerMount}`;
                                        const params = new URLSearchParams();
                                        if (folderLayout !== 'list') params.set('view', folderLayout);
                                        if (!folderToolbar) params.set('toolbar', '0');
                                        const qs = params.toString();
                                        if (qs) folderUrl += `?${qs}`;
                                        setUrl(folderUrl);
                                    } else {
                                        // File → use VFS API download URL
                                        setUrl(vfsUrl('get', filePickerMount, node.path));
                                    }
                                    setTitle(nodeName);
                                }
                            }}
                            onMountChange={(m) => {
                                setFilePickerMount(m);
                                setFilePickerPath('/');
                            }}
                            onPathChange={(p) => setFilePickerPath(p)}
                        />
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t">
                        <Button
                            variant="ghost"
                            className="text-muted-foreground text-xs"
                            onClick={() => {
                                // Link to the current folder using the app route
                                const cleanPath = filePickerPath.replace(/^\/+/, '');
                                let folderUrl = cleanPath
                                    ? `/app/filebrowser/${filePickerMount}/${cleanPath}`
                                    : `/app/filebrowser/${filePickerMount}`;
                                const params = new URLSearchParams();
                                if (folderLayout !== 'list') params.set('view', folderLayout);
                                if (!folderToolbar) params.set('toolbar', '0');
                                const qs = params.toString();
                                if (qs) folderUrl += `?${qs}`;
                                const folderName = cleanPath.split('/').pop() || filePickerMount;

                                safeInsertLink(folderUrl, folderName);

                                setIsOpen(false);
                                setUrl('');
                                setTitle('');
                                savedSelectionRef.current = null;
                                setFilePickerOpen(false);
                                try { editor.focus(); } catch { }
                            }}
                            type="button"
                        >
                            <FolderOpen className="h-3.5 w-3.5 mr-1" />
                            <T>Link Current Folder</T>
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setFilePickerOpen(false)} type="button">
                                <T>Cancel</T>
                            </Button>
                            <Button
                                onClick={() => {
                                    if (url.trim()) handleSave();
                                    setFilePickerOpen(false);
                                }}
                                disabled={!url.trim()}
                                type="button"
                            >
                                <T>Select File</T>
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ── Toolbar button ──────────────────────────────────────────────────

export function InsertLinkToolbarButton() {
    const [editor] = useLexicalComposerContext();

    return (
        <button
            onClick={() => editor.dispatchCommand(OPEN_LINK_EDITOR_COMMAND, undefined)}
            className="flex items-center justify-center p-1 rounded hover:bg-accent transition-colors"
            title={translate('Insert Link') + ' (Ctrl+K)'}
            type="button"
        >
            <Link className="h-4 w-4" />
        </button>
    );
}

// ── Plugin factory ──────────────────────────────────────────────────

export const linkEditorPlugin = (): RealmPlugin => {
    return {
        init: (realm) => {
            realm.pubIn({
                [addComposerChild$]: () => <LinkEditorComponent />
            });
        }
    };
};
