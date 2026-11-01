import { useState } from "react";
import { toast } from "sonner";
import { translate } from "@/i18n";
import { uploadImage } from '@/lib/uploadUtils';

export function useAvatar(user: any, onAvatarUpdate: (url: string) => void) {
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error(translate('Please select an image file'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(translate('Image must be less than 5MB'));
      return;
    }

    setUploadingAvatar(true);
    try {
      const { publicUrl } = await uploadImage(file, user.id);
      onAvatarUpdate(publicUrl);
      setAvatarDialogOpen(false);
      toast.success(translate('Avatar updated successfully'));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(translate('Failed to upload avatar'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSelectFromGallery = (imageUrl: string) => {
    onAvatarUpdate(imageUrl);
    setAvatarDialogOpen(false);
    toast.success(translate('Avatar updated successfully'));
  };

  return {
    avatarDialogOpen,
    setAvatarDialogOpen,
    uploadingAvatar,
    handleAvatarUpload,
    handleSelectFromGallery
  };
}
