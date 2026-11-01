import { ImageFile } from '../types';
import { uploadImage } from '@/lib/uploadUtils';
import { createPost, updatePostDetails } from '@/modules/posts/client-posts';
import { createPicture, updatePicture, deletePictures } from '@/modules/posts/client-pictures';
import { toast } from 'sonner';
import { translate } from '@/i18n';
import { uploadVfsFile } from '@/modules/storage/client-vfs';
import { nextIterationVfsPath } from '@/modules/storage/vfsWizardBridge';

/**
 * Publishing Handlers
 * - Publish image (Create Post with multiple images)
 * - Quick publish (Create Post with single image)
 * - Lightbox publish
 */

interface PublishImageOptions {
  user: any;
  generatedImage: string | null;
  images: ImageFile[];
  lightboxOpen: boolean;
  currentImageIndex: number;
  postTitle: string;
  postDescription?: string;
  prompt: string;
  isOrgContext: boolean;
  orgSlug: string | null;
  onPublish?: (imageUrl: string, prompt: string) => void;
  publishAll?: boolean;
  editingPostId?: string;
  originalPictureIds?: string[];
  settings?: any;
  meta?: any;
  /** Bearer token for VFS upload when saving iterations to the file browser. */
  accessToken?: string;
}

export const publishImage = async (
  options: PublishImageOptions,
  setIsPublishing: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { user, generatedImage, images, postTitle, postDescription, prompt, onPublish, publishAll, editingPostId, originalPictureIds, settings, meta } = options;

  if (!user) {
    toast.error(translate('User not authenticated'));
    return;
  }

  // Determine which images to publish
  let imagesToPublish = images;

  if (!publishAll) {
    const selectedImages = images.filter(img => img.selected);
    if (selectedImages.length > 0) {
      imagesToPublish = selectedImages;
    }
  }

  if (imagesToPublish.length === 0) {
    toast.error(translate('No images available to publish'));
    return;
  }

  setIsPublishing(true);
  try {
    let postId = editingPostId;

    // 1. Create or Update Post container
    const title = postTitle.trim() || (imagesToPublish[0].title || 'Untitled Post');
    const description = postDescription || prompt.trim() || null;

    if (editingPostId) {
      // Update existing post
      await updatePostDetails(editingPostId, {
        title: title,
        description: description,
        settings: settings,
        meta: meta
      });
    } else {
      // Create new post
      const response = await createPost({
        title,
        description,
        settings: settings,
        meta: meta,
      });
      postId = response.post.id;
    }

    if (!postId) throw new Error('No post ID available');

    // 2. Process images (Upload new, Link existing)
    let successfulOps = 0;

    for (let i = 0; i < imagesToPublish.length; i++) {
      const img = imagesToPublish[i];

      // If image already exists in DB (has realDatabaseId), just update its metadata/position
      if (img.realDatabaseId) {
        try {
          await updatePicture(img.realDatabaseId, {
            title: img.title || title,
            description: img.description || img.aiText || null,
            position: i,
            post_id: postId
          } as any);
          successfulOps++;
        } catch (err) {
          console.error(`Failed to update image ${i}:`, err);
        }
        continue;
      }

      // New Media Upload Logic
      let file: File;

      // External Page Logic (Link Post)
      if (img.type === 'page-external') {
        const siteInfo = img.meta || {};
        if (!siteInfo.url && img.path) {
          siteInfo.url = img.path;
        }

        try {
          await createPicture({
            user_id: user.id,
            post_id: postId,
            title: img.title || title,
            description: img.description || null,
            image_url: img.src,
            position: i,
            type: 'page-external',
            meta: siteInfo
          } as any);
          successfulOps++;
        } catch (err) {
          console.error("Failed to insert page-external picture:", err);
          toast.error(translate("Failed to save link"));
        }
        continue;
      }

      // Image Logic
      if (img.file) {
        file = img.file;
      } else {
        try {
          const response = await fetch(img.src);
          const blob = await response.blob();
          file = new File([blob], `image-${Date.now()}-${i}.png`, { type: blob.type || 'image/png' });
        } catch (err) {
          console.error(`Failed to process image ${i}:`, err);
          continue;
        }
      }

      // Upload to Storage
      const { publicUrl, meta: uploadedMeta } = await uploadImage(file, user.id);

      try {
        await createPicture({
          user_id: user.id,
          post_id: postId,
          title: img.title || title,
          description: img.description || img.aiText || null,
          image_url: publicUrl,
          position: i,
          type: 'supabase-image',
          meta: uploadedMeta || {}
        } as any);
        successfulOps++;
      } catch (err) {
        console.error(`Failed to link image ${i} to post:`, err);
      }
    }

    if (successfulOps === 0) {
      throw new Error('Failed to process any images');
    }

    // Delete pictures that were removed during editing
    if (editingPostId && originalPictureIds && originalPictureIds.length > 0) {
      const keptIds = new Set(imagesToPublish.map(img => img.realDatabaseId).filter(Boolean));
      const removedIds = originalPictureIds.filter(id => !keptIds.has(id));
      if (removedIds.length > 0) {
        try {
          await deletePictures(removedIds);
        } catch (err) {
          console.error('Failed to delete removed pictures:', err);
        }
      }
    }

    toast.success(translate(editingPostId ? 'Post updated successfully!' : 'Post published successfully!'));

    if (imagesToPublish.length > 0) {
      onPublish?.(imagesToPublish[0].src, postId);
    }

  } catch (error) {
    console.error('Error publishing/updating post:', error);
    toast.error(translate('Failed to save post'));
  } finally {
    setIsPublishing(false);
  }
};

export const quickPublishAsNew = async (
  options: PublishImageOptions,
  setIsPublishing: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { user, generatedImage, images, lightboxOpen, currentImageIndex, postTitle, prompt, onPublish } = options;

  if (!user) {
    toast.error(translate('User not authenticated'));
    return;
  }

  if (!prompt.trim()) {
    toast.error(translate('Please enter a prompt to use as description'));
    return;
  }

  // Determine which SINGLE image to publish for Quick Publish
  let imageToPublish = null;
  let imageFile = null;
  let imageTitle = postTitle.trim() || '';

  // Priority 1: Generated image
  if (generatedImage) {
    imageToPublish = generatedImage;
    imageTitle = imageTitle || prompt.substring(0, 50);
  }
  // Priority 2: Currently displayed image in lightbox
  else if (lightboxOpen && images.length > 0 && currentImageIndex < images.length) {
    const currentImage = images[currentImageIndex];
    imageToPublish = currentImage.src;
    imageFile = currentImage.file;
    imageTitle = imageTitle || currentImage.title || '';
  }
  // Priority 3: First uploaded image
  else if (images.length > 0) {
    const firstImage = images[0];
    imageToPublish = firstImage.src;
    imageFile = firstImage.file;
    imageTitle = imageTitle || firstImage.title || '';
  }

  if (!imageToPublish) {
    toast.error(translate('No image available to publish'));
    return;
  }

  setIsPublishing(true);
  try {
    // 1. Create Post
    const response = await createPost({
      title: imageTitle || 'Quick Publish',
      description: prompt.trim(),
    });
    const postId = response.post.id;

    let file;

    // If you have the file, use it
    if (imageFile) {
      file = imageFile;
    } else {
      // Convert data URL to blob
      const response = await fetch(imageToPublish);
      const blob = await response.blob();
      file = new File([blob], `quick-publish-${Date.now()}.png`, { type: 'image/png' });
    }

    // Upload to Storage
    const { publicUrl, meta: uploadedMeta } = await uploadImage(file, user.id);

    // Insert into pictures linked to Post
    await createPicture({
      user_id: user.id,
      post_id: postId,
      title: imageTitle || 'Quick Publish',
      description: prompt.trim(),
      image_url: publicUrl,
      position: 0,
      type: 'supabase-image',
      meta: uploadedMeta || {}
    } as any);

    toast.success(translate('Image quick published as new post!'));
    onPublish?.(publicUrl, prompt);
  } catch (error) {
    console.error('Error quick publishing image:', error);
    toast.error(translate('Failed to quick publish image'));
  } finally {
    setIsPublishing(false);
  }
};

function getVfsProvenance(images: ImageFile[]): { mount: string; path: string } | null {
  for (const img of images) {
    const vfs = img.meta?.vfs as { mount?: string; path?: string } | undefined;
    if (vfs && typeof vfs.mount === 'string' && typeof vfs.path === 'string') {
      return { mount: vfs.mount, path: vfs.path };
    }
  }
  return null;
}

/** Same image resolution as quick publish; writes a new file next to the VFS source (see `meta.vfs`). */
export const saveWizardImageAsVfsFile = async (
  options: PublishImageOptions,
  setIsPublishing: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  const { user, generatedImage, images, lightboxOpen, currentImageIndex, accessToken } = options;

  if (!user) {
    toast.error(translate('User not authenticated'));
    return;
  }

  const vfs = getVfsProvenance(images);
  if (!vfs) {
    toast.error(translate('No file browser context'));
    return;
  }

  let imageToPublish: string | null = null;
  let imageFile: File | undefined;

  if (generatedImage) {
    imageToPublish = generatedImage;
  } else if (lightboxOpen && images.length > 0 && currentImageIndex < images.length) {
    const currentImage = images[currentImageIndex];
    imageToPublish = currentImage.src;
    imageFile = currentImage.file;
  } else if (images.length > 0) {
    const firstImage = images[0];
    imageToPublish = firstImage.src;
    imageFile = firstImage.file;
  }

  if (!imageToPublish) {
    toast.error(translate('No image available to save'));
    return;
  }

  setIsPublishing(true);
  try {
    let file: File;
    if (imageFile) {
      file = imageFile;
    } else {
      const res = await fetch(imageToPublish);
      const blob = await res.blob();
      file = new File([blob], `wizard-${Date.now()}.png`, { type: blob.type || 'image/png' });
    }

    const targetPath = nextIterationVfsPath(vfs.path);
    await uploadVfsFile(vfs.mount, targetPath, file, { accessToken });

    toast.success(translate('Saved to file browser'));
  } catch (error) {
    console.error('Error saving image to VFS:', error);
    toast.error(translate('Failed to save file'));
  } finally {
    setIsPublishing(false);
  }
};

export const publishToGallery = async (
  options: PublishImageOptions,
  setIsPublishing: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { user, images, onPublish } = options;

  if (!user) {
    toast.error(translate('User not authenticated'));
    return;
  }

  const selectedImages = images.filter(img => img.selected);
  const imagesToPublish = selectedImages.length > 0 ? selectedImages : images;

  if (imagesToPublish.length === 0) {
    toast.error(translate('No images available to publish'));
    return;
  }

  setIsPublishing(true);
  try {
    let successfulOps = 0;

    for (let i = 0; i < imagesToPublish.length; i++) {
      const img = imagesToPublish[i];

      // Skip existing database images that are already saved
      if (img.realDatabaseId) {
        successfulOps++;
        continue;
      }

      // New Media Upload Logic
      let file: File;

      // External Page Logic
      if (img.type === 'page-external') {
        const siteInfo = img.meta || {};
        if (!siteInfo.url && img.path) {
          siteInfo.url = img.path;
        }

        try {
          await createPicture({
            user_id: user.id,
            post_id: null,
            title: img.title || 'Untitled Link',
            description: img.description || null,
            image_url: img.src,
            position: 0,
            type: 'page-external',
            meta: siteInfo
          } as any);
          successfulOps++;
        } catch (err) {
          console.error("Failed to save page-external picture:", err);
        }
        continue;
      }

      // Image Logic
      if (img.file) {
        file = img.file;
      } else {
        try {
          const response = await fetch(img.src);
          const blob = await response.blob();
          file = new File([blob], `image-${Date.now()}-${i}.png`, { type: blob.type || 'image/png' });
        } catch (err) {
          console.error(`Failed to process image ${i}:`, err);
          continue;
        }
      }

      // Upload to Storage
      const { publicUrl, meta: uploadedMeta } = await uploadImage(file, user.id);

      try {
        await createPicture({
          user_id: user.id,
          post_id: null,
          title: img.title || 'Untitled Image',
          description: img.description || img.aiText || null,
          image_url: publicUrl,
          position: 0,
          type: 'supabase-image',
          meta: uploadedMeta || {}
        } as any);
        successfulOps++;
      } catch (err) {
        console.error(`Failed to save image ${i}:`, err);
      }
    }

    if (successfulOps === 0) {
      throw new Error('Failed to process any images');
    }

    toast.success(translate('Saved to gallery successfully!'));

    // Just call onPublish with first image to signal completion
    if (imagesToPublish.length > 0) {
      onPublish?.(imagesToPublish[0].src, '');
    }

  } catch (error) {
    console.error('Error publishing to gallery:', error);
    toast.error(translate('Failed to save to gallery'));
  } finally {
    setIsPublishing(false);
  }
};
