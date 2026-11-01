import React from "react";
import { PostMediaItem } from "../../types";
import { MobileGroupItem } from "./MobileGroupItem";

interface MobileGroupedFeedProps {
    mediaItems: PostMediaItem[];
    isOwner: boolean;
    isLiked: boolean; // Or accessible fn
    onMediaSelect: (item: PostMediaItem) => void;
    onLike: () => void;
    onDeletePicture: () => void;
    onGalleryPickerOpen: (index: number) => void;
    onExpand: (item: PostMediaItem) => void;
    onEditPicture: () => void;
    onDownload: () => void;
    setShowImageEditor: (show: boolean) => void;
    post?: any;
    orgSlug?: string;
    expandedComments: Record<string, boolean>;
    setExpandedComments: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    expandedDescriptions: Record<string, boolean>;
    setExpandedDescriptions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    cacheBustKeys: Record<string, number>;
}

export const MobileGroupedFeed: React.FC<MobileGroupedFeedProps> = ({
    mediaItems,
    ...props
}) => {
    // Grouping Logic — walk full parent chain for deep version trees
    const groups: PostMediaItem[][] = [];
    const processedIds = new Set<string>();

    // Build a lookup map so we can walk parent chains
    const itemMap = new Map<string, PostMediaItem>();
    mediaItems.forEach(item => itemMap.set(item.id, item));

    const findTrueRoot = (item: PostMediaItem): string => {
        let currentId = item.id;
        let current: PostMediaItem | undefined = item;
        while (current?.parent_id && itemMap.has(current.parent_id)) {
            currentId = current.parent_id;
            current = itemMap.get(currentId);
        }
        return currentId;
    };

    mediaItems.forEach(item => {
        if (processedIds.has(item.id)) return;

        const rootId = findTrueRoot(item);

        // Find all items in the list that belong to this group
        const group = mediaItems.filter(i => findTrueRoot(i) === rootId);

        // Sort by created_at to ensure consistent version ordering mechanism
        // Or respect input order if they are adjacent?
        // Let's sort by created_at for versions logic consistency.
        group.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        if (group.length > 0) {
            groups.push(group);
            group.forEach(i => processedIds.add(i.id));
        }
    });

    return (
        <div className="lg:hidden flex flex-col gap-6 bg-background pb-4">
            {groups.map((group, index) => (
                <MobileGroupItem
                    key={group[0]?.id || index}
                    group={group}
                    mediaItems={mediaItems}
                    {...props}
                />
            ))}
        </div>
    );
};
