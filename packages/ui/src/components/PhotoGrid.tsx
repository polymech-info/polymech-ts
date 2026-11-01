import { UserProfile } from '@/modules/posts/views/types';
import MediaCard from "./MediaCard";
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

import { useOrganization } from "@/contexts/OrganizationContext";
import { useFeedCache } from "@/contexts/FeedCacheContext";
import { useLayoutEffect } from "react";

import { useFeedData } from "@/hooks/useFeedData";

import { normalizeMediaType, isVideoType } from "@/lib/mediaRegistry";
import { UploadCloud, Maximize, FolderTree } from "lucide-react";
import { toast } from "sonner";
import { T } from "@/i18n";
import type { MediaType } from "@/types";
import type { CardPreset } from "@/modules/pages/PageCard";

export interface MediaItemType {
  id: string;
  picture_id?: string;
  title: string;
  description: string | null;
  image_url: string;
  thumbnail_url: string | null;
  type: MediaType;
  meta: any | null;
  likes_count: number;
  created_at: string;
  user_id: string;
  comments: { count: number }[];

  author?: UserProfile;
  job?: any;
  responsive?: any; // Add responsive data
  versionCount?: number;
  _searchSource?: string;
}

import type { FeedSortOption } from '@/hooks/useFeedData';
import { mapFeedPostsToMediaItems, fetchPostById } from "@/modules/posts/client-posts";
import { fetchUserMediaLikes } from "@/modules/posts/client-pictures";


interface MediaGridProps {
  customPictures?: MediaItemType[];
  customLoading?: boolean;
  navigationSource?: 'home' | 'collection' | 'tag' | 'user' | 'widget' | 'search';
  navigationSourceId?: string;
  isOwner?: boolean;
  onFilesDrop?: (files: File[]) => void;
  showVideos?: boolean; // Toggle video display (kept for backward compatibility)
  sortBy?: FeedSortOption;
  apiUrl?: string;
  categorySlugs?: string[];
  categoryIds?: string[];
  preset?: CardPreset;
  contentType?: 'posts' | 'pages' | 'pictures' | 'files' | 'places';
  visibilityFilter?: 'invisible' | 'private';
  center?: boolean;
  columns?: number | 'auto';
}

const DEFAULT_PRESET: CardPreset = { showTitle: true, showDescription: true };

const MediaGrid = ({
  customPictures,
  customLoading,
  navigationSource = 'home',
  navigationSourceId,
  isOwner = false,
  onFilesDrop,
  showVideos = true,
  sortBy = 'latest',
  apiUrl,
  categorySlugs,
  categoryIds,
  preset = DEFAULT_PRESET,
  contentType,
  visibilityFilter,
  center,
  columns = 'auto'
}: MediaGridProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();




  const { orgSlug, isOrgContext } = useOrganization();
  // State definitions restored
  const { getCache, saveCache } = useFeedCache();
  const [mediaItems, setMediaItems] = useState<MediaItemType[]>([]);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const dragLeaveTimeoutRef = useRef<number | null>(null);

  // 1. Data Fetching
  const {
    posts: feedPosts,
    loading: feedLoading,
    hasMore,
    loadMore,
    isFetchingMore
  } = useFeedData({
    source: navigationSource,
    sourceId: navigationSourceId,
    isOrgContext,
    orgSlug,
    sortBy,
    categorySlugs,
    categoryIds,
    contentType,
    visibilityFilter,
    // Disable hook if we have custom pictures
    enabled: !customPictures,
  });

  // Derive loading from hook/props instead of syncing via setState
  const loading = customPictures ? (customLoading || false) : feedLoading;

  // Infinite Scroll Observer
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !feedLoading && !isFetchingMore) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, feedLoading, isFetchingMore, loadMore]);

  // 2. State & Effects
  useEffect(() => {
    let finalMedia: MediaItemType[] = [];

    if (customPictures) {
      finalMedia = customPictures;
    } else {
      // Map FeedPost[] -> MediaItemType[]
      finalMedia = mapFeedPostsToMediaItems(feedPosts as any, sortBy);
    }

    setMediaItems(finalMedia);
  }, [feedPosts, customPictures, sortBy]);

  // Scroll Restoration Logic
  const cacheKey = `${navigationSource}-${navigationSourceId || ''}-${isOrgContext ? 'org' : 'personal'}-${orgSlug || ''}`;
  const hasRestoredScroll = useRef(false);

  // Restore scroll when mediaItems are populated
  useLayoutEffect(() => {
    // Enable restoration if we have items, haven't restored yet, and either it's NOT custom pictures OR it IS a widget with an ID
    const shouldRestore = mediaItems.length > 0 &&
      !hasRestoredScroll.current &&
      (!customPictures || (navigationSource === 'widget' && navigationSourceId));

    if (shouldRestore) {
      const cached = getCache(cacheKey);

      if (cached && cached.scrollY > 0) {
        window.scrollTo(0, cached.scrollY);
      }
      hasRestoredScroll.current = true;
    }
  }, [mediaItems, cacheKey, getCache, customPictures, navigationSource, navigationSourceId]);

  // Reset restored flag when source changes
  useEffect(() => {
    hasRestoredScroll.current = false;
  }, [cacheKey]);

  // Track scroll position
  const lastScrollY = useRef(window.scrollY);

  useEffect(() => {
    const handleScroll = () => {
      lastScrollY.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Save scroll position on unmount or before source change
  useEffect(() => {
    return () => {
      // Save if not custom pictures OR if it is a widget with an ID
      const shouldSave = !customPictures || (navigationSource === 'widget' && navigationSourceId);

      if (shouldSave) {
        const cached = getCache(cacheKey); // Get latest data from cache (posts etc)
        // Use lastScrollY instead of window.scrollY because unmount might happen after a scroll-to-top by router

        if (cached && lastScrollY.current > 0) {
          saveCache(cacheKey, { ...cached, scrollY: lastScrollY.current });
        }
      }
    };
  }, [cacheKey, getCache, saveCache, customPictures, navigationSource, navigationSourceId]);

  const fetchMediaFromPicturesTable = async () => {
    // Manual Refresh Stub if needed - for onDelete/refresh actions
    // Since the hook data is reactive, we might need a refresh function from the hook
    // But for now, we can just reload the page or implement refresh in future.
    window.location.reload();
  };

  const fetchUserLikes = async () => {
    if (!user || mediaItems.length === 0) return;

    try {
      const { pictureLikes } = await fetchUserMediaLikes(user.id);

      // Filter to only displayed items
      const targetIds = new Set(
        mediaItems.map(item => item.picture_id || item.id).filter(Boolean)
      );

      setUserLikes(prev => {
        const newSet = new Set(prev);
        pictureLikes.forEach(id => {
          if (targetIds.has(id)) newSet.add(id);
        });
        return newSet;
      });
    } catch (error) {
      console.error('Error fetching user likes:', error);
    }
  };

  const handleMediaClick = (mediaId: string, type: MediaType, index: number) => {
    const item = mediaItems.find(i => i.id === mediaId);

    if (item?.meta?.url) {
      navigate(item.meta.url);
      return;
    }

    if (type === 'page-intern') {
      if (item && item.meta?.slug) {
        navigate(`/user/${item.author?.username || item.user_id}/pages/${item.meta.slug}`);
        return;
      }
    }

    navigate(`/post/${mediaId}`);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragLeaveTimeoutRef.current) {
      clearTimeout(dragLeaveTimeoutRef.current);
    }
    if (isOwner && onFilesDrop) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragLeaveTimeoutRef.current) {
      clearTimeout(dragLeaveTimeoutRef.current);
    }
    dragLeaveTimeoutRef.current = window.setTimeout(() => {
      setIsDragging(false);
    }, 100);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!isOwner || !onFilesDrop) return;

    const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      onFilesDrop(files);
    }
  };

  const handleEditPost = async (postId: string) => {
    try {
      const toastId = toast.loading('Loading post for editing...');

      // Fetch full post via API (returns FeedPost with pictures)
      const post = await fetchPostById(postId);

      if (!post) throw new Error('Post not found');

      if (!post.pictures || post.pictures.length === 0) {
        throw new Error('No pictures found in post');
      }

      // Transform pictures for wizard
      const wizardImages = post.pictures
        .sort((a: any, b: any) => ((a.position || 0) - (b.position || 0)))
        .map((p: any) => ({
          id: p.id,
          path: p.id,
          src: p.image_url,
          title: p.title,
          description: p.description || '',
          selected: false,
          realDatabaseId: p.id
        }));

      toast.dismiss(toastId);

      navigate('/wizard', {
        state: {
          mode: 'post',
          initialImages: wizardImages,
          postTitle: post.title,
          postDescription: post.description,
          editingPostId: post.id
        }
      });
    } catch (error) {
      console.error('Error opening post editor:', error);
      toast.error('Failed to open post editor');
    }
  };




  // Group media items by category
  // - When filtering by category: group by immediate subcategories (show parent + each child)
  // - When on home feed: don't group (flat list)
  const isSearchTabAllOrFiles = navigationSource === 'search' && (!contentType || contentType === 'files');
  const shouldGroupByCategory = !!categorySlugs && categorySlugs.length > 0;

  const getSearchGroup = (item: any): string => {
      if (item.type === 'page-vfs-folder') return 'Folders';
      if (item._searchSource === 'picture') return 'Pictures';
      if (item._searchSource === 'place') return 'Places';
      if (item._searchSource === 'file') {
         if (item.thumbnail_url || item.cover || (item.pictures && item.pictures.length > 0)) return 'Pictures';
         return 'Files';
      }
      if (item._searchSource === 'page') return 'Pages';
      if (item._searchSource === 'post') return 'Posts';
      return 'Posts';
  };

  const groupedItems = React.useMemo(() => {
    if (isSearchTabAllOrFiles) {
        const groups = new Map<string, MediaItemType[]>();
        mediaItems.forEach(item => {
            const group = getSearchGroup(item);
            if (!groups.has(group)) groups.set(group, []);
            groups.get(group)!.push(item);
        });

        const orderedGroups = ['Pages', 'Folders', 'Posts', 'Places', 'Pictures', 'Files'];
        const sections = [];
        for (const group of orderedGroups) {
            if (groups.has(group)) {
                 sections.push({
                     key: group,
                     title: group,
                     items: groups.get(group)!
                 });
            }
        }
        
        if (sections.length > 0) return { sections };
        return { sections: [{ key: 'all', title: null, items: mediaItems }] };
    }

    if (!shouldGroupByCategory) {
      return { sections: [{ key: 'all', title: null, items: mediaItems }] };
    }

    const grouped = new Map<string, MediaItemType[]>();
    const parentCategoryItems: MediaItemType[] = [];

    mediaItems.forEach(item => {
      // Find corresponding feed post to get category_paths
      const feedPost = feedPosts.find(p => p.id === item.id || p.cover?.id === item.id);

      if (!feedPost?.category_paths || feedPost.category_paths.length === 0) {
        return;
      }

      // Check if item has an exact match to the parent category (path length = 1)
      const hasExactParentMatch = feedPost.category_paths.some((path: any[]) =>
        path.length === 1 && categorySlugs.includes(path[0].slug)
      );

      if (hasExactParentMatch) {
        // Item is directly in the parent category
        parentCategoryItems.push(item);
        return;
      }

      // Otherwise, find the most specific path (longest) that includes the filtered category
      let mostSpecificPath: any[] | null = null;
      let categoryIndex = -1;

      for (const path of feedPost.category_paths) {
        const idx = path.findIndex((cat: any) => categorySlugs.includes(cat.slug));
        if (idx !== -1) {
          if (!mostSpecificPath || path.length > mostSpecificPath.length) {
            mostSpecificPath = path;
            categoryIndex = idx;
          }
        }
      }

      if (!mostSpecificPath || categoryIndex === -1) return;

      // Item is in a subcategory - use the immediate child category
      const subcategory = mostSpecificPath[categoryIndex + 1];
      if (subcategory) {
        const key = subcategory.slug;

        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(item);
      }
    });

    const sections = [];

    // Add parent category section first (if it has items)
    if (parentCategoryItems.length > 0) {
      sections.push({
        key: categorySlugs[0],
        title: categorySlugs[0].replace(/-/g, ' '),
        items: parentCategoryItems
      });
    }

    // Add subcategory sections
    Array.from(grouped.entries()).forEach(([key, items]) => {
      sections.push({
        key,
        title: key.replace(/-/g, ' '),
        items
      });
    });

    // If no sections, return all items in one section
    if (sections.length === 0) {
      return { sections: [{ key: 'all', title: null, items: mediaItems }] };
    }

    return { sections };
  }, [mediaItems, feedPosts, shouldGroupByCategory, categorySlugs, navigationSource, isSearchTabAllOrFiles]);

  if (loading) {
    return (
      <div className="py-8">
        <div className="text-center text-muted-foreground">
          Loading media...
        </div>
      </div>
    );
  }

  const hasItems = mediaItems.length > 0;
  return (
    <div className="w-full relative">
      {hasItems && isOwner && onFilesDrop && navigationSource === 'collection' && (
        <div
          className={`my-4 border-2 border-dashed border-muted rounded-lg p-6 text-center text-muted-foreground transition-all ${isDragging ? 'ring-4 ring-primary ring-offset-2 border-solid border-primary bg-primary/5' : ''
            } `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm">Drag and drop more images here to upload.</p>
        </div>
      )}

      {!hasItems ? (
        isOwner && navigationSource === 'collection' && onFilesDrop ? (
          <div
            className="py-8"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className={`border-2 border-dashed border-muted rounded-lg p-12 text-center text-muted-foreground transition-all ${isDragging ? 'ring-4 ring-primary ring-offset-2 border-solid border-primary bg-primary/5' : ''
              } `}>
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">This collection is empty</h3>
              <p className="mt-2">Drag and drop images here to get started.</p>
            </div>
          </div>
        ) : (
          <div className="py-8">
            <div className="text-center text-muted-foreground">
              <p className="text-lg">No media yet!</p>
              <p>Be the first to share content with the community.</p>
            </div>
          </div>
        )
      ) : (
        <>
          {groupedItems.sections.map((section) => (
            <div key={section.key} className="mb-8">
              {section.title && (
                <h2 className="text-lg font-semibold mb-4 px-4 flex items-center gap-2 capitalize">
                  <FolderTree className="h-5 w-5" />
                  <T>{section.title}</T>
                </h2>
              )}
              {(() => {
                const isAuto = columns === 'auto';
                const colNum = Number(columns);
                const gridColsClass = isAuto ? 'grid-cols-[repeat(auto-fit,minmax(250px,380px))] justify-center' :
                  colNum === 1 ? 'grid-cols-1' :
                    colNum === 2 ? 'grid-cols-1 md:grid-cols-2' :
                      colNum === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                        colNum === 5 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' :
                          colNum === 6 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' :
                            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
                return (
                  <div className={`grid ${gridColsClass} gap-4 px-4`}>
                    {section.items.map((item, index) => {
                      const itemType = normalizeMediaType(item.type);
                      const isVideo = isVideoType(itemType);
                      // For images, convert URL to optimized format
                      const displayUrl = item.image_url;
                      if (isVideo) {
                        return (
                          <div key={item.id} className="relative group">
                            <MediaCard
                              id={item.id}
                              pictureId={item.picture_id}
                              url={displayUrl}
                              thumbnailUrl={item.thumbnail_url}
                              title={item.title}
                              // Pass blank/undefined so UserAvatarBlock uses context data
                              author={undefined as any}
                              authorAvatarUrl={undefined}
                              authorId={item.user_id}
                              likes={item.likes_count || 0}
                              comments={item.comments[0]?.count || 0}
                              isLiked={userLikes.has(item.picture_id || item.id)}
                              description={item.description}
                              type={itemType}
                              meta={item.meta}
                              onClick={() => handleMediaClick(item.id, itemType, index)}
                              onLike={fetchUserLikes}
                              onDelete={fetchMediaFromPicturesTable}
                              onEdit={handleEditPost}
                              created_at={item.created_at}
                              job={item.job}
                              responsive={item.responsive}
                              apiUrl={apiUrl}
                              preset={preset}
                            />
                            <div className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 bg-black/50 rounded-full opacity-0 transition-opacity"> {/* TESTING: group-hover:opacity-100 disabled */}
                              <Maximize className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        );
                      }

                      return (
                        <MediaCard
                          key={item.id}
                          id={item.id}
                          pictureId={item.picture_id}
                          url={displayUrl}
                          thumbnailUrl={item.thumbnail_url}
                          title={item.title}
                          author={undefined as any}
                          authorAvatarUrl={undefined}
                          authorId={item.user_id}
                          likes={item.likes_count || 0}
                          comments={item?.comments?.[0]?.count || 0}
                          isLiked={userLikes.has(item.picture_id || item.id)}
                          description={item.description}
                          type={itemType}
                          meta={item.meta}
                          onClick={() => handleMediaClick(item.id, itemType, index)}
                          onLike={fetchUserLikes}
                          onDelete={fetchMediaFromPicturesTable}
                          onEdit={handleEditPost}

                          created_at={item.created_at}
                          job={item.job}
                          responsive={item.responsive}
                          apiUrl={apiUrl}
                          preset={preset}
                        />
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          ))}
        </>
      )}

      {/* Loading Indicator / Observer Target */}
      <div ref={observerTarget} className="h-10 w-full flex items-center justify-center p-4">
        {isFetchingMore && (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
        )}
      </div>
    </div>
  );
};

// Backward compatibility export
export default MediaGrid;

// Named exports for clarity
export { MediaGrid };
export const PhotoGrid = MediaGrid;
