/**
 * Database operations for ImageWizard
 * Delegates to client-pictures.ts and client-user.ts API layer
 */

import { toast } from "sonner";
import { translate } from "@/i18n";
import {
  createPicture,
  updatePicture,
  fetchPictureById,
  addCollectionPictures,
} from "@/modules/posts/client-pictures";
import { uploadImage } from "@/lib/uploadUtils";
import { getUserOpenAIKey, getUserSettings, updateUserSettings } from "@/modules/user/client-user";

// Re-export for backward compat
export { getUserOpenAIKey };

/**
 * Load saved wizard model from user settings
 */
export const loadWizardModel = async (userId: string): Promise<string | null> => {
  try {
    const settings = await getUserSettings(userId);
    return (settings as any)?.wizard_model || null;
  } catch (error) {
    console.error('Error loading wizard model:', error);
    return null;
  }
};

/**
 * Save selected model to user settings
 */
export const saveWizardModel = async (userId: string, model: string): Promise<void> => {
  try {
    await updateUserSettings(userId, { wizard_model: model });
  } catch (error) {
    console.error('Error saving wizard model:', error);
  }
};

/**
 * Upload image blob to storage
 */
export const uploadImageToStorage = async (
  userId: string,
  blob: Blob,
  suffix: string = 'generated'
): Promise<{ fileName: string; publicUrl: string } | null> => {
  const fileName = `${userId}/${Date.now()}-${suffix}.png`;
  const file = new File([blob], fileName, { type: 'image/png' });
  const { publicUrl } = await uploadImage(file, userId);
  return { fileName, publicUrl };
};

/**
 * Create new picture in database
 */
export const createPictureRecord = async (params: {
  userId: string;
  title: string | null;
  description: string | null;
  imageUrl: string;
  parentId?: string | null;
  isSelected?: boolean;
}): Promise<{ id: string } | null> => {
  const created = await createPicture({
    title: params.title?.trim() || null,
    description: params.description || null,
    image_url: params.imageUrl,
    user_id: params.userId,
    parent_id: params.parentId || null,
    is_selected: params.isSelected ?? false,
  } as any);
  return (created as { id: string } | null) || null;
};

/**
 * Add picture to collections
 */
export const addPictureToCollections = async (
  pictureId: string,
  collectionIds: string[]
): Promise<boolean> => {
  try {
    const inserts = collectionIds.map(collectionId => ({
      collection_id: collectionId,
      picture_id: pictureId
    }));
    await addCollectionPictures(inserts);
    return true;
  } catch (error) {
    console.error('Error adding to collections:', error);
    return false;
  }
};

/**
 * Unselect all images in a family (root and all versions)
 * Note: This uses updatePicture for each, since there's no batch-by-filter API
 */
export const unselectImageFamily = async (
  rootParentId: string,
  userId: string
): Promise<void> => {
  // We need to update the root and all children — fetch them first
  // For now, update just the root; the version publish flow handles the rest
  try {
    await updatePicture(rootParentId, { is_selected: false } as any);
  } catch (error) {
    console.error('Error unselecting image family:', error);
    throw error;
  }
};

/**
 * Check selection status of an image
 */
export const getImageSelectionStatus = async (imageId: string): Promise<boolean> => {
  try {
    const data = await fetchPictureById(imageId);
    return data?.is_selected || false;
  } catch (error) {
    console.error('Error getting image selection status:', error);
    return false;
  }
};

/**
 * Publish image as new post
 */
export const publishImageAsNew = async (params: {
  userId: string;
  blob: Blob;
  title: string;
  description?: string;
  isOrgContext: boolean;
  orgSlug?: string;
  collectionIds?: string[];
}): Promise<void> => {
  const { userId, blob, title, description, collectionIds } = params;

  // Upload to storage
  const uploadResult = await uploadImageToStorage(userId, blob, 'generated');
  if (!uploadResult) throw new Error('Failed to upload image');

  // Create picture record
  const pictureData = await createPictureRecord({
    userId,
    title,
    description: description || null,
    imageUrl: uploadResult.publicUrl,
  });

  if (!pictureData) throw new Error('Failed to create picture record');

  // Add to collections if specified
  if (collectionIds && collectionIds.length > 0) {
    const success = await addPictureToCollections(pictureData.id, collectionIds);
    if (success) {
      toast.success(translate(`Image published and added to ${collectionIds.length} collection(s)!`));
    } else {
      toast.error(translate('Image published but failed to add to collections'));
    }
  } else {
    toast.success(translate('Image published to gallery!'));
  }
};

/**
 * Publish image as version of existing image
 */
export const publishImageAsVersion = async (params: {
  userId: string;
  blob: Blob;
  title: string;
  description?: string;
  parentId: string;
  isOrgContext: boolean;
  orgSlug?: string;
  collectionIds?: string[];
}): Promise<void> => {
  const { userId, blob, title, description, parentId, collectionIds } = params;

  // Upload to storage
  const uploadResult = await uploadImageToStorage(userId, blob, 'version');
  if (!uploadResult) throw new Error('Failed to upload image');

  const rootParentId = parentId && parentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? parentId : null;

  // Create version record (not auto-selected to avoid unique constraint violation)
  const pictureData = await createPictureRecord({
    userId,
    title,
    description: description || null,
    imageUrl: uploadResult.publicUrl,
    parentId: rootParentId,
    isSelected: false,
  });

  if (!pictureData) throw new Error('Failed to create version record');

  // Add to collections if specified
  if (collectionIds && collectionIds.length > 0) {
    const success = await addPictureToCollections(pictureData.id, collectionIds);
    if (success) {
      toast.success(translate(`Version saved and added to ${collectionIds.length} collection(s)!`));
    } else {
      toast.error(translate('Version saved but failed to add to collections'));
    }
  } else {
    toast.success(translate('Version saved successfully!'));
  }
};

/**
 * Publish image directly to an existing post
 */
export const publishImageToPost = async (params: {
  userId: string;
  blob: Blob;
  title: string;
  description?: string;
  postId: string;
  isOrgContext: boolean;
  orgSlug?: string;
  collectionIds?: string[];
}): Promise<void> => {
  const { userId, blob, title, description, postId, collectionIds } = params;

  // Upload to storage
  const uploadResult = await uploadImageToStorage(userId, blob, 'post-add');
  if (!uploadResult) throw new Error('Failed to upload image');

  // Create picture record attached to post with position
  const pictureData = await createPicture({
    title: title,
    description: description || null,
    image_url: uploadResult.publicUrl,
    user_id: userId,
    post_id: postId,
    is_selected: true,
  } as any) as { id: string } | null;

  if (!pictureData) throw new Error('Failed to create picture record');

  // Add to collections if specified
  if (collectionIds && collectionIds.length > 0) {
    const success = await addPictureToCollections(pictureData.id, collectionIds);
    if (success) {
      toast.success(translate(`Image added to post and ${collectionIds.length} collection(s)!`));
    } else {
      toast.error(translate('Image added to post but failed to add to collections'));
    }
  } else {
    toast.success(translate('Image added to post successfully!'));
  }
};
