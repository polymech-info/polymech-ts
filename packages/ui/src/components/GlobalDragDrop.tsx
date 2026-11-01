import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { set } from 'idb-keyval';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { T, translate } from '@/i18n';
import { apiClient } from '@/lib/db';
import { useDragDrop } from '@/contexts/DragDropContext';

const GlobalDragDrop = () => {
    const navigate = useNavigate();
    const { isDragging, isLocalZoneActive } = useDragDrop();

    useEffect(() => {
        const handleDrop = async (e: DragEvent) => {
            e.preventDefault();
            // We attach this to window, so it captures drops that bubble up.
            // If a widget handled the drop and stopped propagation, this listener will NOT fire (if bubbling).
            // If the widget didn't stop propagation, it will fire.
            // We assume widgets stop propagation.

            const files = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : [];
            const url = e.dataTransfer?.getData('text/uri-list') || e.dataTransfer?.getData('text/plain');

            // Filter for supported types (images and videos)
            const supportedFiles = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));

            // Check if it's a valid URL (simplistic check)
            const isUrl = url && (url.startsWith('http://') || url.startsWith('https://'));

            // Any file type is acceptable — wizard has "Upload as Files" for non-media
            if (files.length === 0 && !isUrl) {
                return;
            }

            // Use all files if no media-specific ones found (for VFS file upload)
            const filesToPass = supportedFiles.length > 0 ? supportedFiles : files;

            try {
                if (files.length > 0) {
                    // File workflow — wizard shows options incl. "Upload as Files"
                    await set('share-target', {
                        files: filesToPass,
                        title: '',
                        text: '',
                        url: isUrl ? url : '',
                        timestamp: Date.now()
                    });
                    navigate('/new?shared=true');
                } else if (isUrl) {
                    // URL workflow
                    toast.info(translate('Processing link...'));

                    try {
                        const siteInfo = await apiClient<{
                            page?: { image?: string; title?: string; description?: string };
                            title?: string;
                            description?: string;
                        }>(`/api/serving/site-info?url=${encodeURIComponent(url)}`);

                        const virtualItem = {
                            id: crypto.randomUUID(),
                            path: url,
                            src: siteInfo.page?.image || 'https://picsum.photos/800/600',
                            title: siteInfo.page?.title || siteInfo.title || url,
                            description: siteInfo.page?.description || siteInfo.description || '',
                            type: 'page-external',
                            meta: siteInfo,
                            file: null,
                            selected: true
                        };

                        await set('share-target', {
                            items: [virtualItem],
                            files: [],
                            title: virtualItem.title,
                            text: virtualItem.description,
                            url: url,
                            timestamp: Date.now(),
                            type: 'external_link'
                        });

                        navigate('/new?shared=true');
                        return;

                    } catch (err) {
                        console.error("Failed to fetch site info:", err);
                        toast.error(translate("Failed to get link info. Using raw URL."));
                        // Fallback to raw URL
                        await set('share-target', {
                            items: [{
                                id: crypto.randomUUID(),
                                path: url,
                                src: 'https://picsum.photos/800/600',
                                title: url,
                                description: '',
                                type: 'page-external',
                                meta: { url },
                                file: null,
                                selected: true
                            }],
                            files: [],
                            title: '',
                            text: '',
                            url: url,
                            timestamp: Date.now(),
                            type: 'external_link'
                        });
                        navigate('/new?shared=true');
                        return;
                    }
                }

            } catch (error) {
                console.error("Error processing dropped files/links:", error);
                toast.error("Failed to process drop.");
            }
        };

        window.addEventListener('drop', handleDrop);
        return () => window.removeEventListener('drop', handleDrop);
    }, [navigate]);


    if (!isDragging || isLocalZoneActive) return null;

    return (
        <div
            className="fixed inset-0 z-[99999] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center border-4 border-dashed border-primary m-4 rounded-xl pointer-events-none"
        >
            <div className="bg-background p-8 rounded-full shadow-lg mb-4 animate-bounce">
                <Upload className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
                <T>Drop files to upload</T>
            </h2>
            <p className="text-muted-foreground mt-2">
                <T>Drag files anywhere to start</T>
            </p>
        </div>
    );
};

export default GlobalDragDrop;
