import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Gallery } from '@/modules/posts/views/renderers/components/Gallery';
import { ImageIcon } from 'lucide-react';
import { T } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { PostMediaItem } from '@/modules/posts/views/types';
import { isVideoType, normalizeMediaType, detectMediaType } from '@/lib/mediaRegistry';
import { fetchMediaItemsByIds, fetchUserPictures } from '@/modules/posts/client-pictures';
import type { GalleryWidgetProps } from './GalleryWidgetTypes';

const SmartLightbox = lazy(() => import('@/modules/posts/views/components/SmartLightbox'));

const GalleryWidgetView: React.FC<GalleryWidgetProps> = ({
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
}) => {
    const { user } = useAuth();

    const normalizePictureIds = (ids: any): string[] => {
        if (!ids) return [];
        if (Array.isArray(ids)) return ids;
        if (typeof ids === 'string') return [ids];
        return [];
    };

    const [pictureIds] = useState<string[]>(normalizePictureIds(propPictureIds));
    const [mediaItems, setMediaItems] = useState<PostMediaItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<PostMediaItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
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

            // Fetch version siblings
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

    const handleMediaSelect = (item: PostMediaItem) => {
        setSelectedItem(item);
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

    // Empty state
    if (!pictureIds || pictureIds.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-muted/30 border-1 border-dashed">
                <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                    <T>No pictures selected</T>
                </p>
            </div>
        );
    }

    // Loading state
    if (loading) {
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
            className="relative w-full aspect-video flex flex-col focus:outline-none dark:bg-slate-800/50 lg:rounded-lg p-2 md:p-6"
        >
            {/* Gallery Component */}
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
                    isEditMode={false}
                />
            </div>

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

export default GalleryWidgetView;
