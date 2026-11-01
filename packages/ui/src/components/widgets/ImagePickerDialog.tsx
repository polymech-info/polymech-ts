import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/db';
import { fetchPictures as fetchPicturesAPI, fetchUserPictures } from '@/modules/posts/client-pictures';
import { fetchPostsList } from '@/modules/posts/client-posts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { T, translate } from '@/i18n';
import { Search, Image as ImageIcon, Tag, FolderOpen, X, Layers, User, GitBranch } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import MediaCard from '@/components/MediaCard';
import { MediaType } from '@/lib/mediaRegistry';
import { FileBrowserWidget } from '@/modules/storage/FileBrowserWidget';
import { vfsUrl, IMAGE_EXTS, VIDEO_EXTS } from '@/modules/storage/helpers';
import type { INode } from '@/modules/storage/types';

const mediaGlob = Array.from(new Set([...IMAGE_EXTS, ...VIDEO_EXTS])).map(ext => `*.${ext}`).join(',');

interface ImagePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (pictureId: string) => void;
  onSelectPicture?: (picture: Picture) => void;
  onSelectResult?: (result: { pictureId: string; postId?: string }) => void;
  onMultiSelect?: (pictureIds: string[]) => void;
  onMultiSelectPictures?: (pictures: Picture[]) => void;
  currentValue?: string | null;
  currentValues?: string[];
  multiple?: boolean;
  typeFilter?: string; // e.g. 'video-intern' to only show videos
}
interface Picture {
  id: string;
  title: string;
  image_url: string;
  thumbnail_url?: string;
  type?: string;
  user_id: string;
  tags: string[] | null;
  meta: any;
}

interface Collection {
  id: string;
  name: string;
  slug: string;
}

export interface SelectedItem {
  id: string;
  source: 'picture' | 'post' | 'file';
  thumbnail: string;
  title: string;
  data: Picture | any;
}

export const ImagePickerDialog: React.FC<ImagePickerDialogProps> = ({
  isOpen,
  onClose,
  onSelect,
  onMultiSelect,
  onMultiSelectPictures,
  currentValue,
  currentValues = [],
  multiple = false,
  onSelectPicture,
  onSelectResult,
  typeFilter
}) => {
  const { user } = useAuth();
  const [pictures, setPictures] = useState<Picture[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  // ── Cross-type selection bucket (multi-select) ──────────────
  const [bucket, setBucket] = useState<Map<string, SelectedItem>>(new Map());
  const bucketIds = useMemo(() => Array.from(bucket.keys()), [bucket]);
  const addToBucket = useCallback((item: SelectedItem) => {
    setBucket(prev => { const next = new Map(prev); next.set(item.id, item); return next; });
  }, []);
  const removeFromBucket = useCallback((id: string) => {
    setBucket(prev => { const next = new Map(prev); next.delete(id); return next; });
  }, []);
  const toggleInBucket = useCallback((item: SelectedItem) => {
    setBucket(prev => {
      const next = new Map(prev);
      if (next.has(item.id)) next.delete(item.id); else next.set(item.id, item);
      return next;
    });
  }, []);
  const clearBucket = useCallback(() => setBucket(new Map()), []);

  // ── Single-select state (unchanged) ─────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(currentValue || null);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<'pictures' | 'posts' | 'files'>('pictures');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Files state
  const [filePickerMount, setFilePickerMount] = useState('machines');
  const [filePickerPath, setFilePickerPath] = useState('/');
  const [selectedVfsNodes, setSelectedVfsNodes] = useState<any[]>([]);

  // Posts state
  const [posts, setPosts] = useState<any[]>([]);
  const [postsPage, setPostsPage] = useState(0);
  const [postsHasMore, setPostsHasMore] = useState(true);
  const [postsTotalCount, setPostsTotalCount] = useState(0);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsLoadingMore, setPostsLoadingMore] = useState(false);
  const [myOnly, setMyOnly] = useState(true);
  const prevIsOpen = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 50;

  // Version selection state
  const [versions, setVersions] = useState<Picture[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionsForId, setVersionsForId] = useState<string | null>(null);

  // Initial data fetch - only runs when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Reset pictures state
      setPictures([]);
      setCurrentPage(0);
      setHasMore(true);
      setTotalCount(0);
      setAllTags([]);
      // Reset posts state
      setPosts([]);
      setPostsPage(0);
      setPostsHasMore(true);
      setPostsTotalCount(0);
      setSelectedVfsNodes([]);
      // Fetch for the active view mode
      if (viewMode === 'pictures') {
        fetchPicturesPage(0, true);
      } else {
        fetchPostsPage(0, true);
      }
      // fetchCollections();
    }
  }, [isOpen]);

  // Fetch when view mode changes (if data not yet loaded)
  useEffect(() => {
    if (!isOpen) return;
    if (viewMode === 'pictures' && pictures.length === 0 && !loading) {
      fetchPicturesPage(0, true);
    } else if (viewMode === 'posts' && posts.length === 0 && !postsLoading) {
      fetchPostsPage(0, true);
    }
  }, [viewMode]);

  // Refetch when myOnly changes
  useEffect(() => {
    if (!isOpen) return;
    // Reset and refetch for current view mode
    if (viewMode === 'pictures') {
      setPictures([]);
      setCurrentPage(0);
      setHasMore(true);
      setTotalCount(0);
      setAllTags([]);
      fetchPicturesPage(0, true);
    } else {
      setPosts([]);
      setPostsPage(0);
      setPostsHasMore(true);
      setPostsTotalCount(0);
      fetchPostsPage(0, true);
    }
  }, [myOnly]);

  // Sync props to local state - only when dialog first opens (not on every render)
  useEffect(() => {
    const justOpened = isOpen && !prevIsOpen.current;
    prevIsOpen.current = isOpen;

    if (justOpened) {
      if (multiple) {
        // Seed bucket from currentValues (picture IDs only since that's what callers pass)
        const initial = new Map<string, SelectedItem>();
        (currentValues || []).forEach(id => {
          initial.set(id, { id, source: 'picture', thumbnail: '', title: id, data: null });
        });
        setBucket(initial);
      } else {
        setSelectedId(currentValue || null);
      }
      // Reset versions
      setVersions([]);
      setVersionsForId(null);
    }
  }, [isOpen, currentValue, currentValues, multiple]);

  // Fetch full version tree when a picture is selected (both single and multi-select)
  const activePickId = multiple ? lastSelectedId : selectedId;

  useEffect(() => {
    if (!activePickId) {
      setVersions([]);
      setVersionsForId(null);
      return;
    }

    // Find the selected picture to get parent_id info
    const selectedPic = pictures.find(p => p.id === activePickId);
    if (!selectedPic) return;

    // Walk up to find root, then collect all descendants
    const rootId = (selectedPic as any).parent_id || selectedPic.id;

    // Don't re-fetch if we already have versions for this root
    if (versionsForId === rootId) return;

    setVersionsLoading(true);
    setVersionsForId(rootId);

    // Use fetchUserPictures + tree walk (same as VersionMap) for full nested graph
    fetchUserPictures(selectedPic.user_id).then(allPictures => {
      if (!allPictures || allPictures.length === 0) {
        setVersions([]);
        return;
      }

      const pictureMap = new Map(allPictures.map((p: any) => [p.id, p]));

      // Walk up to find the true root
      let trueRootId = selectedPic.id;
      let current: any = pictureMap.get(selectedPic.id);
      while (current?.parent_id && pictureMap.has(current.parent_id)) {
        trueRootId = current.parent_id;
        current = pictureMap.get(current.parent_id);
      }

      // Collect all descendants from root
      const tree: any[] = [];
      const visited = new Set<string>();
      const collect = (nodeId: string) => {
        if (visited.has(nodeId)) return;
        const node = pictureMap.get(nodeId);
        if (!node) return;
        visited.add(nodeId);
        tree.push(node);
        allPictures.filter((p: any) => p.parent_id === nodeId).forEach((child: any) => collect(child.id));
      };
      collect(trueRootId);

      if (tree.length > 1) {
        setVersions(tree);
      } else {
        setVersions([]);
      }
    }).catch(err => {
      console.error('Error fetching version tree:', err);
      setVersions([]);
    }).finally(() => {
      setVersionsLoading(false);
    });
  }, [activePickId, pictures, user?.id]);

  const fetchPicturesPage = async (page: number, isInitial: boolean = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);
    try {
      const result = await fetchPicturesAPI({ limit: PAGE_SIZE, page, userId: myOnly && user ? user.id : undefined });
      const newData = (result.data || []).filter((p: any) => p.is_selected);

      setPictures(prev => isInitial ? newData : [...prev, ...newData]);
      setTotalCount(result.count || 0);
      setCurrentPage(page);

      // Check if there are more pages
      const fetched = (page + 1) * PAGE_SIZE;
      setHasMore(fetched < (result.count || 0));

      // Extract unique tags incrementally
      setAllTags(prev => {
        const tagsSet = new Set<string>(prev);
        newData.forEach((pic: any) => {
          pic.tags?.forEach((tag: string) => tagsSet.add(tag));
        });
        return Array.from(tagsSet).sort();
      });
    } catch (error) {
      console.error('Error fetching pictures:', error);
    } finally {
      if (isInitial) setLoading(false);
      else setLoadingMore(false);
    }
  };

  // Posts fetch
  const fetchPostsPage = async (page: number, isInitial: boolean = false) => {
    if (isInitial) setPostsLoading(true);
    else setPostsLoadingMore(true);
    try {
      const result = await fetchPostsList({ limit: PAGE_SIZE, page, userId: myOnly && user ? user.id : undefined });
      const newData = result.data || [];
      setPosts(prev => isInitial ? newData : [...prev, ...newData]);
      setPostsTotalCount(result.count || 0);
      setPostsPage(page);
      const fetched = (page + 1) * PAGE_SIZE;
      setPostsHasMore(fetched < (result.count || 0));
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      if (isInitial) setPostsLoading(false);
      else setPostsLoadingMore(false);
    }
  };

  // Scroll-based auto-load-more
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isOpen) return;

    const handleScroll = () => {
      if (viewMode === 'pictures') {
        if (loadingMore || loading || !hasMore) return;
        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollHeight - scrollTop - clientHeight < 300) {
          fetchPicturesPage(currentPage + 1);
        }
      } else {
        if (postsLoadingMore || postsLoading || !postsHasMore) return;
        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollHeight - scrollTop - clientHeight < 300) {
          fetchPostsPage(postsPage + 1);
        }
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [viewMode, currentPage, loadingMore, loading, hasMore, postsPage, postsLoadingMore, postsLoading, postsHasMore, isOpen]);

  const fetchCollections = async () => {
    if (!user) return;

    try {
      const data = await apiClient<any[]>(`/api/collections?userId=${user.id}`);
      setCollections(data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const filteredPictures = useMemo(() => {
    return pictures.filter(pic => {
      // Type filter (e.g. 'video-intern')
      if (typeFilter && pic.type !== typeFilter) return false;

      // Search filter
      const matchesSearch = pic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pic.id.toLowerCase().includes(searchQuery.toLowerCase());

      // Tag filter
      const matchesTags = selectedTags.length === 0 ||
        (pic.tags && selectedTags.some(tag => pic.tags?.includes(tag)));

      return matchesSearch && matchesTags;
    });
  }, [pictures, searchQuery, selectedTags, typeFilter]);

  // Further filter by collections if any selected
  const [finalPictures, setFinalPictures] = useState<Picture[]>([]);

  useEffect(() => {
    const filterByCollections = async () => {
      if (selectedCollections.length === 0) {
        setFinalPictures(filteredPictures);
        return;
      }

      try {
        const params = selectedCollections.map(id => `collectionId=${id}`).join('&');
        const data = await apiClient<{ picture_id: string }[]>(`/api/collection-pictures?${params}`);
        const pictureIdsInCollections = new Set(data?.map(cp => cp.picture_id) || []);
        setFinalPictures(filteredPictures.filter(pic => pictureIdsInCollections.has(pic.id)));
      } catch (error) {
        console.error('Error filtering by collections:', error);
        setFinalPictures(filteredPictures);
      }
    };

    filterByCollections();
  }, [filteredPictures, selectedCollections]);

  const handleSelect = () => {
    if (multiple) {
      const ids = bucketIds;
      if (onMultiSelect) {
        onMultiSelect(ids);
      }
      if (onMultiSelectPictures) {
        const allPics = Array.from(bucket.values()).map(item => {
          if (item.source === 'file') {
            return {
              id: item.id,
              image_url: item.id,
              thumbnail_url: item.thumbnail,
              title: item.title,
              user_id: user?.id || 'anon',
              type: 'supabase-image',
              tags: null,
              meta: {}
            } as any;
          }
          // picture or post – use original data
          return item.data || { id: item.id, image_url: item.thumbnail, title: item.title, user_id: user?.id || 'anon', tags: null, meta: {} };
        });
        onMultiSelectPictures(allPics);
      }
    } else {
      if (selectedId) {
        if (onSelect) onSelect(selectedId);
        if (onSelectPicture) {
          let pic = pictures.find(p => p.id === selectedId);
          // If not found in pictures (e.g. selected via posts mode), try the post's cover
          if (!pic) {
            const post = posts.find(p => p.cover?.id === selectedId);
            if (post?.cover) pic = post.cover;
          }
          // Also check versions (user may have picked a non-selected version)
          if (!pic && versions.length > 0) {
            pic = versions.find(v => v.id === selectedId) as any;
          }
          if (!pic) {
            const vfsNode = selectedVfsNodes.find(n => vfsUrl('get', filePickerMount, n.path) === selectedId);
            if (vfsNode) {
              pic = {
                id: selectedId,
                title: vfsNode.name || 'File',
                image_url: selectedId,
                thumbnail_url: selectedId,
                user_id: user?.id || 'anon',
                tags: null,
                meta: {}
              } as any;
            }
          }
          if (pic) onSelectPicture(pic);
        }

        if (onSelectResult) {
          onSelectResult({ pictureId: selectedId, postId: selectedPostId || undefined });
        }
      }
    }
    onClose();
  };

  const handleClear = () => {
    if (multiple) {
      clearBucket();
      setLastSelectedId(null);
    } else {
      setSelectedId(null);
    }
  };
  // Build a SelectedItem from the current viewMode context
  const makeSelectedItem = useCallback((id: string): SelectedItem => {
    if (viewMode === 'posts') {
      const post = posts.find(p => p.cover?.id === id);
      return { id, source: 'post', thumbnail: post?.cover?.thumbnail_url || post?.cover?.image_url || '', title: post?.title || id, data: post?.cover || null };
    }
    if (viewMode === 'files') {
      return { id, source: 'file', thumbnail: id, title: id.split('/').pop() || id, data: null };
    }
    // pictures
    const pic = pictures.find(p => p.id === id);
    return { id, source: 'picture', thumbnail: pic?.thumbnail_url || pic?.image_url || '', title: pic?.title || id, data: pic || null };
  }, [viewMode, pictures, posts]);

  const handleImageClick = (e: React.MouseEvent, id: string) => {
    if (!multiple) {
      setSelectedId(id);
      return;
    }

    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Toggle in bucket
      toggleInBucket(makeSelectedItem(id));
      setLastSelectedId(id);
    } else if (e.shiftKey) {
      // Range select (pictures tab only, posts/files don't have meaningful ranges)
      const list = viewMode === 'pictures' ? finalPictures : filteredPosts;
      const getId = (item: any) => viewMode === 'posts' ? item.cover?.id : item.id;
      const currentIndex = list.findIndex(p => getId(p) === id);
      const lastIndex = lastSelectedId ? list.findIndex(p => getId(p) === lastSelectedId) : -1;

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        list.slice(start, end + 1).forEach(item => {
          const itemId = getId(item);
          if (itemId) addToBucket(makeSelectedItem(itemId));
        });
      } else {
        addToBucket(makeSelectedItem(id));
      }
      setLastSelectedId(id);
    } else {
      // Exclusive: clear bucket, add just this one
      const item = makeSelectedItem(id);
      setBucket(new Map([[id, item]]));
      setLastSelectedId(id);
    }
  };
  // Filtered posts for search
  const filteredPosts = useMemo(() => {
    if (!searchQuery) return posts;
    const q = searchQuery.toLowerCase();
    return posts.filter(post =>
      post.title?.toLowerCase().includes(q) ||
      post.id.toLowerCase().includes(q)
    );
  }, [posts, searchQuery]);

  // Grouped results
  const activeSelectedIds = multiple ? bucketIds : (selectedId ? [selectedId] : []);

  const groupedPictures = useMemo(() => {
    const selected = activeSelectedIds.length > 0
      ? finalPictures.filter(p => activeSelectedIds.includes(p.id))
      : [];
    const selectedSet = new Set(selected.map(p => p.id));
    const rest = finalPictures.filter(p => !selectedSet.has(p.id));
    const recent = [...rest]
      .sort((a, b) => new Date(b.meta?.created_at || 0).getTime() - new Date(a.meta?.created_at || 0).getTime())
      .slice(0, 10);
    const recentSet = new Set(recent.map(p => p.id));
    const all = rest.filter(p => !recentSet.has(p.id));
    return { selected, recent, all };
  }, [finalPictures, activeSelectedIds]);

  const groupedPosts = useMemo(() => {
    const selected = activeSelectedIds.length > 0
      ? filteredPosts.filter(p => activeSelectedIds.includes(p.cover?.id))
      : [];
    const selectedSet = new Set(selected.map(p => p.id));
    const rest = filteredPosts.filter(p => !selectedSet.has(p.id));
    const recent = rest.slice(0, 10);
    const recentSet = new Set(recent.map(p => p.id));
    const all = rest.filter(p => !recentSet.has(p.id));
    return { selected, recent, all };
  }, [filteredPosts, activeSelectedIds]);

  const renderPictureCard = (picture: Picture) => {
    const isSelected = multiple
      ? bucket.has(picture.id)
      : selectedId === picture.id;
    return (
      <div
        key={picture.id}
        onClick={(e) => { setSelectedPostId(null); handleImageClick(e, picture.id); }}
        onDoubleClick={() => {
          setSelectedPostId(null);
          if (!multiple) {
            setSelectedId(picture.id);
            if (onSelect) onSelect(picture.id);
            if (onSelectPicture) onSelectPicture(picture);
            if (onSelectResult) onSelectResult({ pictureId: picture.id });
          } else {
            handleImageClick({ ctrlKey: true, preventDefault: () => { } } as any, picture.id);
            handleSelect();
          }
        }}
        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all group ${isSelected
          ? 'border-primary shadow-lg scale-[1.02]'
          : 'border-transparent hover:border-primary/50'
          }`}
      >
        <div className="aspect-square relative pointer-events-none">
          <MediaCard
            id={picture.id}
            pictureId={picture.id}
            url={picture.image_url}
            thumbnailUrl={picture.thumbnail_url}
            title={picture.title}
            author={'Me'}
            authorId={picture.user_id}
            likes={0}
            comments={0}
            type={picture.type as MediaType}
            meta={picture.meta}
            showContent={false}
            onClick={() => { }}
            onLike={undefined}
            onDelete={undefined}
            onEdit={undefined}
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pointer-events-none">
          <p className="text-white text-xs font-medium truncate">{picture.title}</p>
        </div>
      </div>
    );
  };

  const renderPostCard = (post: any) => {
    const coverId = post.cover?.id;
    const isSelected = multiple
      ? bucket.has(coverId)
      : selectedId === coverId;
    return (
      <div
        key={post.id}
        onClick={(e) => { if (coverId) { setSelectedPostId(post.id); handleImageClick(e, coverId); } }}
        onDoubleClick={() => {
          if (!coverId) return;
          setSelectedPostId(post.id);
          if (!multiple) {
            setSelectedId(coverId);
            if (onSelect) onSelect(coverId);
            if (onSelectPicture) onSelectPicture(post.cover);
            if (onSelectResult) onSelectResult({ pictureId: coverId, postId: post.id });
          } else {
            handleImageClick({ ctrlKey: true, preventDefault: () => { } } as any, coverId);
            handleSelect();
          }
        }}
        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all group ${isSelected
          ? 'border-primary shadow-lg scale-[1.02]'
          : 'border-transparent hover:border-primary/50'
          }`}
      >
        <div className="aspect-square relative">
          <img
            src={post.cover?.thumbnail_url || post.cover?.image_url}
            alt={post.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pointer-events-none">
          <p className="text-white text-xs font-medium truncate">{post.title}</p>
        </div>
        {post.picture_count > 1 && (
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
            <Layers className="h-3 w-3 inline mr-0.5" />{post.picture_count}
          </div>
        )}
      </div>
    );
  };

  // ── Stable VFS selection callbacks (prevent render loop) ────────
  const handleVfsSelectNodes = useCallback((nodes: INode[]) => {
    // Update selectedVfsNodes with any new nodes
    setSelectedVfsNodes(prev => {
      const newNodes = nodes.filter(n => !prev.find(p => p.path === n.path));
      if (newNodes.length === 0) return prev;
      return [...prev, ...newNodes];
    });

    if (multiple) {
      const fileNodes = nodes.filter(n => n.type !== 'dir' && n.mime !== 'inode/directory');
      fileNodes.forEach(n => {
        const url = vfsUrl('get', filePickerMount, n.path);
        addToBucket({ id: url, source: 'file', thumbnail: url, title: n.name, data: n });
      });
      if (fileNodes.length > 0) {
        setLastSelectedId(vfsUrl('get', filePickerMount, fileNodes[fileNodes.length - 1].path));
      }
    }
  }, [multiple, filePickerMount, addToBucket]);

  const handleVfsSelectNode = useCallback((node: INode | null) => {
    console.log('on select node', node);
    if (node?.type === 'dir' || node?.mime === 'inode/directory') {
      return;
    }
    if (node) {
      const url = vfsUrl('get', filePickerMount, node.path);
      if (!multiple) {
        setSelectedId(url);
        setSelectedVfsNodes(prev => {
          if (!prev.find(n => n.path === node.path)) {
            return [...prev, node];
          }
          return prev;
        });
      }
    } else {
      if (!multiple) {
        setSelectedId(null);
      }
    }
  }, [multiple, filePickerMount]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle><T>Select Picture</T></DialogTitle>
          <DialogDescription>
            <T>Choose a picture from your published images</T>
          </DialogDescription>
        </DialogHeader>

        {/* My Only Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 border rounded-lg p-1 w-fit">
            <button
              onClick={() => setViewMode('pictures')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'pictures'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <T>Pictures</T>
            </button>
            <button
              onClick={() => setViewMode('posts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'posts'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <T>Posts</T>
            </button>
            <button
              onClick={() => setViewMode('files')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'files'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <T>Files</T>
            </button>
          </div>
          {viewMode !== 'files' && (
            <button
              onClick={() => setMyOnly(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors ${myOnly
                ? 'bg-primary/10 border-primary text-primary'
                : 'border-muted text-muted-foreground hover:text-foreground'
                }`}
            >
              <User className="h-3.5 w-3.5" />
              <T>My only</T>
            </button>
          )}
        </div>

        {/* Search */}
        {viewMode !== 'files' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={translate(viewMode === 'pictures' ? 'Search by title or ID...' : 'Search posts...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Filter Buttons - only in pictures mode */}
        {viewMode === 'pictures' && <div className="space-y-3">
          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span><T>Tags</T></span>
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setSelectedTags([])}
                  >
                    <T>Clear</T>
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 12).map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedTags(prev =>
                        prev.includes(tag)
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                  >
                    {tag}
                    {selectedTags.includes(tag) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Collections Filter */}
          {collections.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FolderOpen className="h-4 w-4" />
                <span><T>Collections</T></span>
                {selectedCollections.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setSelectedCollections([])}
                  >
                    <T>Clear</T>
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {collections.map(collection => (
                  <Badge
                    key={collection.id}
                    variant={selectedCollections.includes(collection.id) ? "default" : "outline"}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedCollections(prev =>
                        prev.includes(collection.id)
                          ? prev.filter(c => c !== collection.id)
                          : [...prev, collection.id]
                      );
                    }}
                  >
                    {collection.name}
                    {selectedCollections.includes(collection.id) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>}

        {/* Content Grid */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 -mx-6 px-6">
          {viewMode === 'pictures' ? (
            /* Pictures Mode */
            loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : finalPictures.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  <T>{searchQuery || selectedTags.length > 0 || selectedCollections.length > 0 ? 'No pictures found' : 'No pictures available'}</T>
                </p>
              </div>
            ) : (
              <>
                {/* Selected Group */}
                {groupedPictures.selected.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1"><T>Selected</T></div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
                      {groupedPictures.selected.map(renderPictureCard)}
                    </div>
                  </div>
                )}
                {/* Versions Row */}
                {versions.length > 1 && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                      <GitBranch className="h-3 w-3" />
                      <T>Versions</T>
                      <span className="text-xs opacity-70">({versions.length})</span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 px-1">
                      {versions.map(v => {
                        const isVSelected = multiple
                          ? bucket.has(v.id)
                          : selectedId === v.id;
                        return (
                          <div
                            key={v.id}
                            onClick={() => {
                              if (multiple) {
                                // Swap: replace the activePickId in bucket with this version
                                if (activePickId && bucket.has(activePickId)) {
                                  removeFromBucket(activePickId);
                                  addToBucket({ id: v.id, source: 'picture', thumbnail: (v as any).thumbnail_url || (v as any).image_url || '', title: (v as any).title || v.id, data: v });
                                } else {
                                  addToBucket({ id: v.id, source: 'picture', thumbnail: (v as any).thumbnail_url || (v as any).image_url || '', title: (v as any).title || v.id, data: v });
                                }
                                setLastSelectedId(v.id);
                              } else {
                                setSelectedId(v.id);
                                setSelectedPostId(null);
                              }
                            }}
                            onDoubleClick={() => {
                              if (multiple) {
                                if (activePickId && bucket.has(activePickId)) {
                                  removeFromBucket(activePickId);
                                  addToBucket({ id: v.id, source: 'picture', thumbnail: (v as any).thumbnail_url || (v as any).image_url || '', title: (v as any).title || v.id, data: v });
                                }
                                handleSelect();
                              } else {
                                setSelectedId(v.id);
                                setSelectedPostId(null);
                                if (onSelect) onSelect(v.id);
                                if (onSelectPicture) onSelectPicture(v as any);
                                if (onSelectResult) onSelectResult({ pictureId: v.id });
                                onClose();
                              }
                            }}
                            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all shrink-0 w-24 h-24 ${isVSelected
                              ? 'border-primary shadow-lg scale-[1.02]'
                              : 'border-transparent hover:border-primary/50'
                              }`}
                          >
                            <img
                              src={(v as any).thumbnail_url || (v as any).image_url}
                              alt={(v as any).title || 'Version'}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {(v as any).is_selected && (
                              <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] px-1 rounded">
                                ★
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {versionsLoading && (
                  <div className="mb-4 flex items-center gap-2 px-1 text-xs text-muted-foreground">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                    <T>Loading versions...</T>
                  </div>
                )}
                {/* Recent Group */}
                {groupedPictures.recent.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1"><T>Recent</T></div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
                      {groupedPictures.recent.map(renderPictureCard)}
                    </div>
                  </div>
                )}
                {/* All Group */}
                {groupedPictures.all.length > 0 && (
                  <div className="mb-4">
                    {(groupedPictures.selected.length > 0 || groupedPictures.recent.length > 0) && (
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1"><T>All</T></div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
                      {groupedPictures.all.map(renderPictureCard)}
                    </div>
                  </div>
                )}

                {/* Loading more indicator */}
                {hasMore && (
                  <div className="flex items-center justify-center py-4">
                    {loadingMore && (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    )}
                  </div>
                )}
              </>
            )
          ) : viewMode === 'posts' ? (
            /* Posts Mode */
            postsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  <T>{searchQuery ? 'No posts found' : 'No posts available'}</T>
                </p>
              </div>
            ) : (
              <>
                {/* Selected Group */}
                {groupedPosts.selected.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1"><T>Selected</T></div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
                      {groupedPosts.selected.map(renderPostCard)}
                    </div>
                  </div>
                )}
                {/* Recent Group */}
                {groupedPosts.recent.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1"><T>Recent</T></div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
                      {groupedPosts.recent.map(renderPostCard)}
                    </div>
                  </div>
                )}
                {/* All Group */}
                {groupedPosts.all.length > 0 && (
                  <div className="mb-4">
                    {(groupedPosts.selected.length > 0 || groupedPosts.recent.length > 0) && (
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1"><T>All</T></div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
                      {groupedPosts.all.map(renderPostCard)}
                    </div>
                  </div>
                )}

                {/* Loading more indicator */}
                {postsHasMore && (
                  <div className="flex items-center justify-center py-4">
                    {postsLoadingMore && (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    )}
                  </div>
                )}
              </>
            )
          ) : (
            /* Files Mode */
            <div className="h-full flex flex-col py-2">
              {/* @ts-expect-error Types in shared package mismatch with local usage */}
              <FileBrowserWidget
                mount={filePickerMount}
                path={filePickerPath}
                mode="simple"
                viewMode="list"
                showToolbar={true}
                canChangeMount={true}
                glob={mediaGlob}
                sortBy="name"
                index={false}
                onPathChange={setFilePickerPath}
                onSelectNodes={handleVfsSelectNodes}
                onSelectNode={handleVfsSelectNode}
              />
            </div>
          )}
        </div>

        {/* Bucket strip – persistent selected items across all tabs */}
        {multiple && bucket.size > 0 && (
          <div className="border-t pt-2 pb-1 px-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>{bucket.size} selected</span>
              <button onClick={clearBucket} className="text-xs text-destructive hover:text-destructive/80 transition-colors">
                <T>Clear all</T>
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {Array.from(bucket.values()).map(item => (
                <div key={item.id} className="relative shrink-0 w-14 h-14 rounded-md overflow-hidden border border-primary/40 group">
                  <img
                    src={item.thumbnail || ''}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Source badge */}
                  <div className={`absolute top-0.5 left-0.5 w-2 h-2 rounded-full ${
                    item.source === 'picture' ? 'bg-blue-400' : item.source === 'post' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} title={item.source} />
                  {/* Remove button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFromBucket(item.id); }}
                    className="absolute top-0 right-0 bg-black/60 text-white rounded-bl p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t mt-auto">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {multiple ? `${bucket.size} selected` : (selectedId ? '1 selected' : '')}
              {viewMode === 'pictures' && totalCount > 0 && <span className="ml-2 text-xs opacity-70">({pictures.length} / {totalCount})</span>}
              {viewMode === 'posts' && postsTotalCount > 0 && <span className="ml-2 text-xs opacity-70">({posts.length} / {postsTotalCount})</span>}
            </span>
            {(multiple ? bucket.size > 0 || (currentValues && currentValues.length > 0) : !!selectedId || !!currentValue) && (
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleClear}>
                <X className="h-4 w-4 mr-1" />
                <T>Clear</T>
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              <T>Cancel</T>
            </Button>
            <Button onClick={handleSelect} disabled={multiple ? bucket.size === 0 : !selectedId}>
              <T>Select Picture{multiple ? 's' : ''}</T>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
