import { Heart, Download, Share2, User, MessageCircle, Edit3, Trash2, Maximize, Layers, ExternalLink } from "lucide-react";
import type { CardPreset } from "@/modules/pages/PageCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import React, { useState, useEffect } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
const EditImageModal = React.lazy(() => import("@/components/EditImageModal"));
const ImageLightbox = React.lazy(() => import("@/components/ImageLightbox"));
import MagicWizardButton from "@/components/MagicWizardButton";
import { downloadImage, generateFilename } from "@/utils/downloadUtils";


import { useNavigate } from "react-router-dom";
import ResponsiveImage from "@/components/ResponsiveImage";
import { T, translate } from "@/i18n";
import { isLikelyFilename, formatDate } from "@/utils/textUtils";
import UserAvatarBlock from "@/components/UserAvatarBlock";
import { toggleLike, deletePicture, uploadFileToStorage, createPicture, updateStorageFile } from "@/modules/posts/client-pictures";

interface PhotoCardProps {
  pictureId: string;
  image: string;
  title: string;
  author: string;
  authorId: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  description?: string | null;
  onClick?: (pictureId: string) => void;
  onLike?: () => void;
  onDelete?: () => void;
  isVid?: boolean;
  onEdit?: (pictureId: string) => void;
  createdAt?: string;
  authorAvatarUrl?: string | null;
  showContent?: boolean;
  showHeader?: boolean;
  overlayMode?: 'hover' | 'always';
  responsive?: any;
  variant?: 'grid' | 'feed';
  apiUrl?: string;
  versionCount?: number;
  isExternal?: boolean;
  imageFit?: 'contain' | 'cover';
  className?: string; // Allow custom classes from parent
  preset?: CardPreset;
  showAuthor?: boolean;
  showActions?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  /** Place search: types[0], shown above description */
  placeTypeLabel?: string | null;
}

const PhotoCard = ({
  pictureId,
  image,
  title,
  author,
  authorId,
  likes,
  comments,
  isLiked = false,
  description,
  onClick,
  onLike,
  onDelete,
  isVid,
  onEdit,
  createdAt,
  authorAvatarUrl,
  showContent = true,
  showHeader = true,
  overlayMode = 'hover',
  responsive,
  variant = 'grid',
  apiUrl,
  versionCount,
  isExternal = false,
  imageFit = 'contain',
  className,
  preset,
  showAuthor = true,
  showActions = true,
  showTitle,
  showDescription,
  placeTypeLabel
}: PhotoCardProps) => {
  const { user } = useAuth();
  const titleVisible = (showTitle ?? preset?.showTitle) !== false;
  const descriptionVisible = (showDescription ?? preset?.showDescription) !== false;
  const navigate = useNavigate();

  const [localIsLiked, setLocalIsLiked] = useState(isLiked);
  const [localLikes, setLocalLikes] = useState(likes);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const isOwner = user?.id === authorId;

  // Fetch version count for owners only
  const [localVersionCount, setLocalVersionCount] = useState<number>(versionCount || 0);

  // Sync prop to state if needed, or just use prop. 
  // If we want to allow local updates (e.g. after adding a version), we can keep state.
  useEffect(() => {
    if (versionCount !== undefined) {
      setLocalVersionCount(versionCount);
    }
  }, [versionCount]);
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isExternal) return;

    if (!user) {
      toast.error(translate('Please sign in to like pictures'));
      return;
    }

    try {
      const nowLiked = await toggleLike(user.id, pictureId, localIsLiked);
      setLocalIsLiked(nowLiked);
      setLocalLikes(prev => nowLiked ? prev + 1 : prev - 1);

      onLike?.();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error(translate('Failed to update like'));
    }
  };
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isExternal) return;

    if (!user || !isOwner) {
      toast.error(translate('You can only delete your own images'));
      return;
    }

    if (!confirm(translate('Are you sure you want to delete this image? This action cannot be undone.'))) {
      return;
    }

    setIsDeleting(true);
    try {
      await deletePicture(pictureId);

      toast.success(translate('Image deleted successfully'));
      onDelete?.(); // Trigger refresh of the parent component
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error(translate('Failed to delete image'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async () => {
    try {
      const filename = generateFilename(title);
      await downloadImage(image, filename);
      toast.success(translate('Image downloaded successfully'));
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error(translate('Failed to download image'));
    }
  };

  const handleLightboxOpen = () => {
    setShowLightbox(true);
  };



  const handlePromptSubmit = async (prompt: string) => {
    if (!prompt.trim()) {
      toast.error(translate('Please enter a prompt'));
      return;
    }

    setIsGenerating(true);
    try {
      // Convert image URL to File for API
      const response = await fetch(image);
      const blob = await response.blob();
      const file = new File([blob], title || 'image.png', {
        type: blob.type || 'image/png'
      });

      const { editImage } = await import("@/image-api");
      const result = await editImage(prompt, [file]);

      if (result) {
        // Convert ArrayBuffer to base64 data URL  
        const uint8Array = new Uint8Array(result.imageData);
        const imageBlob = new Blob([uint8Array], { type: 'image/png' });
        const reader = new FileReader();

        reader.onload = () => {
          const dataUrl = reader.result as string;
          setGeneratedImageUrl(dataUrl);
          toast.success(translate('Image generated successfully!'));
        };

        reader.readAsDataURL(imageBlob);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error(translate('Failed to generate image. Please check your Google API key.'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async (option: 'overwrite' | 'new', imageUrl: string, newTitle: string, description?: string) => {
    if (isExternal) {
      toast.error(translate('Cannot publish external images'));
      return;
    }

    if (!user) {
      toast.error(translate('Please sign in to publish images'));
      return;
    }

    setIsPublishing(true);
    try {
      // Convert data URL to blob for upload
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      if (option === 'overwrite') {
        // Overwrite the existing image
        const currentImageUrl = image;
        if (currentImageUrl.includes('supabase.co/storage/')) {
          const urlParts = currentImageUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const bucketPath = `${authorId}/${fileName}`;

          await updateStorageFile(bucketPath, blob);

          toast.success(translate('Image updated successfully!'));
        } else {
          toast.error(translate('Cannot overwrite this image'));
          return;
        }
      } else {
        // Create new image
        const publicUrl = await uploadFileToStorage(user.id, blob);

        await createPicture({
          title: newTitle,
          description: description || translate('Generated from') + `: ${title}`,
          image_url: publicUrl,
          user_id: user.id
        } as any);

        toast.success(translate('Image published to gallery!'));
      }

      setShowLightbox(false);
      setGeneratedImageUrl(null);

      // Trigger refresh if available
      onLike?.();
    } catch (error) {
      console.error('Error publishing image:', error);
      toast.error(translate('Failed to publish image'));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(pictureId);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isVid) {
      handleLightboxOpen();
    } else {
      handleClick(e);
    }
  };
  // console.log(preset, variant);
  return (
    <div
      data-testid="photo-card"
      className={`group relative overflow-hidden transition-all duration-300 cursor-pointer w-full ${className || ''}`}
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className={`${variant === 'grid' && !className?.includes('h-full') ? "aspect-square" : ""} ${variant === 'feed' && !className?.includes('h-full') ? "aspect-[16/9]" : ""} ${className?.includes('h-full') ? 'flex-1 min-h-0' : ''} overflow-hidden`}>
        <ResponsiveImage
          src={image}
          alt={title}
          className={`w-full h-full ${imageFit === 'contain' ? 'bg-black/5' : ''}`}
          imgClassName={`w-full h-full object-${imageFit} transition-transform duration-300`} /* TESTING: group-hover:scale-105 disabled */
          sizes={variant === 'grid'
            ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            : "100vw"
          }
          responsiveSizes={variant === 'grid' ? [320, 640, 1024, 1280] : [640, 1024, 1280, 1920]} // 1920 added
          data={responsive}
          apiUrl={apiUrl}
          rootMargin={variant === 'feed' ? '160px 0px' : '200px 0px'}
        />
        {/* Helper Badge for External Images */}
        {isExternal && (
          <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            External
          </div>
        )}
      </div>


      {variant === 'grid' && (title || description || placeTypeLabel) && (
        <div className="px-2 py-1.5 border-t">
          {titleVisible && title && !isLikelyFilename(title) && (
            <h3 className="text-sm font-medium truncate">{title}</h3>
          )}
          {placeTypeLabel && (
            <p className="text-xs text-muted-foreground/90 line-clamp-1 mt-0.5">{placeTypeLabel}</p>
          )}
          {descriptionVisible && description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{description}</p>
          )}
        </div>
      )}

      {/* TESTING: Entire desktop hover overlay disabled */}
      {false && showContent && variant === 'grid' && (
        <div className={`hidden md:block absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent ${overlayMode === 'always' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-300 pointer-events-none`}>
          <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
            <div className="flex items-center justify-between mb-2">
              {showHeader && showAuthor && (
                <div className="flex items-center space-x-2">
                  <UserAvatarBlock
                    userId={authorId}
                    avatarUrl={authorAvatarUrl}
                    displayName={author}
                    hoverStyle={true}
                    showDate={false}
                  />
                </div>
              )}
              <div className="flex items-center space-x-1">
                {showActions && !isExternal && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleLike}
                      className={`h-8 w-8 p-0 ${localIsLiked ? "text-red-500" : "text-white hover:text-red-500"
                        }`}
                    >
                      <Heart className="h-4 w-4" fill={localIsLiked ? "currentColor" : "none"} />
                    </Button>
                    {localLikes > 0 && <span className="text-white text-sm">{localLikes}</span>}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-white hover:text-blue-400 ml-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <span className="text-white text-sm">{comments}</span>
                  </>
                )}

                {isOwner && !isExternal && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEdit) {
                          onEdit(pictureId);
                        } else {
                          setShowEditModal(true);
                        }
                      }}
                      className="h-8 w-8 p-0 text-white hover:text-green-400 ml-2"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="h-8 w-8 p-0 text-white hover:text-red-400 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    {localVersionCount > 1 && (
                      <div className="flex items-center ml-2 px-2 py-1 bg-white/20 rounded text-white text-xs">
                        <Layers className="h-3 w-3 mr-1" />
                        {localVersionCount}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {titleVisible && !isLikelyFilename(title) && <h3 className="text-white font-medium mb-1">{title}</h3>}
            {descriptionVisible && description && (
              <div className="text-white/80 text-sm mb-1 line-clamp-2 overflow-hidden">
                <MarkdownRenderer content={description} className="prose-invert prose-white" />
              </div>
            )}

            {createdAt && (
              <div className="text-white/60 text-xs mb-2">
                {formatDate(createdAt)}
              </div>
            )}

            {showActions && (
              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-6 px-2 text-xs bg-white/20 hover:bg-white/30 border-0 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                >
                  <Download className="h-3 w-3 mr-1" />
                  <T>Save</T>
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-6 w-6 p-0 bg-white/20 hover:bg-white/30 border-0 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLightboxOpen();
                  }}
                  title="View in lightbox"
                >
                  <Maximize className="h-2.5 w-2.5" />
                </Button>
                <Button size="sm" variant="secondary" className="h-6 w-6 p-0 bg-white/20 hover:bg-white/30 border-0 text-white">
                  <Share2 className="h-2.5 w-2.5" />
                </Button>
                {!isExternal && (
                  <MagicWizardButton
                    imageUrl={image}
                    imageTitle={title}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs bg-white/20 hover:bg-white/30 border-0 text-white"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile/Feed Content - always visible below image */}
      {showContent && (variant === 'feed' || (variant === 'grid' && true)) && (
        <div className={`${variant === 'grid' ? "md:hidden" : ""} pb-2 space-y-2`}>
          {/* Row 1: User Avatar (Left) + Actions (Right) */}
          <div className="flex items-center justify-between px-2 pt-2">
            {/* User Avatar Block */}
            {showAuthor && (
              <UserAvatarBlock
                userId={authorId}
                avatarUrl={authorAvatarUrl}
                displayName={author === 'User' ? undefined : author}
                className="w-8 h-8"
                showDate={false}
              />
            )}

            {/* Actions */}
            {showActions && (
              <div className="flex items-center gap-1">
                {!isExternal && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleLike}
                      className={localIsLiked ? "text-red-500 hover:text-red-600" : ""}
                    >
                      <Heart className="h-6 w-6" fill={localIsLiked ? "currentColor" : "none"} />
                    </Button>
                    {localLikes > 0 && (
                      <span className="text-sm font-medium text-foreground mr-1">{localLikes}</span>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-foreground"
                    >
                      <MessageCircle className="h-6 w-6 -rotate-90" />
                    </Button>
                    {comments > 0 && (
                      <span className="text-sm font-medium text-foreground mr-1">{comments}</span>
                    )}
                  </>
                )}

                <Button
                  size="icon"
                  variant="ghost"
                  className="text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                >
                  <Download className="h-6 w-6" />
                </Button>

                {!isExternal && (
                  <MagicWizardButton
                    imageUrl={image}
                    imageTitle={title}
                    size="icon"
                    variant="ghost"
                    className="text-foreground hover:text-primary"
                  />
                )}
                {isOwner && !isExternal && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onEdit) {
                        onEdit(pictureId);
                      } else {
                        setShowEditModal(true);
                      }
                    }}
                    className="text-foreground hover:text-green-400"
                  >
                    <Edit3 className="h-6 w-6" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Likes */}


          {/* Caption / Description section */}
          <div className="px-4 space-y-1">
            {titleVisible && (!isLikelyFilename(title) && title) && (
              <div className="font-semibold text-sm">{title}</div>
            )}

            {placeTypeLabel && (
              <div className="text-xs text-muted-foreground line-clamp-2">{placeTypeLabel}</div>
            )}

            {descriptionVisible && description && (
              <div className="text-sm text-foreground/90 line-clamp-3">
                <MarkdownRenderer content={description} className="prose-sm dark:prose-invert" />
              </div>
            )}

            {createdAt && (
              <div className="text-xs text-muted-foreground pt-1">
                {formatDate(createdAt)}
              </div>
            )}
          </div>
        </div>
      )}

      {showEditModal && !isExternal && (
        <EditImageModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          pictureId={pictureId}
          currentTitle={title}
          currentDescription={description}
          currentVisible={true} // Default to true until we can properly pass this
          onUpdateSuccess={() => {
            setShowEditModal(false);
            onLike?.(); // Trigger refresh
          }}
        />
      )}

      <ImageLightbox
        isOpen={showLightbox}
        onClose={() => {
          setShowLightbox(false);
          setGeneratedImageUrl(null);
        }}
        imageUrl={generatedImageUrl || image}
        imageTitle={title}
        onPromptSubmit={handlePromptSubmit}
        onPublish={handlePublish}
        isGenerating={isGenerating}
        isPublishing={isPublishing}
        showPrompt={!isExternal}
        showPublish={!!generatedImageUrl && !isExternal}
        generatedImageUrl={generatedImageUrl || undefined}
      />
    </div>
  );
};

export default PhotoCard;
