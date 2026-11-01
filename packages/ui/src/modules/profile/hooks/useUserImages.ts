import { useState, useEffect } from "react";
import { toast } from "sonner";
import { translate } from "@/i18n";
import { fetchUserPictures, deletePicture } from "@/modules/posts/client-pictures";
import { ImageFile } from "@/types";

export function useUserImages(user: any) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [fetchingImages, setFetchingImages] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUserImages();
    }
  }, [user]);

  const fetchUserImages = async () => {
    if (!user) return;
    try {
      setFetchingImages(true);
      const pictures = await fetchUserPictures(user.id);
      const selected = pictures.filter((p: any) => p.is_selected);

      const imageFiles: ImageFile[] = selected.map((picture: any) => ({
        path: picture.id,
        title: picture.title,
        src: picture.image_url,
        isGenerated: false,
        selected: false
      }));

      setImages(imageFiles);
    } catch (error) {
      console.error('Error fetching user images:', error);
      toast.error(translate('Failed to load your images'));
    } finally {
      setFetchingImages(false);
    }
  };

  const handleImageDelete = async (imageId: string) => {
    try {
      await deletePicture(imageId);
      setImages(prevImages => prevImages.filter(img => img.path !== imageId));
      toast.success(translate('Image deleted successfully'));
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error(translate('Failed to delete image'));
    }
  };

  return {
    images,
    fetchingImages,
    currentIndex,
    setCurrentIndex,
    handleImageDelete,
    fetchUserImages
  };
}
