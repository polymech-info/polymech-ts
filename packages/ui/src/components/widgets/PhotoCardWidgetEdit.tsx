import React, { useState, useCallback } from 'react';
import { createPicture } from '@/modules/posts/client-pictures';
import PhotoCard from '@/components/PhotoCard';
import { ImagePickerDialog } from '@/components/widgets/ImagePickerDialog';
import { T, translate } from '@/i18n';
import { ImageIcon, Plus, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { uploadImage } from '@/lib/uploadUtils';
import { toast } from 'sonner';
import { useDragDrop } from '@/contexts/DragDropContext';
import { usePhotoCardData } from './PhotoCardWidgetView';
import type { PhotoCardWidgetProps } from './PhotoCardWidgetView';

/** Edit-mode component — lazy loaded, includes all editing deps */
const PhotoCardWidgetEdit: React.FC<PhotoCardWidgetProps> = (props) => {
    const {
        pictureId: propPictureId = null,
        postId: propPostId = null,
        showHeader = true,
        showFooter = true,
        showAuthor = true,
        showActions = true,
        showTitle = true,
        showDescription = true,
        contentDisplay = 'below',
        imageFit = 'cover',
        onPropsChange
    } = props;

    const { user } = useAuth();
    const { setLocalZoneActive, resetDragState } = useDragDrop();
    const state = usePhotoCardData(propPictureId, propPostId);
    const {
        pictureId, setPictureId,
        picture,
        userProfile,
        commentsCount,
        isLiked,
        loading,
        postId, setPostId,
        postData, setPostData,
        fetchPostData,
        fetchPictureDataFallback
    } = state;

    const [pickerOpen, setPickerOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleLike = async () => {
        if (postId) { await fetchPostData(); } else { await fetchPictureDataFallback(); }
    };

    const handleSelectPicture = (selectedPictureId: string) => {
        setPictureId(selectedPictureId);
        setPostId(null);
        setPostData(null);
        onPropsChange?.({ pictureId: selectedPictureId, postId: null });
        setPickerOpen(false);
    };

    const handleSelectResult = (result: { pictureId: string; postId?: string }) => {
        setPictureId(result.pictureId);
        setPostId(result.postId || null);
        onPropsChange?.({ pictureId: result.pictureId, postId: result.postId || null });
        setPickerOpen(false);
    };

    const handleOpenPicker = () => setPickerOpen(true);

    // --- Drag and Drop ---
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.types.includes('Files')) {
            setIsDragging(true);
            setLocalZoneActive(true);
        }
    }, [setLocalZoneActive]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragging(false);
        setLocalZoneActive(false);
    }, [setLocalZoneActive]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        resetDragState();

        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) {
            if (files.length > 0) toast.error(translate('Please drop an image file'));
            return;
        }
        await processDroppedImage(imageFiles[0]);
    }, []);

    const processDroppedImage = async (file: File) => {
        setIsUploading(true);
        try {
            if (!user) { toast.error(translate('You must be logged in to upload images')); return; }
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
                handleSelectPicture(pictureData.id);
                toast.success(translate('Image uploaded successfully'));
            }
        } catch (error) {
            console.error('Error uploading dropped image:', error);
            toast.error(translate('Failed to upload image'));
        } finally {
            setIsUploading(false);
        }
    };

    // --- Render ---
    const renderContent = () => {
        if (loading) {
            return (
                <div className="bg-card border rounded-lg p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground"><T>Loading picture...</T></p>
                </div>
            );
        }

        if (!pictureId || !picture) {
            return (
                <div
                    className="bg-card border rounded-lg p-8 text-center min-h-[300px] flex flex-col items-center justify-center relative cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors"
                    onClick={handleOpenPicker}
                >
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground mb-3"><T>No picture selected</T></p>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenPicker(); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        <T>Select Picture</T>
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4"><T>or drag and drop an image here</T></p>
                </div>
            );
        }

        const authorName = userProfile?.display_name || userProfile?.username || `User ${picture.user_id.slice(0, 8)}`;
        const isExternal = picture.user_id === 'external';
        const displayTitle = postData?.title ?? picture.title;
        const displayDescription = postData?.description ?? picture.description;

        return (
            <div className="w-full relative">
                <PhotoCard
                    pictureId={picture.id}
                    image={picture.image_url}
                    title={displayTitle}
                    author={authorName}
                    authorId={picture.user_id}
                    likes={picture.likes_count}
                    comments={commentsCount}
                    isLiked={isLiked}
                    description={displayDescription}
                    onClick={() => {
                        if (isExternal) window.open(picture.image_url, '_blank');
                        else window.location.href = `/post/${postData?.id || pictureId}`;
                    }}
                    onLike={handleLike}
                    variant={contentDisplay === 'overlay' || contentDisplay === 'overlay-always' ? 'grid' : 'feed'}
                    overlayMode={contentDisplay === 'overlay-always' ? 'always' : 'hover'}
                    showHeader={showHeader}
                    showContent={showFooter}
                    showAuthor={showAuthor}
                    showActions={showActions}
                    showTitle={showTitle}
                    showDescription={showDescription}
                    isExternal={isExternal}
                    imageFit={imageFit}
                />

                {/* Edit overlay button */}
                {!isDragging && (
                    <div
                        className="absolute top-2 right-2 p-2 bg-black/50 rounded-full cursor-pointer hover:bg-black/70 transition-colors z-10"
                        onClick={(e) => { e.stopPropagation(); handleOpenPicker(); }}
                        title={translate("Change Picture")}
                    >
                        <ImageIcon className="w-4 h-4 text-white" />
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <div
                className={`w-full relative transition-all duration-200 ${isDragging ? 'ring-4 ring-primary ring-inset rounded-lg scale-[0.99]' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {renderContent()}

                {isDragging && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-50 border-2 border-dashed border-primary pointer-events-none">
                        <div className="bg-primary/10 p-6 rounded-full mb-4">
                            <Upload className="h-10 w-10 text-primary animate-bounce" />
                        </div>
                        <p className="text-lg font-semibold text-primary"><T>Drop image to upload</T></p>
                    </div>
                )}

                {isUploading && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-50">
                        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                        <p className="text-lg font-semibold text-foreground"><T>Uploading image...</T></p>
                    </div>
                )}
            </div>

            <ImagePickerDialog
                isOpen={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={handleSelectPicture}
                onSelectResult={handleSelectResult}
                currentValue={pictureId}
            />
        </>
    );
};

export default PhotoCardWidgetEdit;
