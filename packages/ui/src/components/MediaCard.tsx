/**
 * MediaCard - Unified component that renders the appropriate card type
 * based on the media type from the 'pictures' table
 */

import React from 'react';
import PhotoCard from './PhotoCard';
import VideoCard from '@/components/VideoCard';
import PageCard from '@/modules/pages/PageCard';
import type { CardPreset } from '@/modules/pages/PageCard';
import { normalizeMediaType, MEDIA_TYPES, type MediaType } from '@/lib/mediaRegistry';
import { getMimeCategory, CATEGORY_STYLE } from '@/modules/storage/helpers';
import type { INode } from '@/modules/storage/types';
import { MapPin } from 'lucide-react';

interface MediaCardProps {
  id: string;
  pictureId?: string; // Add pictureId explicitly
  url: string;
  thumbnailUrl?: string | null;
  title: string;
  author: string;
  authorId: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  description?: string | null;
  type: MediaType;
  meta?: any;
  responsive?: any; // Keeping as any for now to avoid tight coupling or import ResponsiveData
  onClick?: (id: string) => void;
  onLike?: () => void;
  onDelete?: () => void;
  onEdit?: (id: string) => void;
  created_at?: string;
  authorAvatarUrl?: string | null;
  showContent?: boolean;
  job?: any;
  variant?: 'grid' | 'feed';
  apiUrl?: string;
  versionCount?: number;
  preset?: CardPreset;
  showTitle?: boolean;
  showDescription?: boolean;
  showAuthor?: boolean;
  showActions?: boolean;
}

const MediaCard: React.FC<MediaCardProps> = ({
  id,
  pictureId,
  url,
  thumbnailUrl,
  title,
  author,
  authorAvatarUrl,
  authorId,
  likes,
  comments,
  isLiked,
  description,
  type,
  meta,
  onClick,
  onLike,
  onDelete,
  onEdit,
  created_at,
  showContent = true,
  responsive,
  job,
  variant = 'grid',
  apiUrl,
  versionCount,
  preset,
  showTitle,
  showDescription,
  showAuthor,
  showActions
}) => {
  const normalizedType = normalizeMediaType(type);
  // Render based on type
  if (normalizedType === 'tiktok') {
    return (
      <div className="w-full h-full bg-black flex justify-center aspect-[9/16] rounded-md overflow-hidden shadow-sm border relative">
        <iframe
          src={url}
          className="w-full h-full border-0"
          title={title}
        ></iframe>
      </div>
    );
  }

  if (normalizedType === MEDIA_TYPES.VIDEO_INTERN || normalizedType === MEDIA_TYPES.VIDEO_EXTERN) {
    return (
      <VideoCard
        videoId={pictureId || id}
        videoUrl={url}
        thumbnailUrl={thumbnailUrl || undefined}
        title={title}
        author={author}
        authorId={authorId}
        likes={likes}
        comments={comments}
        isLiked={isLiked}
        description={description}
        onClick={() => onClick?.(id)}
        onLike={onLike}
        onDelete={onDelete}
        showContent={showContent}
        created_at={created_at}
        authorAvatarUrl={authorAvatarUrl}
        job={job}
        variant={variant}
        apiUrl={apiUrl}
        preset={preset}
        showTitle={showTitle}
        showDescription={showDescription}
        showAuthor={showAuthor}
        showActions={showActions}
      />
    );
  }
  if (normalizedType === 'page-vfs-file' || normalizedType === 'page-vfs-folder') {
    // If we have a thumbnail_url mapped by the feed, that means client-posts resolved a valid cover. 
    // Let PageCard render it normally as an image.
    if (!thumbnailUrl) {
      const isFolder = normalizedType === 'page-vfs-folder';
      const mockNode: INode = { name: title, mime: isFolder ? 'inode/directory' : '', type: isFolder ? 'dir' : 'file', path: '', size: 0, parent: '' } as any;
      const category = getMimeCategory(mockNode);
      const style = CATEGORY_STYLE[category] || CATEGORY_STYLE.other;
      const Icon = style.icon;

      if (variant === 'feed') {
        return (
          <div
            onClick={() => onClick?.(id)}
            className="group relative overflow-hidden bg-card transition-all duration-300 cursor-pointer w-full mb-4 border rounded-lg hover:border-primary/50"
          >
            <div className="w-full aspect-video bg-muted/20 flex flex-col items-center justify-center gap-4">
              <Icon className="w-24 h-24" style={{ color: style.color }} />
              <span className="text-lg font-medium text-muted-foreground truncate max-w-[80%] px-4">{title}</span>
            </div>
            {showContent && (
              <div className="p-4 space-y-2 border-t">
                <div className="font-semibold text-base truncate flex items-center gap-2">
                  <Icon className="w-5 h-5 flex-shrink-0" style={{ color: style.color }} />
                  <span className="truncate" title={title}>{title}</span>
                </div>
                {description && <div className="text-sm text-muted-foreground truncate" title={description}>{description}</div>}
              </div>
            )}
          </div>
        );
      }

      return (
        <div
          onClick={() => onClick?.(id)}
          className={`group relative overflow-hidden bg-card transition-all duration-300 cursor-pointer w-full ${preset?.showTitle ? '' : 'md:aspect-square'} flex flex-col border rounded-lg hover:border-primary/50`}
        >
          <div className="flex-1 w-full aspect-square md:aspect-auto flex items-center justify-center bg-muted/20 relative">
            <Icon className="w-16 h-16 transition-transform duration-300 group-hover:scale-110" style={{ color: style.color }} />
          </div>
          {(preset?.showTitle !== false || preset?.showDescription !== false) && (
            <div className="px-3 py-2 border-t bg-muted/40 absolute bottom-0 left-0 right-0 md:relative bg-background/95 backdrop-blur-sm md:bg-muted/40 md:backdrop-blur-none transition-transform pointer-events-none">
              {preset?.showTitle !== false && title && (
                <h3 className="text-sm font-medium truncate flex items-center gap-1.5" title={title}>
                  <span className="truncate">{title}</span>
                </h3>
              )}
              {preset?.showDescription !== false && description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{description}</p>
              )}
            </div>
          )}
        </div>
      );
    }
  }

  if (normalizedType === MEDIA_TYPES.PLACE_SEARCH) {
    return (
      <div
        onClick={() => onClick?.(id)}
        className={`group relative overflow-hidden bg-card transition-all duration-300 cursor-pointer w-full ${preset?.showTitle ? '' : 'md:aspect-square'} flex flex-col border rounded-lg hover:border-primary/50`}
      >
        <div className="flex-1 w-full aspect-square md:aspect-auto flex items-center justify-center bg-muted/20 relative">
          <MapPin className="w-16 h-16 text-primary transition-transform duration-300 group-hover:scale-110" />
        </div>
        {(preset?.showTitle !== false || preset?.showDescription !== false) && (
          <div className="px-3 py-2 border-t bg-muted/40 absolute bottom-0 left-0 right-0 md:relative bg-background/95 backdrop-blur-sm md:bg-muted/40 md:backdrop-blur-none transition-transform pointer-events-none">
            {preset?.showTitle !== false && title && (
              <h3 className="text-sm font-medium truncate flex items-center gap-1.5" title={title}>
                <span className="truncate">{title}</span>
              </h3>
            )}
            {meta?.placeType && (
              <p className="text-xs text-muted-foreground/90 truncate mt-0.5">{meta.placeType}</p>
            )}
            {preset?.showDescription !== false && description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (normalizedType === MEDIA_TYPES.PAGE ||
    normalizedType === MEDIA_TYPES.PAGE_EXTERNAL ||
    normalizedType === 'page-vfs-file' ||
    normalizedType === 'page-vfs-folder') {
    return (
      <PageCard
        id={id}
        url={url} // For external pages, this is the link
        thumbnailUrl={thumbnailUrl} // Preview image
        title={title}
        author={author}
        authorId={authorId}
        authorAvatarUrl={authorAvatarUrl}
        likes={likes}
        comments={comments}
        isLiked={isLiked}
        description={description}
        type={type}
        meta={meta}
        onClick={() => onClick?.(id)}
        onLike={onLike}
        onDelete={onDelete}
        showContent={showContent}
        created_at={created_at}
        responsive={responsive}
        variant={variant}
        apiUrl={apiUrl}
        preset={preset}
        showTitle={showTitle}
        showDescription={showDescription}
        showAuthor={showAuthor}
        showActions={showActions}
      />
    );
  }

  // Default to PhotoCard for images (type === null or 'supabase-image')
  return (
    <PhotoCard
      pictureId={pictureId || id} // Use pictureId if available
      image={url}
      title={title}
      author={author}
      authorId={authorId}
      likes={likes}
      comments={comments}
      isLiked={isLiked}
      description={description}
      onClick={onClick}
      onLike={onLike}
      onDelete={onDelete}
      onEdit={onEdit}
      createdAt={created_at}
      authorAvatarUrl={authorAvatarUrl}
      showContent={showContent}
      responsive={responsive}
      variant={variant}
      apiUrl={apiUrl}
      versionCount={versionCount}
      preset={preset}
      showTitle={showTitle}
      showDescription={showDescription}
      showAuthor={showAuthor}
      showActions={showActions}
      placeTypeLabel={meta?.placeType}
    />
  );
};

export default MediaCard;
