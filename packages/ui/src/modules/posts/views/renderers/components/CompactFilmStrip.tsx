import React, { useRef, useEffect, useState } from "react";
import { Trash2, Plus, Layers, ChevronUp, ChevronDown, Pencil } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { T } from "@/i18n";
import ResponsiveImage from "@/components/ResponsiveImage";
import { isVideoType, normalizeMediaType, detectMediaType } from "@/lib/mediaRegistry";
import { PostMediaItem } from "../../types";

interface CompactFilmStripProps {
    mediaItems: PostMediaItem[];
    localMediaItems?: PostMediaItem[];
    setLocalMediaItems?: (items: PostMediaItem[]) => void;
    isEditMode: boolean;
    mediaItem: PostMediaItem; // Current selected item
    onMediaSelect: (item: PostMediaItem) => void;
    isOwner: boolean;
    onDeletePicture: () => void;
    onGalleryPickerOpen: (index: number) => void;
    onEditPicture?: (item: PostMediaItem) => void;
    cacheBustKeys: Record<string, number>;
    thumbnailLayout?: 'strip' | 'grid';
    orientation?: 'horizontal' | 'vertical'; // New prop
    className?: string;
}

export const CompactFilmStrip: React.FC<CompactFilmStripProps> = ({
    mediaItems,
    localMediaItems,
    setLocalMediaItems,
    isEditMode,
    mediaItem,
    onMediaSelect,
    isOwner,
    onDeletePicture,
    onGalleryPickerOpen,
    onEditPicture,
    cacheBustKeys,
    thumbnailLayout = 'strip',
    orientation = 'horizontal',
    className
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Wheel scroll support for horizontal scrolling (strip) and vertical scrolling (grid)
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            const handleWheel = (e: WheelEvent) => {
                if (e.deltaY !== 0) {
                    const isVerticalScroll = thumbnailLayout === 'grid' || orientation === 'vertical';

                    if (isVerticalScroll) {
                        // Let native vertical scroll happen if content overflows
                        // But if we are in 'strip' mode strictly, we might want horizontal scroll mapping
                        // For now, if orientation is vertical, we expect standard vertical scrolling behavior
                        return;
                    } else {
                        // Horizontal strip: map vertical scroll to horizontal scroll
                        e.preventDefault();
                        container.scrollLeft += e.deltaY;
                    }
                }
            };
            container.addEventListener('wheel', handleWheel, { passive: false });
            return () => container.removeEventListener('wheel', handleWheel);
        }
    }, [thumbnailLayout, orientation]);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData('polymech/internal', 'true');
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        if (draggedIndex === null || draggedIndex === dropIndex) return;
        if (!localMediaItems || !setLocalMediaItems) return;

        // groupedItems indices don't match localMediaItems indices (groups collapse versions).
        // We need to reorder root-level groups, moving all versions together.
        const draggedItem = groupedItems[draggedIndex];
        const dropItem = groupedItems[dropIndex];
        if (!draggedItem || !dropItem) return;

        const draggedRootId = findTrueRoot(draggedItem);
        const dropRootId = findTrueRoot(dropItem);
        if (draggedRootId === dropRootId) return;

        // Collect the ordered root IDs from groupedItems (current display order)
        const orderedRootIds: string[] = [];
        const rootIdSet = new Set<string>();
        groupedItems.forEach(item => {
            const rootId = findTrueRoot(item);
            if (!rootIdSet.has(rootId)) {
                rootIdSet.add(rootId);
                orderedRootIds.push(rootId);
            }
        });

        // Reorder: move dragged root to drop position
        const fromIdx = orderedRootIds.indexOf(draggedRootId);
        const toIdx = orderedRootIds.indexOf(dropRootId);
        if (fromIdx === -1 || toIdx === -1) return;

        orderedRootIds.splice(fromIdx, 1);
        orderedRootIds.splice(toIdx, 0, draggedRootId);

        // Build a map: rootId -> all items in that group (preserving intra-group order)
        const groupMap = new Map<string, PostMediaItem[]>();
        localMediaItems.forEach(item => {
            const rootId = findTrueRoot(item);
            if (!groupMap.has(rootId)) groupMap.set(rootId, []);
            groupMap.get(rootId)!.push(item);
        });

        // Rebuild localMediaItems in new group order, assigning positions
        const reordered: PostMediaItem[] = [];
        let position = 0;
        for (const rootId of orderedRootIds) {
            const group = groupMap.get(rootId) || [];
            group.forEach(item => {
                reordered.push({ ...item, position });
            });
            position++;
        }

        // Add any items from groups not in groupedItems (edge case: orphaned items)
        groupMap.forEach((group, rootId) => {
            if (!rootIdSet.has(rootId)) {
                group.forEach(item => reordered.push({ ...item, position: position++ }));
            }
        });

        setLocalMediaItems(reordered);
        setDraggedIndex(null);
    };

    const itemsToRender = isEditMode ? (localMediaItems || []) : mediaItems;

    // Build a lookup map and root-finder so we can group deep version trees correctly
    const { itemMap, findTrueRoot } = React.useMemo(() => {
        const itemMap = new Map<string, PostMediaItem>();
        itemsToRender.forEach(item => itemMap.set(item.id, item));

        // Walk up the full parent chain to find the true root
        const findTrueRoot = (item: PostMediaItem): string => {
            let currentId = item.id;
            let current: PostMediaItem | undefined = item;
            while (current?.parent_id && itemMap.has(current.parent_id)) {
                currentId = current.parent_id;
                current = itemMap.get(currentId);
            }
            return currentId;
        };

        return { itemMap, findTrueRoot };
    }, [itemsToRender]);

    // Group items for filmstrip display
    // We want to show only ONE item per version group.
    // If the currently selected mediaItem belongs to a group, show THAT item as the representative.
    // Otherwise show the first one (or cover).
    const groupedItems: PostMediaItem[] = React.useMemo(() => {

        const groups = new Map<string, PostMediaItem[]>();
        itemsToRender.forEach(item => {
            const rootId = findTrueRoot(item);
            if (!groups.has(rootId)) {
                groups.set(rootId, []);
            }
            groups.get(rootId)?.push(item);
        });

        // Convert groups to representative items
        const representatives: PostMediaItem[] = [];
        groups.forEach((groupItems) => {
            // Check if current mediaItem is in this group
            const activeInGroup = groupItems.find(i => i.id === mediaItem?.id);
            if (activeInGroup) {
                representatives.push(activeInGroup);
            } else {
                // Prefer is_selected version (the DB-level preferred pick), even if deep
                const visible = groupItems.filter(i => isOwner || i.visible !== false);
                const selected = visible.find(i => i.is_selected);
                if (selected) {
                    representatives.push(selected);
                } else if (visible.length > 0) {
                    visible.sort((a, b) => (a.position || 0) - (b.position || 0));
                    representatives.push(visible[0]);
                } else if (isOwner && groupItems.length > 0) {
                    representatives.push(groupItems[0]); // Owner sees hidden
                }
            }
        });

        return representatives;
    }, [itemsToRender, mediaItem?.id, isEditMode, isOwner, findTrueRoot]);

    if (groupedItems.length <= 1) {
        return <div className="hidden lg:block landscape:block h-[50px]"></div>;
    }

    return (
        <div className={`
            p-0 mt-2 landscape:p-0 lg:landscape:p-0 
            ${orientation === 'vertical' ? 'block' : 'hidden lg:block landscape:block'} 
            ${orientation === 'vertical' ? 'w-auto h-full' : 'w-auto max-w-full'}
            ${className || ''}
        `}>
            <div
                className={`
                    flex gap-1 items-center scrollbar-hide
                    ${thumbnailLayout === 'grid' ? 'flex-wrap max-h-[200px] overflow-y-auto' : ''}
                    ${orientation === 'vertical' ? 'flex-col overflow-y-auto h-full max-h-none' : 'overflow-x-auto'}
                `}
                ref={scrollContainerRef}
            >
                {groupedItems.map((item, index) => (
                    <div
                        key={item.renderKey || item.id}
                        draggable={isEditMode}
                        onDragStart={(e) => isEditMode && handleDragStart(e, index)}
                        onDragOver={(e) => isEditMode && handleDragOver(e, index)}
                        onDrop={(e) => isEditMode && handleDrop(e, index)}
                        className={`
                            group relative flex-shrink-0 overflow-hidden cursor-pointer transition-all
                            ${orientation === 'vertical'
                                ? 'w-24 h-24 lg:w-32 lg:h-32 mx-auto my-1' // Vertical sizing
                                : 'w-24 h-24 landscape:w-16 landscape:h-16 lg:landscape:w-32 lg:landscape:h-32 landscape:mx-1 landscape:py-0 lg:landscape:m-2' // Horizontal sizing
                            }
                            ${item.id === mediaItem?.id
                                ? 'shadow-lg scale-105'
                                : 'hover:scale-102'
                            }
                        `}
                        onClick={() => {
                            onMediaSelect(item);
                        }}
                    >
                        {(() => {
                            const rootId = findTrueRoot(item);
                            // Search in the FULL list (itemsToRender) to find all versions for this group
                            const versions = itemsToRender.filter(v =>
                                findTrueRoot(v) === rootId && (isOwner || v.visible)
                            );
                            const versionCount = versions.length; // Calculate versionCount here

                            // Sort versions to determine current index (critical for prev/next logic)
                            versions.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                            const currentIndex = versions.findIndex(v => v.id === item.id);


                            // Only show badge if NOT active item (active item gets controls)
                            if (versionCount > 1 && item.id !== mediaItem?.id) {
                                return (
                                    <div className="absolute top-1 left-1 z-20 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-md backdrop-blur-sm flex items-center gap-1">
                                        <Layers className="w-3 h-3" />
                                        <span>{versionCount}</span>
                                    </div>
                                );
                            }

                            // Show controls IF active item has versions
                            if (versionCount > 1 && item.id === mediaItem?.id) {
                                return (
                                    <div className="absolute left-0 top-0 bottom-0 w-6 flex flex-col justify-between items-center bg-black/40 z-30 py-1 backdrop-blur-[1px]">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 text-white/80 hover:text-white hover:bg-white/20 rounded-sm p-0.5"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const prevIndex = (currentIndex - 1 + versionCount) % versionCount;
                                                onMediaSelect(versions[prevIndex]);
                                            }}
                                            title="Previous Version"
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                        </Button>

                                        <div className="text-[9px] font-bold text-white/90 font-mono shadow-sm">
                                            v{currentIndex + 1}
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 text-white/80 hover:text-white hover:bg-white/20 rounded-sm p-0.5"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const nextIndex = (currentIndex + 1) % versionCount;
                                                onMediaSelect(versions[nextIndex]);
                                            }}
                                            title="Next Version"
                                        >
                                            <ChevronDown className="w-4 h-4" />
                                        </Button>
                                    </div>
                                );
                            }

                            return null;
                        })()}
                        {(() => {
                            const isVideo = isVideoType(normalizeMediaType((item as any).type || detectMediaType(item.image_url)));
                            const srcUrl = item.thumbnail_url || item.image_url;
                            const isRawVideo = srcUrl.match(/\.(mp4|webm|mov|mkv)$/i) || srcUrl.includes('/api/videos/jobs/');

                            if (isVideo && isRawVideo) {
                                // Render a raw video fallback thumbnail
                                return (
                                    <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                                        <div className="absolute inset-0 opacity-20 bg-gradient-to-tr from-blue-900/40 to-purple-900/40" />
                                    </div>
                                );
                            }

                            return (
                                <ResponsiveImage
                                    src={`${srcUrl}${cacheBustKeys[item.id] ? `?v=${cacheBustKeys[item.id]}` : ''}`}
                                    alt={`Item ${index + 1}`}
                                    imgClassName="w-full h-full object-cover"
                                    sizes="150px"
                                    loading="lazy"
                                />
                            );
                        })()}
                        {isVideoType(normalizeMediaType((item as any).type || detectMediaType(item.image_url))) && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                </div>
                            </div>
                        )}
                        {item.id === mediaItem?.id && (
                            <div className="absolute inset-0 ring-2 ring-primary ring-inset flex items-center justify-center group-hover:bg-black/10 transition-colors">
                                {/* Actions only visible on hover */}
                                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                                    {isOwner && (
                                        <>
                                            {onEditPicture && (
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-full"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditPicture(item);
                                                    }}
                                                    title="Edit picture"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="h-6 w-6 rounded-full"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onMediaSelect(item);
                                                    onDeletePicture();
                                                }}
                                                title="Remove picture"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="h-6 w-6 rounded-full"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onMediaSelect(item);
                                                    onGalleryPickerOpen(index + 1);
                                                }}
                                                title="Add picture after"
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                                {/* Removed "Current" text badge */}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
