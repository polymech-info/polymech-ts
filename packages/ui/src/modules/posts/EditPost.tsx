import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { T, translate } from '@/i18n';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { PostComposer } from './components/PostComposer';
import { ImageFile } from '@/components/ImageWizard/types';
import { fetchPostById, updatePostDetails } from '@/modules/posts/client-posts';
import { publishImage } from '@/components/ImageWizard/handlers/publishHandlers';
import { uploadImage } from '@/lib/uploadUtils';

const EditPost = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEditing = !!id;

    const [loading, setLoading] = useState(!!id);
    const [images, setImages] = useState<ImageFile[]>([]);
    const originalPictureIdsRef = useRef<string[]>([]);
    const [postTitle, setPostTitle] = useState('');
    const [postDescription, setPostDescription] = useState('');
    const [settings, setSettings] = useState<any>({ visibility: 'public' });
    const [isPublishing, setIsPublishing] = useState(false);

    // Drag and drop state
    const [dragIn, setDragIn] = useState(false);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const dragLeaveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    // Fetch post data
    useEffect(() => {
        if (!id) return;

        const loadPost = async () => {
            try {
                const postData = await fetchPostById(id);
                if (!postData) {
                    toast.error(translate('Post not found'));
                    navigate('/');
                    return;
                }

                // Check ownership
                if (user && postData.user_id !== user.id) {
                    toast.error(translate('You do not have permission to edit this post'));
                    navigate(`/post/${id}`);
                    return;
                }

                setPostTitle(postData.title || '');
                setPostDescription(postData.description || '');
                setSettings(postData.settings || { visibility: 'public' });

                // Convert pictures to ImageFile format
                const pics = (postData.pictures as any[]) || [];
                const wizardImages: ImageFile[] = pics
                    .sort((a, b) => (a.position || 0) - (b.position || 0))
                    .map(item => {
                        const isVideo = item.type === 'mux-video';
                        const meta = item.meta || {};
                        return {
                            id: item.id,
                            src: isVideo ? (item.thumbnail_url || item.image_url) : item.image_url,
                            title: item.title || '',
                            description: item.description || '',
                            selected: false,
                            realDatabaseId: item.id,
                            type: isVideo ? 'video' as const : 'image' as const,
                            uploadStatus: isVideo ? 'ready' as const : undefined,
                            muxUploadId: isVideo ? meta.mux_upload_id : undefined,
                            muxAssetId: isVideo ? meta.mux_asset_id : undefined,
                            muxPlaybackId: isVideo ? meta.mux_playback_id : undefined,
                        };
                    });

                originalPictureIdsRef.current = wizardImages.map(img => img.id);
                setImages(wizardImages);
            } catch (error) {
                console.error('Error loading post:', error);
                toast.error(translate('Failed to load post'));
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        loadPost();
    }, [id, user?.id]);

    // File upload handler
    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || !user) return;

        const newImages: ImageFile[] = Array.from(files).map(file => ({
            id: crypto.randomUUID(),
            file,
            src: URL.createObjectURL(file),
            title: file.name.split('.')[0],
            description: '',
            selected: false,
            type: file.type.startsWith('video') ? 'video' as const : 'image' as const,
        }));

        setImages(prev => [...prev, ...newImages]);
        // Reset the input so re-selecting the same file triggers change
        event.target.value = '';
    }, [user]);

    // Remove image handler
    const handleRemoveImage = useCallback((imageId: string) => {
        setImages(prev => prev.filter(img => img.id !== imageId));
    }, []);

    // Drag and drop handlers
    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragLeaveTimeoutRef.current) clearTimeout(dragLeaveTimeoutRef.current);
        setDragIn(true);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dragIn) setDragIn(true);
    }, [dragIn]);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragLeaveTimeoutRef.current = setTimeout(() => setDragIn(false), 100);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragLeaveTimeoutRef.current) clearTimeout(dragLeaveTimeoutRef.current);
        setDragIn(false);

        const files = e.dataTransfer?.files;
        if (!files || !user) return;

        const newImages: ImageFile[] = Array.from(files)
            .filter(file => file.type.startsWith('image') || file.type.startsWith('video'))
            .map(file => ({
                id: crypto.randomUUID(),
                file,
                src: URL.createObjectURL(file),
                title: file.name.split('.')[0],
                description: '',
                selected: false,
                type: file.type.startsWith('video') ? 'video' as const : 'image' as const,
            }));

        if (newImages.length > 0) {
            setImages(prev => [...prev, ...newImages]);
        }
    }, [user]);

    // Publish/update handler
    const handlePublish = useCallback(() => {
        if (!user) return;

        publishImage({
            user,
            generatedImage: null,
            images,
            lightboxOpen: false,
            currentImageIndex: 0,
            postTitle,
            postDescription,
            prompt: '',
            isOrgContext: false,
            orgSlug: null,
            publishAll: true,
            editingPostId: id,
            originalPictureIds: originalPictureIdsRef.current,
            settings,
            onPublish: (_url, postId) => {
                navigate(`/post/${id || postId}`);
            },
        }, setIsPublishing);
    }, [user, id, images, postTitle, postDescription, settings, navigate]);

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-muted-foreground"><T>Please sign in to create or edit posts.</T></p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(id ? `/post/${id}` : '/')}
                    className="shrink-0"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold"><T>{isEditing ? 'Edit Post' : 'New Post'}</T></h1>
            </div>

            <PostComposer
                images={images}
                setImages={setImages}
                onRemoveImage={handleRemoveImage}
                onFileUpload={handleFileUpload}
                dropZoneRef={dropZoneRef}
                isDragging={dragIn}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                postTitle={postTitle}
                setPostTitle={setPostTitle}
                postDescription={postDescription}
                setPostDescription={setPostDescription}
                onPublish={handlePublish}
                isPublishing={isPublishing}
                isEditing={isEditing}
                postId={id}
                settings={settings}
                setSettings={setSettings}
            />
        </div>
    );
};

export default EditPost;
