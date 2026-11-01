import { useState, useEffect, useRef, Suspense, lazy } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useWizardContext } from "@/hooks/useWizardContext";
import { T, translate } from "@/i18n";
import { isVideoType } from "@/lib/mediaRegistry";

import { getYouTubeId, getTikTokId, updateMediaPositions, getVideoUrlWithResolution } from "./views/utils";

import { YouTubeDialog } from "./views/components/YouTubeDialog";
import { TikTokDialog } from "./views/components/TikTokDialog";

import UserPage from "@/modules/pages/UserPage";
import { ThumbsRenderer } from "./views/renderers/ThumbsRenderer";
import { CompactRenderer } from "./views/renderers/CompactRenderer";
import { usePostActions } from "./views/usePostActions";
import { exportMarkdown, downloadMediaItem } from "./views/PostActions";
import { DeleteDialog } from "./views/components/DeleteDialogs";
import { CategoryManager } from "@/components/widgets/CategoryManager";
import { SEO } from "@/components/SEO";


import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

// New Modules
import { PostMediaItem as MediaItem, PostItem, UserProfile } from "./views/types";
import { ImageFile, MediaType } from "@/types";
import { uploadInternalVideo } from "@/utils/uploadUtils";
import { fetchPageById } from "@/modules/pages/client-pages";
import { addCollectionPictures, createPicture, fetchPictureById, fetchVersions, toggleLike, unlinkPictures, updatePicture, updateStorageFile, uploadFileToStorage, upsertPictures } from "@/modules/posts/client-pictures";
import { fetchPostById, updatePostDetails } from "@/modules/posts/client-posts";


// Heavy Components - Lazy Loaded
const ImagePickerDialog = lazy(() => import("@/components/widgets/ImagePickerDialog").then(module => ({ default: module.ImagePickerDialog })));
const ImageWizard = lazy(() => import("@/components/ImageWizard"));
const EditImageModal = lazy(() => import("@/components/EditImageModal"));
const EditVideoModal = lazy(() => import("@/components/EditVideoModal"));
const SmartLightbox = lazy(() => import("./views/components/SmartLightbox"));

interface PostProps {
  postId?: string;
  embedded?: boolean;
  className?: string;
}

const Post = ({ postId: propPostId, embedded = false, className }: PostProps) => {
  const { id: paramId } = useParams<{ id: string }>();
  const id = propPostId || paramId;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { user } = useAuth();

  const { setWizardImage } = useWizardContext();

  // ... state ...
  const [post, setPost] = useState<PostItem | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaItem, setMediaItem] = useState<MediaItem | null>(null); // Current displaying item

  // ... other state ...
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const preLightboxFocusRef = useRef<HTMLElement | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [versionImages, setVersionImages] = useState<ImageFile[]>([]);
  // Don't calculate currentImageIndex here yet, wait for render or use memo
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);

  const [youTubeUrl, setYouTubeUrl] = useState('');
  const [tikTokUrl, setTikTokUrl] = useState('');

  // NOTE: llm hook removed from here, now inside SmartLightbox

  const isVideo = isVideoType(mediaItem?.type as MediaType);

  // Initialize viewMode from URL parameter
  const [viewMode, setViewMode] = useState<'compact' | 'thumbs'>(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'compact' || viewParam === 'thumbs') {
      return viewParam;
    }
    return 'compact';
  });



  // Render Page Content if it's an internal page


  // Calculate index safely
  const currentImageIndex = mediaItems.findIndex(item => item.id === mediaItem?.id);

  // Unified URL sync: write `view`, `pic`, and `fullscreen` params atomically (standalone only)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (embedded) return;
    // Skip the very first render to avoid overwriting URL before data loads
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const newParams = new URLSearchParams(searchParams);
    newParams.set('view', viewMode);

    if (mediaItem?.id) {
      newParams.set('pic', mediaItem.id);
    } else {
      newParams.delete('pic');
    }

    if (showLightbox) {
      newParams.set('fullscreen', '1');
    } else {
      newParams.delete('fullscreen');
    }

    // Only update if something actually changed
    const currentView = searchParams.get('view');
    const currentPic = searchParams.get('pic');
    const currentFs = searchParams.get('fullscreen');
    const targetFs = showLightbox ? '1' : null;
    if (currentView !== viewMode || currentPic !== (mediaItem?.id || null) || currentFs !== targetFs) {
      setSearchParams(newParams, { replace: true });
    }
  }, [viewMode, mediaItem?.id, showLightbox, embedded]);

  // Sync URL → state (only for external URL changes, e.g. browser back/forward)
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'compact' || viewParam === 'thumbs') {
      setViewMode(viewParam as any);
    }

    // Restore pic selection from URL if items are loaded
    const picParam = searchParams.get('pic');
    if (picParam && mediaItems.length > 0) {
      const targetItem = mediaItems.find(item => item.id === picParam);
      if (targetItem && targetItem.id !== mediaItem?.id) {
        setMediaItem(targetItem);
        setLikesCount(targetItem.likes_count || 0);
      }
    }

    // Restore fullscreen/lightbox state
    const fsParam = searchParams.get('fullscreen');
    setShowLightbox(fsParam === '1');
  }, [searchParams]);

  const [removedItemIds, setRemovedItemIds] = useState<Set<string>>(new Set());

  // Inline Editor State
  const [isEditMode, setIsEditMode] = useState(false);
  const [localPost, setLocalPost] = useState<{ title: string; description: string; settings?: any } | null>(null);
  const [localMediaItems, setLocalMediaItems] = useState<any[]>([]);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [showAIWizard, setShowAIWizard] = useState(false);
  const insertIndexRef = useRef<number>(0);

  const isOwner = user?.id === mediaItem?.user_id;

  const videoPosterUrl = (isVideo && mediaItem?.thumbnail_url)
    ? (mediaItem.image_url.includes('/api/videos/')
      ? mediaItem.thumbnail_url
      : `${mediaItem.thumbnail_url}?width=1280&height=720&fit_mode=preserve&time=0`)
    : undefined;

  const videoPlaybackUrl = (isVideo && mediaItem?.image_url) ? getVideoUrlWithResolution(mediaItem.image_url) : undefined;

  useEffect(() => {
    const savedMode = localStorage.getItem('postViewMode');
    if (savedMode === 'compact' || savedMode === 'thumbs') {
      setViewMode(savedMode as any);
    } else if (post?.settings?.display && (post.settings.display === 'compact' || post.settings.display === 'thumbs')) {
      setViewMode(post.settings.display);
    }
  }, [post]);

  const handleViewMode = (mode: 'compact' | 'thumbs') => {
    setViewMode(mode);
    // LocalStorage backup removed to favor URL matching
    // localStorage.setItem('postViewMode', mode); 
  };

  const handleRemoveFromPost = (index: number) => {
    const itemToRemove = localMediaItems[index];
    if (!itemToRemove) return;
    setRemovedItemIds(prev => new Set(prev).add(itemToRemove.id));
    const newItems = [...localMediaItems];
    newItems.splice(index, 1);
    updateMediaPositions(newItems, setLocalMediaItems, setMediaItems);
    toast.success(translate("Removed from post"));
  };

  const handleInlineUpload = async (files: File[], insertIndex: number) => {
    if (!files.length || !user?.id) return;
    toast.info(`Uploading ${files.length} images...`);

    const newItems = [...localMediaItems];
    const newUploads: any[] = [];

    for (const file of files) {
      try {
        if (file.type.startsWith('video')) {
          // Handle video upload via internal API
          const uploadData = await uploadInternalVideo(file, user.id);

          // Fetch the created picture record to get the correct URL and details
          const picture = await fetchPictureById(uploadData.dbId);
          if (!picture) throw new Error('Failed to retrieve uploaded video details');

          const newItem = {
            id: picture.id,
            title: picture.title,
            description: picture.description || '',
            image_url: picture.image_url,
            thumbnail_url: picture.thumbnail_url,
            user_id: user.id,
            post_id: post?.id,
            type: picture.type || 'video',
            created_at: picture.created_at,
            position: 0,
            meta: picture.meta
          };
          newUploads.push(newItem);

        } else {
          // Handle regular image upload to storage
          const publicUrl = await uploadFileToStorage(user.id, file);

          const newItem = {
            id: crypto.randomUUID(),
            title: file.name.split('.')[0],
            description: '',
            image_url: publicUrl,
            user_id: user.id,
            post_id: post?.id,
            type: 'image',
            created_at: new Date().toISOString(),
            position: 0
          };
          newUploads.push(newItem);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (newUploads.length > 0) {
      newItems.splice(insertIndex, 0, ...newUploads);
      const reordered = newItems.map((item, idx) => ({ ...item, position: idx }));
      setLocalMediaItems(reordered);
      toast.success(`Added ${newUploads.length} images`);
    }
  };

  const openGalleryPicker = (index: number) => {
    insertIndexRef.current = index;
    setShowGalleryPicker(true);
  };

  const openAIWizard = (index: number) => {
    insertIndexRef.current = index;
    setWizardImage(null);
    setShowAIWizard(true);
  };

  const handleAIWizardPublish = async (newImages: ImageFile[]) => {
    if (!newImages?.length) return;
    const newItems = newImages.map(img => ({
      id: crypto.randomUUID(),
      title: img.title || 'AI Generated',
      description: (img as any).aiText || '',
      image_url: img.src,
      thumbnail_url: img.src,
      user_id: user?.id,
      post_id: post?.id,
      type: 'image',
      created_at: new Date().toISOString(),
      position: 0
    }));
    const currentItems = [...localMediaItems];
    currentItems.splice(insertIndexRef.current, 0, ...newItems);
    const reordered = currentItems.map((item, idx) => ({ ...item, position: idx }));
    setLocalMediaItems(reordered);
    setShowAIWizard(false);
    toast.success(`Added ${newItems.length} AI generated image(s)`);
  };

  const handleGallerySelect = async (pictureId: string) => {
    setShowGalleryPicker(false);
    toast.info("Adding image from gallery...");
    try {
      const picture = await fetchPictureById(pictureId);
      if (!picture) return;

      const newItem = {
        id: crypto.randomUUID(),
        title: picture.title,
        description: picture.description || '',
        image_url: picture.image_url,
        thumbnail_url: picture.thumbnail_url,
        user_id: user?.id,
        post_id: post?.id,
        type: picture.type || 'image',
        created_at: new Date().toISOString(),
        position: 0,
        meta: picture.meta
      };
      const newItems = [...localMediaItems];
      newItems.splice(insertIndexRef.current, 0, newItem);
      const reordered = newItems.map((item, idx) => ({ ...item, position: idx }));
      setLocalMediaItems(reordered);
      toast.success("Image added from gallery");
    } catch (error) {
      console.error("Error adding from gallery:", error);
      toast.error("Failed to add image");
    }
  };

  const toggleEditMode = () => {
    if (!isEditMode) {
      setLocalPost({
        title: post?.title || mediaItem?.title || '',
        description: post?.description || mediaItem?.description || '',
        settings: post?.settings || {},
      });
      const itemsWithPos = mediaItems.map((item, idx) => ({
        ...item,
        position: item.position ?? idx
      })).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      setLocalMediaItems(itemsWithPos);
    }
    setIsEditMode(!isEditMode);
  };

  const handleSaveChanges = async () => {
    if (!localPost || !post) return;
    toast.promise(
      async () => {
        // Only update the post record if it's a real post (not a pseudo post from a standalone picture)
        if (!post.isPseudo) {
          await updatePostDetails(post.id, {
            title: localPost.title,
            description: localPost.description,
            settings: localPost.settings,
          });
        }

        if (removedItemIds.size > 0) {
          await unlinkPictures(Array.from(removedItemIds));
        }

        if (post.isPseudo && localMediaItems.length > 0) {
          // For pseudo-posts (standalone pictures), update the picture directly
          // Don't set post_id since there is no real post
          const item = localMediaItems[0];
          await updatePicture(item.id, {
            title: localPost.title || item.title,
            description: localPost.description || item.description,
            updated_at: new Date().toISOString(),
          });
        } else {
          const updates = localMediaItems.map((item, index) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            position: index,
            updated_at: new Date().toISOString(),
            user_id: user?.id || item.user_id,
            post_id: post.id,
            image_url: item.image_url,
            type: item.type || 'image',
            thumbnail_url: item.thumbnail_url
          }));

          await upsertPictures(updates);
        }

        setRemovedItemIds(new Set());
        setTimeout(() => window.location.reload(), 500);
      },
      {
        loading: 'Saving changes...',
        success: 'Changes saved successfully!',
        error: 'Failed to save changes',
      }
    );
  };


  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...localMediaItems];
    if (direction === 'up' && index > 0) {
      [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
    } else if (direction === 'down' && index < newItems.length - 1) {
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    }
    const reordered = newItems.map((item, idx) => ({ ...item, position: idx }));
    setLocalMediaItems(reordered);
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      const newIndex = currentImageIndex - 1;
      setMediaItem(mediaItems[newIndex]);
      setLikesCount(mediaItems[newIndex].likes_count || 0);
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < mediaItems.length - 1) {
      const newIndex = currentImageIndex + 1;
      setMediaItem(mediaItems[newIndex]);
      setLikesCount(mediaItems[newIndex].likes_count || 0);
    }
  };



  const loadVersions = async () => {
    if (!mediaItem || isVideo) return;
    try {
      const allImages = await fetchVersions(mediaItem, user?.id) as any[];
      const parentImage = allImages.find(img => !img.parent_id) || mediaItem;
      const imageFiles: ImageFile[] = allImages.map(img => ({
        path: img.id,
        src: img.image_url,
        selected: img.id === mediaItem.id,
        isGenerated: !!img.parent_id,
        title: img.title || parentImage.title,
        description: img.description || parentImage.description
      }));
      setVersionImages(imageFiles);
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  };


  useEffect(() => {
    if (id) {
      fetchMedia();
    }
  }, [id, user?.id]);

  useEffect(() => {
    if (mediaItem) {
      // loadVersions(); // Deprecated: Versions handled by server aggregation
      // fetchAuthorProfile(); // Deprecated: Author returned in post details
      // checkIfLiked(mediaItem.id); // Deprecated: is_liked returned in post details

      // We still update local like state when mediaItem changes
      if (mediaItem.is_liked !== undefined) {
        setIsLiked(mediaItem.is_liked || false);
      }
      if (mediaItem.likes_count !== undefined) {
        setLikesCount(mediaItem.likes_count);
      }
    }
  }, [mediaItem]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true' ||
        activeElement.getAttribute('role') === 'textbox'
      );
      if (isInputFocused) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentImageIndex > 0) handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentImageIndex < mediaItems.length - 1) handleNextImage();
      } else if ((e.key === ' ' || e.key === 'Enter') && !showLightbox) {
        e.preventDefault();
        preLightboxFocusRef.current = document.activeElement as HTMLElement;
        setShowLightbox(true);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showLightbox, currentImageIndex, mediaItems]);


  const fetchMedia = async () => {
    // Versions and likes are resolved server-side now

    try {
      const postData = await fetchPostById(id!);
      if (postData) {
        let items = (postData.pictures as any[]).map((p: any) => ({
          ...p,
          type: p.type as MediaType,
          renderKey: p.id
        })).sort((a, b) => (a.position || 0) - (b.position || 0));

        items = items.filter((item: any) => item.visible );
        items.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
        // Server now returns full version set and like status
        // items already contains all versions and is_liked from fetchPostById API response

        setPost({ ...postData, pictures: items });
        if (items.length === 0 && (postData.settings as any)?.link) {
          // Create virtual picture for Link Post
          const settings = (postData.settings as any);
          items.push({
            id: postData.id,
            title: postData.title,
            description: postData.description,
            image_url: settings.image_url || `https://picsum.photos/seed/800/600`, // Fallback
            thumbnail_url: settings.thumbnail_url || null,
            user_id: postData.user_id,
            type: 'page-external',
            created_at: postData.created_at,
            position: 0,
            renderKey: postData.id,
            meta: { url: settings.link },
            likes_count: 0, // Could fetch real likes on post container if supported
            visible: true
          });
        }

        if (items.length > 0) {
          setMediaItems(items);
          // Restore selection from URL ?pic= param, then prefer is_selected, fallback to first
          const picParam = searchParams.get('pic');
          const urlItem = picParam ? items.find((i: any) => i.id === picParam) : null;
          const selectedItems = items.filter((i: any) => i.is_selected);
          const initialItem = urlItem || selectedItems[0] || items[0];
          setMediaItem(initialItem);
          setLikesCount(initialItem.likes_count || 0);
        } else {
          toast.error('This post has no media');
        }
        return;
      }

      const pictureData = await fetchPictureById(id!);
      if (pictureData) {
        if (pictureData.post_id) {
          const fullPostData = await fetchPostById(pictureData.post_id);
          if (fullPostData) {
            let items = (fullPostData.pictures as any[]).map((p: any) => ({
              ...p,
              type: p.type as MediaType,
              renderKey: p.id
            })).sort((a, b) => (a.position || 0) - (b.position || 0));

            // Versions resolved server-side; fallback path might miss them if not updated to use API
            // items = await resolveVersions(items); 
            //items = items.filter((item: any) => item.visible || user?.id === item.user_id);
            items = items.filter((item: any) => item.visible );
            // Re-sort after filtering to ensure position order
            items.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));

            setPost({ ...fullPostData, settings: fullPostData.settings as any, pictures: items });
            
            setMediaItems(items);

            // Check if requested ID is in the resolved list
            const initialIndex = items.findIndex((p: any) => p.id === id);

            if (initialIndex >= 0) {
              setMediaItem(items[initialIndex]);
              setLikesCount(items[initialIndex].likes_count || 0);
            } else {
              // Requested ID might have been swapped out. 
              // Try to find if it was part of a family that is now represented by a selected version
              const rootId = pictureData.parent_id || pictureData.id;
              const swappedIndex = items.findIndex((p: any) => (p.parent_id || p.id) === rootId);

              if (swappedIndex >= 0) {
                setMediaItem(items[swappedIndex]);
                setLikesCount(items[swappedIndex].likes_count || 0);
              } else {
                const fallbackSelected = items.filter((i: any) => i.is_selected);
                const fallbackItem = fallbackSelected[0] || items[0];
                setMediaItem(fallbackItem);
                setLikesCount(fallbackItem.likes_count || 0);
              }
            }
          }
          return;
        }

        const pseudoPost: PostItem = {
          id: pictureData.post_id || pictureData.id,
          title: pictureData.title || 'Untitled',
          description: pictureData.description,
          user_id: pictureData.user_id,
          created_at: pictureData.created_at,
          updated_at: pictureData.created_at,
          pictures: [{ ...pictureData, type: pictureData.type as MediaType, mediaType: pictureData.type }],
          isPseudo: true
        };
        setPost(pseudoPost);
        setMediaItems(pseudoPost.pictures!);
        setMediaItem(pseudoPost.pictures![0]);
        setLikesCount(pictureData.likes_count || 0);
        return;
      }

      // 3. Try fetching as a Page (for page-intern items)
      try {
        const pageData = await fetchPageById(id!);
        if (pageData) {
          const pseudoPost: PostItem = {
            id: pageData.id,
            title: pageData.title,
            description: null,
            user_id: pageData.owner,
            created_at: pageData.created_at,
            updated_at: pageData.created_at,
            pictures: [],
            isPseudo: true,
            type: 'page-intern',
            meta: { slug: pageData.slug }
          };
          setPost(pseudoPost);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Error fetching page:", e);
      }

      toast.error(translate('Content not found'));
      debugger;
      // navigate('/');
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error(translate('Failed to load content'));
      debugger;
      // navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const actions = usePostActions({
    post,
    mediaItems,
    setMediaItems,
    mediaItem,
    user,
    fetchMedia
  });

  const handleYouTubeAdd = async () => {
    const videoId = getYouTubeId(youTubeUrl);
    if (!videoId) {
      toast.error(translate("Invalid YouTube URL"));
      return;
    }
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    const newVideoItem: any = {
      id: crypto.randomUUID(),
      type: 'youtube',
      image_url: embedUrl,
      thumbnail_url: thumbnailUrl,
      title: 'YouTube Video',
      description: '',
      user_id: user?.id || '',
      created_at: new Date().toISOString(),
      likes_count: 0
    };
    if (insertIndexRef.current !== -1) {
      const newItems = [...localMediaItems];
      newItems.splice(insertIndexRef.current, 0, newVideoItem);
      updateMediaPositions(newItems, setLocalMediaItems, setMediaItems);
    } else {
      updateMediaPositions([...localMediaItems, newVideoItem], setLocalMediaItems, setMediaItems);
    }
    setYouTubeUrl('');
    actions.setShowYouTubeDialog(false);
    toast.success(translate("YouTube video added"));
  };

  const handleTikTokAdd = async () => {
    const videoId = getTikTokId(tikTokUrl);
    if (!videoId) {
      toast.error(translate("Invalid TikTok URL"));
      return;
    }
    const embedUrl = `https://www.tiktok.com/embed/v2/${videoId}`;
    const thumbnailUrl = `https://sf16-scmcdn-sg.ibytedtos.com/goofy/tiktok/web/node/_next/static/images/logo-dark-e95da587b6efa1520dcd11f4b45c0cf6.svg`;
    const newVideoItem: any = {
      id: crypto.randomUUID(),
      type: 'tiktok',
      image_url: embedUrl,
      thumbnail_url: thumbnailUrl,
      title: 'TikTok Video',
      description: '',
      user_id: user?.id || '',
      created_at: new Date().toISOString(),
      likes_count: 0
    };
    if (insertIndexRef.current !== -1) {
      const newItems = [...localMediaItems];
      newItems.splice(insertIndexRef.current, 0, newVideoItem);
      updateMediaPositions(newItems, setLocalMediaItems, setMediaItems);
    } else {
      updateMediaPositions([...localMediaItems, newVideoItem], setLocalMediaItems, setMediaItems);
    }
    setTikTokUrl('');
    actions.setShowTikTokDialog(false);
    toast.success(translate("TikTok video added"));
  };


  const handleLike = async () => {
    if (!user || !mediaItem) {
      toast.error(translate('Please sign in to like this'));
      return;
    }
    try {
      const isNowLiked = await toggleLike(user.id, mediaItem.id, isLiked);
      setIsLiked(isNowLiked);
      setLikesCount(prev => isNowLiked ? prev + 1 : prev - 1);

      setMediaItems(prevItems => prevItems.map(item => {
        if (item.id === mediaItem.id) {
          return {
            ...item,
            is_liked: isNowLiked,
            likes_count: (item.likes_count || 0) + (isNowLiked ? 1 : -1)
          };
        }
        return item;
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error(translate('Failed to update like'));
    }
  };

  const handleDownload = async () => {
    await downloadMediaItem(mediaItem, isVideo);
  };

  const handlePublish = async (option: 'overwrite' | 'new' | 'version', imageUrl: string, newTitle: string, description?: string, parentId?: string, collectionIds?: string[]) => {
    if (!mediaItem || isVideo || !user) {
      toast.error(translate('Please sign in to publish images'));
      return;
    }
    setIsPublishing(true);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      if (option === 'overwrite') {
        const currentImageUrl = mediaItem.image_url;
        if (currentImageUrl.includes('supabase.co/storage/')) {
          const urlParts = currentImageUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const bucketPath = `${mediaItem.user_id}/${fileName}`;
          await updateStorageFile(bucketPath, blob);
          toast.success(translate('Image updated successfully!'));
          fetchMedia();
        } else {
          toast.error(translate('Cannot overwrite this image'));
          return;
        }
      } else if (option === 'version') {
        const publicUrl = await uploadFileToStorage(user.id, blob, `${user.id}/${Date.now()}-version.png`);
        const pictureData = await createPicture({
          title: newTitle?.trim() || null,
          description: description || `Generated from: ${mediaItem.title}`,
          image_url: publicUrl,
          user_id: user.id,
          parent_id: parentId || mediaItem.id,
          is_selected: false,
          visible: false
        });
        if (collectionIds && collectionIds.length > 0 && pictureData) {
          await addCollectionPictures(collectionIds.map(collectionId => ({ collection_id: collectionId, picture_id: pictureData.id })));
        }
        toast.success(translate('Version saved successfully!'));
        loadVersions();
      } else {
        const publicUrl = await uploadFileToStorage(user.id, blob, `${user.id}/${Date.now()}-generated.png`);
        const pictureData = await createPicture({
          title: newTitle?.trim() || null,
          description: description || `Generated from: ${mediaItem.title}`,
          image_url: publicUrl,
          user_id: user.id
        });
        if (collectionIds && collectionIds.length > 0 && pictureData) {
          await addCollectionPictures(collectionIds.map(collectionId => ({ collection_id: collectionId, picture_id: pictureData.id })));
        }
        toast.success(translate('Image published to gallery!'));
      }
      setShowLightbox(false);
      // llm state cleared by component

    } catch (error) {
      console.error('Error publishing image:', error);
      toast.error(translate('Failed to publish image'));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleOpenInWizard = (imageUrl?: string) => {
    if (!mediaItem || isVideo) return;
    const imageToEdit = imageUrl || mediaItem.image_url;
    const imageData = {
      id: mediaItem.id,
      src: imageToEdit,
      title: mediaItem.title,
      realDatabaseId: mediaItem.id,
      selected: true
    };
    setWizardImage(imageData, window.location.pathname);
    setShowLightbox(false);
    navigate('/wizard');
  };

  const handleEditPicture = () => {
    if (!mediaItem) return;
    setShowEditModal(true);
  };

  const handleEditPost = () => {
    if (!post) return;
    navigate(`/post/${post.id}/edit`);
  };

  const rendererProps = {
    post, authorProfile, mediaItems, localMediaItems, mediaItem: mediaItem!,
    user, isOwner: !!isOwner, isEditMode, isLiked, likesCount,
    localPost, setLocalPost, setLocalMediaItems,

    onEditModeToggle: toggleEditMode,
    onEditPost: handleEditPost,
    onViewModeChange: handleViewMode,
    onExportMarkdown: () => exportMarkdown(post, mediaItem!, mediaItems, authorProfile),
    onSaveChanges: handleSaveChanges,
    onDeletePost: () => actions.setShowDeletePostDialog(true),
    onDeletePicture: () => actions.setShowDeletePictureDialog(true),
    onLike: handleLike,
    onUnlinkImage: actions.handleUnlinkImage,
    onRemoveFromPost: handleRemoveFromPost,
    onEditPicture: handleEditPicture,
    onGalleryPickerOpen: openGalleryPicker,
    onYouTubeAdd: () => actions.setShowYouTubeDialog(true),
    onTikTokAdd: () => actions.setShowTikTokDialog(true),
    onAIWizardOpen: openAIWizard,
    onInlineUpload: handleInlineUpload,
    onMoveItem: moveItem,
    onMediaSelect: setMediaItem,
    onExpand: (item: MediaItem) => { setMediaItem(item); setShowLightbox(true); },
    onDownload: handleDownload,
    onCategoryManagerOpen: () => actions.setShowCategoryManager(true),


    currentImageIndex,
    videoPlaybackUrl,
    videoPosterUrl,
    versionImages,

    handlePrevImage,
    embedded
  };

  // Render Page Content if it's an internal page
  if (post?.type === 'page-intern' && post.meta?.slug) {
    return (
      <UserPage
        userId={post.user_id}
        slug={post.meta.slug}
        embedded
      />
    );
  }

  if (loading) {
    return (
      <div className={embedded ? "flex items-center justify-center p-8" : "min-h-screen bg-background flex items-center justify-center"}>
        <div className="text-muted-foreground"><T>Loading...</T></div>
      </div>
    );
  }

  if (!mediaItem) {
    return (
      <div className={embedded ? "flex items-center justify-center p-8" : "min-h-screen bg-background flex items-center justify-center"}>
        <div className="text-center space-y-4">
          <div className="text-muted-foreground text-lg"><T>Content not found</T></div>
          {!embedded && <Button onClick={() => navigate('/')} variant="outline"><T>Go Home</T></Button>}
        </div>
      </div>
    );
  }

  const containerClassName = embedded
    ? `flex flex-col bg-background h-[inherit]  ${className || ''}`
    : "bg-background flex flex-col";

  // Desktop (lg+): fixed height for split gallery/details. Below lg: let content define height so
  // <main> (between nav + global footer) isn't shorter than this box — overflow was painting over the footer.
  if (!embedded && !className) {
    className = "max-lg:h-auto lg:h-[calc(100vh-4rem)]"
  }
  /*
  console.log('containerClassName', containerClassName);
  console.log('className', className);
  console.log('embedded', embedded);
*/

  return (
    <div className={embedded ? `bg-background ${className} min-h-0` : `bg-background ${className}`}>
      {post && (
        <SEO
          title={post.title || mediaItem?.title}
          description={post.description || mediaItem?.description || `View ${post.title} on Polymech`}
          image={mediaItem?.image_url}
          type={isVideo ? 'video.other' : 'article'}
        />
      )}
      <div
        className={
          embedded
            ? `w-full h-full min-h-0 flex-1 flex flex-col ${viewMode === 'thumbs' ? 'overflow-y-auto scrollbar-custom' : 'overflow-hidden'}`
            : 'w-full max-w-[1600px] mx-auto h-full'
        }
      >

        {viewMode === 'thumbs' ? (
          <ThumbsRenderer {...rendererProps} />
        ) : (
          <CompactRenderer {...rendererProps} mediaItem={mediaItem} />
        )}
      </div>

      <Suspense fallback={<div className="hidden">Loading editor...</div>}>
        {showEditModal && !isVideo && (
          <EditImageModal
            open={showEditModal}
            onOpenChange={setShowEditModal}
            pictureId={mediaItem.id}
            currentTitle={mediaItem.title}
            currentDescription={mediaItem.description}
            currentVisible={(mediaItem as any).visible ?? true}
            imageUrl={mediaItem.image_url}
            onUpdateSuccess={() => {
              setShowEditModal(false);
              fetchMedia();
            }}
          />
        )}

        {showEditModal && isVideo && (
          <EditVideoModal
            open={showEditModal}
            onOpenChange={setShowEditModal}
            videoId={mediaItem.id}
            currentTitle={mediaItem.title}
            currentDescription={mediaItem.description}
            currentVisible={(mediaItem as any).visible ?? true}
            onUpdateSuccess={() => {
              setShowEditModal(false);
              fetchMedia();
            }}
          />
        )}
      </Suspense>

      {
        !isVideo && showLightbox && (
          <Suspense fallback={<div className="fixed inset-0 z-[100] bg-background/50 backdrop-blur-sm flex items-center justify-center">Loading Lightbox...</div>}>
            <SmartLightbox
              isOpen={showLightbox}
              onClose={() => {
                setShowLightbox(false);
                // Restore focus to the element that was focused before lightbox opened
                requestAnimationFrame(() => {
                  //preLightboxFocusRef.current?.focus();
                  //preLightboxFocusRef.current = null;
                });
              }}
              mediaItem={mediaItem}
              user={user}
              isVideo={false}
              onPublish={handlePublish}
              onNavigate={(direction) => {
                if (direction === 'next') handleNextImage();
                else handlePrevImage();
              }}
              onOpenInWizard={() => handleOpenInWizard()} // SmartLightbox handles the argument if needed, or we adapt
              currentIndex={currentImageIndex}
              totalCount={mediaItems.length}
            />
          </Suspense>
        )
      }

      {/* Dialogs */}
      <YouTubeDialog
        open={actions.showYouTubeDialog}
        onOpenChange={actions.setShowYouTubeDialog}
        url={youTubeUrl}
        onUrlChange={setYouTubeUrl}
        onConfirm={handleYouTubeAdd}
      />

      <TikTokDialog
        open={actions.showTikTokDialog}
        onOpenChange={actions.setShowTikTokDialog}
        url={tikTokUrl}
        onUrlChange={setTikTokUrl}
        onConfirm={handleTikTokAdd}
      />

      <DeleteDialog
        open={actions.showDeletePostDialog}
        onOpenChange={actions.setShowDeletePostDialog}
        onConfirm={actions.handleDeletePost}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
      />

      <DeleteDialog
        open={actions.showDeletePictureDialog}
        onOpenChange={actions.setShowDeletePictureDialog}
        onConfirm={actions.handleDeletePicture}
        title="Delete Picture"
        description="Are you sure you want to delete this picture? This action cannot be undone."
      />

      <Suspense fallback={null}>
        {showEditModal && mediaItem && (
          <EditImageModal
            open={showEditModal}
            onOpenChange={setShowEditModal}
            pictureId={mediaItem.id}
            currentTitle={mediaItem.title}
            currentDescription={mediaItem.description || null}
            currentVisible={true} // Defaulting to true as visible prop might be on backend or handled otherwise
            imageUrl={mediaItem.image_url}
            onUpdateSuccess={() => {
              fetchMedia();
              setShowEditModal(false);
            }}
          />
        )}

        <ImagePickerDialog
          isOpen={showGalleryPicker}
          onClose={() => setShowGalleryPicker(false)}
          onSelect={handleGallerySelect}
        />

        {showAIWizard && (
          <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full h-full max-w-[1600px] bg-background border rounded-xl overflow-hidden shadow-2xl relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50"
                onClick={() => setShowAIWizard(false)}
              >
                <X className="h-6 w-6" />
              </Button>
              <ImageWizard
                key="inline-wizard"
                isOpen={true}
                onClose={() => setShowAIWizard(false)}
                mode="default"
                initialPostTitle={post?.title || ""}
                initialPostDescription={post?.description || ""}
                onPublish={handleAIWizardPublish as any}
              />
            </div>
          </div>
        )}

        <CategoryManager
          isOpen={actions.showCategoryManager}
          onClose={() => actions.setShowCategoryManager(false)}
          currentPageId={post?.id}
          currentPageMeta={post?.meta}
          onPageMetaUpdate={actions.handleMetaUpdate}
          filterByType="pages"
          defaultMetaType="pages"
        />
      </Suspense>
    </div>
  );
};

export default Post;
