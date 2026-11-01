import React from 'react';
import { PostRendererProps } from '../types';
import MediaCard from "@/components/MediaCard";
import { normalizeMediaType, isVideoType } from "@/lib/mediaRegistry";

import { PHOTO_GRID_THUMBNAIL_WIDTH, PHOTO_GRID_IMAGE_FORMAT } from "@/constants";
import { LayoutGrid } from 'lucide-react';
import { CompactPostHeader } from './components/CompactPostHeader';

export const ThumbsRenderer: React.FC<PostRendererProps> = (props) => {
    const {
        mediaItems,
        onMediaSelect,
        onViewModeChange,
        onExportMarkdown,
        post,
        authorProfile,
        isEditMode,
        localPost,
        setLocalPost,
        mediaItem,
        isOwner,
        onSaveChanges,
        onEditModeToggle,
        onEditPost,
        onDeletePicture,
        onDeletePost,
        onCategoryManagerOpen,
        localMediaItems
    } = props;

    return (
        <div className="space-y-4">
            <CompactPostHeader
                isEditMode={!!isEditMode}
                post={post}
                localPost={localPost}
                setLocalPost={setLocalPost!}
                mediaItem={mediaItem}
                authorProfile={authorProfile!}
                isOwner={!!isOwner}
                embedded={props.embedded}
                onViewModeChange={onViewModeChange!}
                onExportMarkdown={onExportMarkdown!}
                onSaveChanges={onSaveChanges!}
                onEditModeToggle={onEditModeToggle!}
                onEditPost={onEditPost!}
                onDeletePicture={onDeletePicture!}
                onDeletePost={onDeletePost!}
                onCategoryManagerOpen={onCategoryManagerOpen}
                mediaItems={mediaItems}
                localMediaItems={localMediaItems}
            />

            {/* Grid Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(() => {
                    // Group items by true root to collapse version trees into single cards
                    const itemMap = new Map(mediaItems.map(item => [item.id, item]));

                    const findTrueRoot = (item: any): string => {
                        let currentId = item.id;
                        let current = item;
                        while (current?.parent_id && itemMap.has(current.parent_id)) {
                            currentId = current.parent_id;
                            current = itemMap.get(currentId);
                        }
                        return currentId;
                    };

                    const groups = new Map<string, any[]>();
                    mediaItems.forEach(item => {
                        const rootId = findTrueRoot(item);
                        if (!groups.has(rootId)) groups.set(rootId, []);
                        groups.get(rootId)!.push(item);
                    });

                    // Pick representative for each group: prefer is_selected, then first by position
                    const representatives: any[] = [];
                    groups.forEach((groupItems) => {
                        const visible = groupItems.filter(i => i.visible !== false);
                        const selected = visible.find(i => i.is_selected);
                        representatives.push(selected || visible[0] || groupItems[0]);
                    });

                    return representatives.map((item) => {
                        const itemType = normalizeMediaType(item.type);
                        const isVideo = isVideoType(itemType);
                        const displayUrl = item.image_url;
                        const rootId = findTrueRoot(item);
                        const versionCount = mediaItems.filter(i => findTrueRoot(i) === rootId).length;

                        return (
                            <div key={item.renderKey || item.id} className="relative group">
                                <MediaCard
                                    id={item.id}
                                    pictureId={item.id}
                                    url={displayUrl}
                                    thumbnailUrl={item.thumbnail_url}
                                    title={item.title || `Image ${item.position + 1}`}
                                    author={authorProfile?.display_name || 'Unknown'}
                                    authorId={item.user_id}
                                    likes={item.likes_count || 0}
                                    comments={0}
                                    description={item.description}
                                    type={itemType}
                                    meta={item.meta}
                                    onClick={() => {
                                        onMediaSelect(item);
                                        onViewModeChange('compact');
                                    }}
                                    onLike={() => props.onLike()}
                                />
                                {versionCount > 1 && (
                                    <div className="absolute top-2 left-2 z-10 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-md backdrop-blur-sm flex items-center gap-1">
                                        <LayoutGrid className="w-3 h-3" />
                                        <span>{versionCount}</span>
                                    </div>
                                )}
                            </div>
                        );
                    });
                })()}
            </div>
        </div>
    );
};
