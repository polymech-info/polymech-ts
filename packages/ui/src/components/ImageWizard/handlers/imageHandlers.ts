import { ImageFile } from '../types';
import { toast } from 'sonner';
import { translate } from '@/i18n';
import { downloadImage, generateFilename } from '@/utils/downloadUtils';
import {
  fetchPictureById,
  deletePictures,
  updatePicture,
  createPicture,
  uploadFileToStorage,
} from '@/modules/posts/client-pictures';
import { unselectImageFamily } from '../db';

/**
 * Image Handlers
 * - File upload
 * - Image selection/deselection
 * - Image removal/deletion
 * - Download
 * - Set as selected
 */

import { uploadInternalVideo } from '@/utils/uploadUtils';

// Helper to upload internal video
// Handled in uploadUtils


export const handleFileUpload = async (
  event: React.ChangeEvent<HTMLInputElement>,
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>,
  user: any
) => {
  const files = Array.from(event.target.files || []);

  for (const file of files) {
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|qt|m4v|avi|mkv)$/i.test(file.name);
    if (isVideo) {
      // Handle Video
      if (!user) {
        toast.error(translate('Please sign in to upload videos'));
        continue;
      }

      const tempId = `upload-${Date.now()}-${Math.random()}`;
      const newVideo: ImageFile = {
        id: tempId,
        file: file,
        src: '', // Placeholder or thumbnail if generated
        title: file.name,
        selected: false,
        type: 'video',
        uploadStatus: 'uploading',
        uploadProgress: 0
      };

      setImages(prev => [...prev, newVideo]);

      // Start Internal Upload Process
      try {
        await uploadInternalVideo(file, user.id, (progress) => {
          setImages(prev => prev.map(img =>
            img.id === tempId ? { ...img, uploadProgress: progress } : img
          ));
        }).then(data => {
          setImages(prev => prev.map(img =>
            img.id === tempId ? {
              ...img,
              id: data.dbId || tempId, // Update ID to DB ID if possible, but keeping tempId is safer for React keys if index based
              realDatabaseId: data.dbId,
              uploadStatus: 'ready',
              src: data.thumbnailUrl || '', // Use generated thumbnail
            } : img
          ));
          toast.success(translate('Video uploaded successfully'));
        });
      } catch (err) {
        console.error("Video upload failed", err);
        setImages(prev => prev.map(img =>
          img.id === tempId ? { ...img, uploadStatus: 'error' } : img
        ));
        toast.error(translate('Failed to upload video'));
      }

    } else {
      // Handle Image
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: ImageFile = {
          id: `upload-${Date.now()}-${Math.random()}`,
          file: file,
          src: e.target?.result as string,
          title: file.name,
          selected: false,
          type: 'image'
        };
        setImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    }
  }
};

export const toggleImageSelection = (
  imageId: string,
  isMultiSelect: boolean,
  fromGallery: boolean,
  availableImages: ImageFile[],
  images: ImageFile[],
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>
) => {
  if (fromGallery) {
    // Add from gallery to selected images
    const galleryImage = availableImages.find(img => img.id === imageId);
    if (galleryImage && !images.find(img => img.id === imageId)) {
      setImages(prev => [...prev, { ...galleryImage, selected: true }]);
    }
  } else {
    // Toggle selection in current images  
    setImages(prev => prev.map(img => {
      if (img.id === imageId) {
        return { ...img, selected: isMultiSelect ? !img.selected : true };
      }
      // For single select, deselect other images
      if (!isMultiSelect) {
        return { ...img, selected: false };
      }
      return img;
    }));
  }
};

export const removeImageRequest = (
  imageId: string,
  setImageToDelete: React.Dispatch<React.SetStateAction<string | null>>,
  setShowDeleteConfirmDialog: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setImageToDelete(imageId);
  setShowDeleteConfirmDialog(true);
};

export const confirmDeleteImage = async (
  imageToDelete: string | null,
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>,
  setImageToDelete: React.Dispatch<React.SetStateAction<string | null>>,
  setShowDeleteConfirmDialog: React.Dispatch<React.SetStateAction<boolean>>,
  initialImages: ImageFile[],
  loadFamilyVersions: (images: ImageFile[]) => Promise<void>
) => {
  if (!imageToDelete) return;

  // Remove from local state immediately for better UX
  setImages(prev => prev.filter(img => img.id !== imageToDelete));

  // Check if this image exists in the database and delete it
  try {
    const picture = await fetchPictureById(imageToDelete);

    if (picture) {
      // Delete via API (handles storage cleanup and children internally)
      await deletePictures([imageToDelete]);

      toast.success(translate('Image deleted successfully'));

      // If we deleted a root image, remove all related images from local state
      if (!picture.parent_id) {
        setImages(prev => prev.filter(img =>
          img.id !== imageToDelete &&
          img.realDatabaseId !== imageToDelete
        ));

        // Reload family versions to refresh the UI
        if (initialImages.length > 0) {
          setTimeout(() => loadFamilyVersions(initialImages), 500);
        }
      }
    }
  } catch (error) {
    console.error('Error during image deletion:', error);
    // Don't show error if it's just not found in database (local image)
  } finally {
    setImageToDelete(null);
    setShowDeleteConfirmDialog(false);
  }
};

export const setAsSelected = async (
  imageId: string,
  images: ImageFile[],
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>,
  initialImages: ImageFile[],
  loadFamilyVersions: (images: ImageFile[]) => Promise<void>
) => {
  try {
    // Check if this is a valid UUID (database image)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isSaved = uuidRegex.test(imageId);

    // Handle Unsaved Generated Images
    if (!isSaved) {
      const img = images.find(i => i.id === imageId);
      if (!img) return;

      toast.loading(translate('Saving and selecting version...'));

      try {
        // 1. Upload to Storage
        const blob = await (await fetch(img.src)).blob();
        const fileName = `${Date.now()}_generated.png`;
        const file = new File([blob], fileName, { type: 'image/png' });
        // uploadFileToStorage prepends userId internally
        const publicUrl = await uploadFileToStorage(img.userId || '', file, `${img.userId}/${fileName}`);

        // 2. Unselect previous selected in family (if parent exists)
        const parentId = img.parentForNewVersions || null;
        if (parentId) {
          await unselectImageFamily(parentId, img.userId || '');
        }

        // 3. Insert new picture as selected via API
        const newPic = await createPicture({
          user_id: img.userId,
          image_url: publicUrl,
          parent_id: parentId,
          is_selected: true,
          title: img.title,
          description: img.aiText,
        } as any);

        if (!newPic) throw new Error('Failed to create picture');

        toast.dismiss();
        toast.success(translate('Version saved and selected'));

        // 4. Update local state
        setImages(prev => {
          return prev.map(item => {
            // Replace the temp image with the saved one
            if (item.id === imageId) {
              return {
                ...item,
                id: newPic.id,
                realDatabaseId: newPic.id,
                selected: true,
                isPreferred: true
              };
            }
            return {
              ...item,
              selected: false,
              isPreferred: item.isPreferred
            };
          }).map(item => {
            // Un-prefer parent if applicable
            if (img.parentForNewVersions && (item.id === img.parentForNewVersions || item.realDatabaseId === img.parentForNewVersions)) {
              return { ...item, isPreferred: false };
            }
            return item;
          });
        });

        // Refresh family
        if (initialImages.length > 0) {
          setTimeout(() => loadFamilyVersions(initialImages), 500);
        }

        return;

      } catch (err) {
        toast.dismiss();
        console.error('Error saving generated image:', err);
        toast.error(translate('Failed to save generated image'));
        return;
      }
    }

    // Saved image — fetch from API
    const targetImage = await fetchPictureById(imageId);

    if (!targetImage) {
      toast.error(translate('Failed to find image'));
      return;
    }

    // Find all related images (same parent tree)
    const parentId = targetImage.parent_id || imageId;

    // First, unselect all images in the same family
    await unselectImageFamily(parentId, targetImage.user_id);

    // Then select the target image
    await updatePicture(imageId, { is_selected: true } as any);

    toast.success(translate('Version set as selected'));

    setImages(prev => {
      const updated = prev.map(img => {
        // If this is the image we just selected, mark it as preferred
        if (img.id === imageId) {
          return { ...img, isPreferred: true };
        }

        // Find the selected image to determine family relationships
        const selectedImg = prev.find(i => i.id === imageId);
        const selectedRootId = selectedImg?.realDatabaseId || selectedImg?.id;
        const currentRootId = img.realDatabaseId || img.id;

        // If this image is in the same family, un-prefer it
        if (selectedRootId && currentRootId && selectedRootId === currentRootId && img.id !== imageId) {
          return { ...img, isPreferred: false };
        }

        return img;
      });

      return updated;
    });

    // Refresh the images to reflect the change from database
    if (initialImages.length > 0) {
      setTimeout(() => loadFamilyVersions(initialImages), 500);
    }

  } catch (error) {
    console.error('Error setting as selected:', error);
    toast.error(translate('Failed to set as selected'));
  }
};

export const handleDownloadImage = async (image: ImageFile) => {
  try {
    const filename = generateFilename(image.title);
    await downloadImage(image.src, filename);
    toast.success(translate('Image downloaded successfully'));
  } catch (error) {
    console.error('Error downloading image:', error);
    toast.error(translate('Failed to download image'));
  }
};
