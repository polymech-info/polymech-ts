import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gallery } from '@/modules/posts/views/renderers/components/Gallery';
import { ImagePickerDialog } from '@/components/widgets/ImagePickerDialog';
import { T, translate } from '@/i18n';
import { ImageIcon, Plus, Settings, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { PostMediaItem } from '@/modules/posts/views/types';
import { isVideoType, normalizeMediaType, detectMediaType } from '@/lib/mediaRegistry';
import { uploadImage } from '@/lib/uploadUtils';
import { toast } from 'sonner';
import { fetchMediaItemsByIds, createPicture, fetchUserPictures } from '@/modules/posts/client-pictures';
import { useDragDrop } from '@/contexts/DragDropContext';
import type { GalleryWidgetProps } from './GalleryWidgetTypes';

const SmartLightbox = lazy(() => import('@/modules/posts/views/components/SmartLightbox'));

const GalleryWidgetEdit: React.FC<GalleryWidgetProps> = ({
    pictureIds: propPictureIds = [],
    thumbnailLayout = 'strip',
    imageFit = 'cover',
    thumbnailsPosition = 'bottom',
    thumbnailsOrientation = 'horizontal',
    zoomEnabled = false,
    showVersions = false,
    showTitle = false,
    showDescription = false,
    autoPlayVideos = false,
    thumbnailsClassName = '',
    onPropsChange,
    isEditMode = false,
    id
}) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { setLocalZoneActive, resetDragState } = useDragDrop();

    // Normalize pictureIds to always be an array
    const normalizePictureIds = (ids: any): string[] => {
        if (!ids) return [];
        if (Array.isArray(ids)) return ids;
        if (typeof ids === 'string') return [ids];
        return [];
    };

    const [pictureIds, setPictureIds] = useState<string[]>(normalizePictureIds(propPictureIds));
    const [mediaItems, setMediaItems] = useState<PostMediaItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<PostMediaItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const preLightboxFocusRef = useRef<HTMLElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Keyboard: Space/Enter to open lightbox, arrows to navigate
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const el = document.activeElement;
            const isInput = el && (
                el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ||
                el.getAttribute('contenteditable') === 'true' ||
                el.getAttribute('role') === 'textbox'
            );
            if (isInput || lightboxOpen || !containerRef.current?.contains(el)) return;

            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                preLightboxFocusRef.current = document.activeElement as HTMLElement;
                setLightboxOpen(true);
            } else if (e.key === 'ArrowLeft' && selectedItem && mediaItems.length > 1) {
                e.preventDefault();
                const idx = mediaItems.findIndex(i => i.id === selectedItem.id);
                if (idx > 0) setSelectedItem(mediaItems[idx - 1]);
            } else if (e.key === 'ArrowRight' && selectedItem && mediaItems.length > 1) {
                e.preventDefault();
                const idx = mediaItems.findIndex(i => i.id === selectedItem.id);
                if (idx < mediaItems.length - 1) setSelectedItem(mediaItems[idx + 1]);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxOpen, selectedItem, mediaItems]);

    // Sync local state with props
    useEffect(() => {
        const normalizedProps = normalizePictureIds(propPictureIds);
        if (JSON.stringify(normalizedProps) !== JSON.stringify(pictureIds)) {
            setPictureIds(normalizedProps);
        }
    }, [propPictureIds]);

    useEffect(() => {
        if (pictureIds && pictureIds.length > 0) {
            fetchMediaItems();
        } else {
            setMediaItems([]);
            setSelectedItem(null);
        }
    }, [pictureIds]);

    const fetchMediaItems = async () => {
        if (!pictureIds || pictureIds.length === 0) return;

        setLoading(true);
        try {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            const dbIds = pictureIds.filter(id => uuidRegex.test(id));
            const vfsIds = pictureIds.filter(id => !uuidRegex.test(id));

            let dbItems: any[] = [];
            if (dbIds.length > 0) {
                dbItems = await fetchMediaItemsByIds(dbIds, { maintainOrder: false });
            }

            const vfsItems = vfsIds.map(url => {
                const mediaType = detectMediaType(url);
                return {
                    id: url,
                    title: url.split('/').pop() || 'File',
                    description: null,
                    image_url: url,
                    thumbnail_url: url,
                    user_id: user?.id || 'anon',
                    type: mediaType,
                    mediaType: mediaType,
                    meta: {},
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
            });

            const allFetchedItems = [...dbItems, ...vfsItems];
            const orderedItems = pictureIds.map(id => allFetchedItems.find(item => item.id === id)).filter(Boolean);

            const postMediaItems = orderedItems.map((item: any, index: number) => ({
                ...item,
                post_id: '',
                position: index,
                visible: true,
                is_selected: false,
                comments: [{ count: 0 }]
            })) as any[];

            const parentIds = new Set<string>();
            const itemIds = new Set(postMediaItems.map((i: any) => i.id));
            postMediaItems.forEach((item: any) => {
                if (item.parent_id) parentIds.add(item.parent_id);
            });

            const userIds = [...new Set(postMediaItems.map((i: any) => i.user_id))];
            let allSiblings: any[] = [];
            if (showVersions && parentIds.size > 0 && userIds.length > 0) {
                try {
                    const userPics = await fetchUserPictures(userIds[0]);
                    if (userPics && userPics.length > 0) {
                        const picMap = new Map(userPics.map((p: any) => [p.id, p]));

                        for (const item of postMediaItems) {
                            let rootId = item.id;
                            let cur: any = picMap.get(item.id);
                            while (cur?.parent_id && picMap.has(cur.parent_id)) {
                                rootId = cur.parent_id;
                                cur = picMap.get(rootId);
                            }

                            const visited = new Set<string>();
                            const collect = (nodeId: string) => {
                                if (visited.has(nodeId)) return;
                                const node = picMap.get(nodeId);
                                if (!node) return;
                                visited.add(nodeId);
                                if (!itemIds.has(nodeId)) {
                                    allSiblings.push(node);
                                    itemIds.add(nodeId);
                                }
                                userPics.filter((p: any) => p.parent_id === nodeId).forEach((child: any) => collect(child.id));
                            };
                            collect(rootId);
                        }
                    }
                } catch (err) {
                    console.warn('Error fetching version siblings:', err);
                }
            }

            const siblingMediaItems = allSiblings.map((sib: any, i: number) => ({
                ...sib,
                image_url: sib.image_url || '',
                thumbnail_url: sib.thumbnail_url || null,
                mediaType: sib.type || sib.mediaType || 'supabase-image',
                post_id: '',
                position: postMediaItems.length + i,
                visible: true,
                is_selected: sib.is_selected || false,
                comments: [{ count: 0 }],
                created_at: sib.created_at || new Date().toISOString(),
                updated_at: sib.updated_at || new Date().toISOString(),
                likes_count: 0,
                tags: sib.tags || null,
                flags: sib.flags || null,
                organization_id: sib.organization_id || null,
                parent_id: sib.parent_id || null,
            })) as any[];

            const allItems = [...postMediaItems, ...siblingMediaItems];
            setMediaItems(allItems);

            if (postMediaItems.length > 0 && !selectedItem) {
                setSelectedItem(postMediaItems[0]);
            }
        } catch (error) {
            console.error('Error fetching gallery media:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePicturesSelected = (selectedPictureIds: string[]) => {
        setPictureIds(selectedPictureIds);
        if (onPropsChange) {
            onPropsChange({ pictureIds: selectedPictureIds });
        }
        setShowPicker(false);
    };

    const handleMediaSelect = (item: PostMediaItem) => {
        setSelectedItem(item);

        if (!pictureIds.includes(item.id) && (item as any).parent_id) {
            const rootId = findTrueRoot(item);
            const oldId = pictureIds.find(pid => {
                const pidItem = mediaItems.find(m => m.id === pid);
                return pidItem && findTrueRoot(pidItem) === rootId;
            });
            if (oldId) {
                const newIds = pictureIds.map(id => id === oldId ? item.id : id);
                setPictureIds(newIds);
                if (onPropsChange) {
                    onPropsChange({ pictureIds: newIds });
                }
            }
        }
    };

    const findTrueRoot = (item: PostMediaItem): string => {
        const itemMap = new Map(mediaItems.map(m => [m.id, m]));
        let currentId = item.id;
        let current: PostMediaItem | undefined = item;
        while ((current as any)?.parent_id && itemMap.has((current as any).parent_id)) {
            currentId = (current as any).parent_id;
            current = itemMap.get(currentId);
        }
        return currentId;
    };

    const handleExpand = (item: PostMediaItem) => {
        setSelectedItem(item);
        setLightboxOpen(true);
    };

    const handlePublish = async (option: 'overwrite' | 'new' | 'version', imageUrl: string, newTitle: string, description?: string, parentId?: string, collectionIds?: string[]) => {
        console.log('Publish:', { option, imageUrl, newTitle, description, parentId, collectionIds });
    };

    const handleNavigateLightbox = (direction: 'prev' | 'next') => {
        if (!selectedItem) return;
        const currentIndex = mediaItems.findIndex(item => item.id === selectedItem.id);
        const newIndex = direction === 'next'
            ? (currentIndex + 1) % mediaItems.length
            : (currentIndex - 1 + mediaItems.length) % mediaItems.length;
        setSelectedItem(mediaItems[newIndex]);
    };

    const handleOpenInWizard = () => {
        console.log('Open in wizard:', selectedItem);
    };

    const handleEditPicture = (item: PostMediaItem) => {
        navigate(`/post/${item.id}`);
    };

    const handleReorder = (newItems: PostMediaItem[]) => {
        const newIds = newItems.map(item => item.id);
        setMediaItems(newItems);
        handlePicturesSelected(newIds);
    };

    // Drag and Drop Handlers
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        if (!isEditMode) return;
        e.preventDefault();

        if (e.dataTransfer.types.includes('Files')) {
            setIsDragging(true);
            setLocalZoneActive(true);
        }
    }, [isEditMode, setLocalZoneActive]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        if (!isEditMode) return;
        e.preventDefault();

        if (e.currentTarget.contains(e.relatedTarget as Node)) {
            return;
        }
        setIsDragging(false);
        setLocalZoneActive(false);
    }, [isEditMode, setLocalZoneActive]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        if (!isEditMode) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, [isEditMode]);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        if (!isEditMode) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        resetDragState();

        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(f => f.type.startsWith('image/'));

        if (imageFiles.length === 0) {
            if (files.length > 0) {
                toast.error(translate('Please drop image files'));
            }
            return;
        }

        await processDroppedImages(imageFiles);
    }, [isEditMode, pictureIds]);

    const processDroppedImages = async (files: File[]) => {
        setIsUploading(true);
        try {
            if (!user) {
                toast.error(translate('You must be logged in to upload images'));
                return;
            }

            const newPictureIds: string[] = [];
            let successfulUploads = 0;

            for (const file of files) {
                try {
                    const { publicUrl, meta } = await uploadImage(file, user.id);

                    const pictureData = await createPicture({
                        user_id: user.id,
                        title: file.name.split('.')[0] || 'Uploaded Image',
                        description: null,
                        image_url: publicUrl,
                        type: 'supabase-image',
                        meta: meta || {},
                    } as any);

                    if (pictureData) {
                        newPictureIds.push(pictureData.id);
                        successfulUploads++;
                    }
                } catch (err) {
                    console.error(`Failed to upload ${file.name}:`, err);
                }
            }

            if (newPictureIds.length > 0) {
                const updatedIds = [...(pictureIds || []), ...newPictureIds];
                handlePicturesSelected(updatedIds);
                toast.success(translate(`Uploaded ${successfulUploads} images`));
            } else {
                toast.error(translate('Failed to upload images'));
            }

        } catch (error) {
            console.error('Error processing dropped images:', error);
            toast.error(translate('Error processing uploads'));
        } finally {
            setIsUploading(false);
        }
    };

    // Empty state
    if (!pictureIds || pictureIds.length === 0) {
        return (
            <div
                className={`flex flex-col items-center justify-center h-full min-h-[400px] bg-muted/30 border-1 border-dashed relative transition-all duration-200 ${isDragging ? 'ring-4 ring-primary ring-inset rounded-lg scale-[0.99]' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                    <T>No pictures selected</T>
                </p>
                <>
                    <Button onClick={() => setShowPicker(true)} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        <T>Select Pictures</T>
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4">
                        <T>or drag and drop images here</T>
                    </p>
                </>
                {showPicker && (
                    <ImagePickerDialog
                        isOpen={showPicker}
                        onClose={() => setShowPicker(false)}
                        onMultiSelect={handlePicturesSelected}
                        multiple={true}
                        currentValues={pictureIds}
                    />
                )}

                {/* Drop Overlay for Empty State */}
                {isDragging && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-50 border-2 border-dashed border-primary pointer-events-none">
                        <div className="bg-primary/10 p-6 rounded-full mb-4">
                            <Upload className="h-10 w-10 text-primary animate-bounce" />
                        </div>
                        <p className="text-lg font-semibold text-primary">
                            <T>Drop images to add</T>
                        </p>
                    </div>
                )}
                {/* Uploading Overlay */}
                {isUploading && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-50">
                        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                        <p className="text-lg font-semibold text-foreground">
                            <T>Uploading images...</T>
                        </p>
                    </div>
                )}
            </div>
        );
    }

    // Loading state
    if (loading && !isUploading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Fallback
    if (!selectedItem || mediaItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-muted/30 border-1 border-dashed">
                <p className="text-muted-foreground">
                    <T>Loading gallery items...</T>
                </p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            className={`relative w-full aspect-video flex flex-col transition-all duration-200 focus:outline-none ${isDragging ? 'ring-4 ring-primary ring-inset rounded-lg scale-[0.99]' : 'dark:bg-slate-800/50 lg:rounded-lg p-2 md:p-6'}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Edit Mode Controls */}
            <div className="absolute top-2 right-2 z-50">
                <Button
                    onClick={() => setShowPicker(true)}
                    variant="secondary"
                    size="sm"
                    className="shadow-lg"
                >
                    <Settings className="w-4 h-4 mr-2" />
                    <T>Configure</T>
                </Button>
            </div>

            {/* Gallery Component - needs to fill container */}
            <div className="flex-1 w-full min-h-[500px]">
                <Gallery
                    mediaItems={mediaItems}
                    selectedItem={selectedItem}
                    onMediaSelect={handleMediaSelect}
                    onExpand={handleExpand}
                    isOwner={!!user}
                    showDesktopLayout={true}
                    thumbnailLayout={thumbnailLayout}
                    imageFit={imageFit}
                    thumbnailsPosition={thumbnailsPosition}
                    thumbnailsOrientation={thumbnailsOrientation}
                    zoomEnabled={zoomEnabled}
                    showTitle={showTitle}
                    showDescription={showDescription}
                    thumbnailsClassName={thumbnailsClassName}
                    autoPlayVideos={autoPlayVideos}
                    className="h-full w-full [&_.hidden]:!block"
                    isEditMode={isEditMode}
                    localMediaItems={mediaItems}
                    setLocalMediaItems={handleReorder}
                    onEditPicture={handleEditPicture}
                />
            </div>

            {/* Drop Overlay */}
            {isDragging && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-50 border-2 border-dashed border-primary pointer-events-none">
                    <div className="bg-primary/10 p-6 rounded-full mb-4">
                        <Upload className="h-10 w-10 text-primary animate-bounce" />
                    </div>
                    <p className="text-lg font-semibold text-primary">
                        <T>Drop images to add</T>
                    </p>
                </div>
            )}

            {/* Uploading Overlay */}
            {isUploading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-50">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                    <p className="text-lg font-semibold text-foreground">
                        <T>Uploading images...</T>
                    </p>
                </div>
            )}

            {/* Image Picker Dialog */}
            {showPicker && (
                <ImagePickerDialog
                    isOpen={showPicker}
                    onClose={() => setShowPicker(false)}
                    onMultiSelect={handlePicturesSelected}
                    multiple={true}
                    currentValues={pictureIds}
                />
            )}

            {/* Smart Lightbox */}
            {selectedItem && lightboxOpen && (
                <Suspense fallback={null}>
                    <SmartLightbox
                        isOpen={lightboxOpen}
                        onClose={() => {
                            setLightboxOpen(false);
                            requestAnimationFrame(() => {
                                preLightboxFocusRef.current?.focus();
                                preLightboxFocusRef.current = null;
                            });
                        }}
                        mediaItem={selectedItem}
                        user={user}
                        isVideo={isVideoType(normalizeMediaType(selectedItem.mediaType || (selectedItem as any).type || detectMediaType(selectedItem.image_url)))}
                        onPublish={handlePublish}
                        onNavigate={handleNavigateLightbox}
                        onOpenInWizard={handleOpenInWizard}
                        currentIndex={mediaItems.findIndex(item => item.id === selectedItem.id)}
                        totalCount={mediaItems.length}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default GalleryWidgetEdit;
