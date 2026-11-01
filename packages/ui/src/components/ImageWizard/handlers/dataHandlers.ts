import { ImageFile } from '../types';
import { toast } from 'sonner';
import { translate } from '@/i18n';
import { Logger } from '../utils/logger';
import { fetchPictureById, fetchVersions, fetchRecentPictures } from '@/modules/posts/client-pictures';

/**
 * Data Loading & Saving Handlers
 * - Load family versions
 * - Load available images
 */

export const loadFamilyVersions = async (
  parentImages: ImageFile[],
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>,
  logger: Logger
) => {

  try {
    // Get all parent IDs and image IDs to find complete families
    const imageIds = parentImages.map(img => img.realDatabaseId || img.id).filter(id => id && id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i));

    if (imageIds.length === 0) {
      return;
    }

    // For each image, find its complete family tree via API
    const allFamilyImages = new Set<string>();
    const allVersionData: any[] = [];

    for (const imageId of imageIds) {
      // First, get the current image details to check if it has a parent
      const currentImage = await fetchPictureById(imageId);

      if (!currentImage) {
        console.error('🔧 [Wizard] Error loading current image:', imageId);
        continue;
      }

      // Load all versions in this family via API
      const familyVersions = await fetchVersions(currentImage as any);

      if (!familyVersions || !Array.isArray(familyVersions)) {
        console.error('🔧 [Wizard] Error loading family versions for:', imageId);
        continue;
      }

      // Add all family members to our set (excluding the initial image)
      familyVersions.forEach((version: any) => {
        if (version.id !== imageId) {
          allFamilyImages.add(version.id);
          allVersionData.push(version);
        }
      });
    }

    // Map to ImageFile format and update state
    if (allFamilyImages.size > 0) {
      // Deduplicate by id
      const uniqueVersions = new Map<string, any>();
      allVersionData.forEach(v => uniqueVersions.set(v.id, v));
      const versions = Array.from(uniqueVersions.values());

      const versionImages: ImageFile[] = versions.map(version => ({
        id: version.id,
        src: version.image_url,
        title: version.title,
        userId: version.user_id,
        selected: false, // Default to not selected in UI
        isPreferred: version.is_selected || false,
        isGenerated: true,
        aiText: version.description || undefined
      }));

      // Add versions to images, but also update existing images with correct selection status
      setImages(prev => {
        // Create a map of database selection status
        const dbSelectionStatus = new Map();

        // Check if this is a singleton family (only one version)
        const isSingleton = versions.length === 1;

        versions.forEach(version => {
          // If explicitly selected in DB, OR if it's the only version in the family
          const isPreferred = version.is_selected || (isSingleton && !version.parent_id);
          dbSelectionStatus.set(version.id, isPreferred);
        });

        // Update existing images and add new ones
        const existingIds = new Set(prev.map(img => img.id));
        const updatedExisting = prev.map(img => {
          if (dbSelectionStatus.has(img.id)) {
            const dbSelected = dbSelectionStatus.get(img.id);
            return { ...img, isPreferred: dbSelected };
          }
          return img;
        });

        // Add new images
        const newImages = versionImages.filter(img => !existingIds.has(img.id)).map(img => {
          if (dbSelectionStatus.has(img.id)) {
            return { ...img, isPreferred: dbSelectionStatus.get(img.id) };
          }
          return img;
        });

        const finalImages = [...updatedExisting, ...newImages];
        return finalImages;
      });
    }
  } catch (error) {
    console.error('🔧 [Wizard] Error loading family versions:', error);
    toast.error(translate('Failed to load image versions'));
  }
};

export const loadAvailableImages = async (
  setAvailableImages: React.Dispatch<React.SetStateAction<ImageFile[]>>,
  setLoadingImages: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setLoadingImages(true);
  try {
    // Load recent pictures via API
    const pictures = await fetchRecentPictures(50);

    const imageFiles: ImageFile[] = pictures.map((picture: any) => ({
      id: picture.id,
      src: picture.image_url,
      title: picture.title,
      userId: picture.user_id,
      selected: false
    }));

    setAvailableImages(imageFiles);
  } catch (error) {
    console.error('Error loading images:', error);
    toast.error(translate('Failed to load images'));
  } finally {
    setLoadingImages(false);
  }
};
