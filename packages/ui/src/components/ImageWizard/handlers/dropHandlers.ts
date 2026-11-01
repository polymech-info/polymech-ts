/**
 * Drag and Drop Handlers for ImageWizard
 * Handles file drag-and-drop functionality with stable state management
 */

import { toast } from "sonner";
import { translate } from "@/i18n";
import { ImageFile } from "../types";
import { uploadInternalVideo } from '@/utils/uploadUtils';

/**
 * Handle drag enter event
 * Clears any pending leave timeout and shows drag overlay for files
 */
export const handleDragEnter = (
  e: React.DragEvent<HTMLDivElement>,
  dragLeaveTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  setDragIn: (value: boolean) => void
) => {
  e.preventDefault();
  e.stopPropagation();

  // Clear any pending leave timeout
  if (dragLeaveTimeoutRef.current) {
    clearTimeout(dragLeaveTimeoutRef.current);
    dragLeaveTimeoutRef.current = null;
  }

  // Only show overlay if dragging files (not internal elements)
  if (e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
    setDragIn(true);
  }
};

/**
 * Handle drag over event
 * Keeps overlay active during drag
 */
export const handleDragOver = (
  e: React.DragEvent<HTMLDivElement>,
  dragIn: boolean,
  setDragIn: (value: boolean) => void
) => {
  e.preventDefault();
  e.stopPropagation();

  // Keep overlay active
  if (!dragIn && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
    setDragIn(true);
  }
};

/**
 * Handle drag leave event
 * Debounces the hide action to prevent flickering
 */
export const handleDragLeave = (
  e: React.DragEvent<HTMLDivElement>,
  dragLeaveTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  setDragIn: (value: boolean) => void
) => {
  e.preventDefault();
  e.stopPropagation();

  // Debounce the leave - only hide after 100ms of no drag activity
  if (dragLeaveTimeoutRef.current) {
    clearTimeout(dragLeaveTimeoutRef.current);
  }

  dragLeaveTimeoutRef.current = setTimeout(() => {
    setDragIn(false);
  }, 100);
};

/**
 * Handle drop event
 * Processes dropped image/video files and adds them to the wizard
 */
export const handleDrop = async (
  e: React.DragEvent<HTMLDivElement>,
  dragLeaveTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  setDragIn: (value: boolean) => void,
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>,
  user: any
) => {
  e.preventDefault();
  e.stopPropagation();

  // Clear timeout and hide overlay immediately
  if (dragLeaveTimeoutRef.current) {
    clearTimeout(dragLeaveTimeoutRef.current);
    dragLeaveTimeoutRef.current = null;
  }
  setDragIn(false);

  const files = Array.from(e.dataTransfer.files).filter(file =>
    file.type.startsWith('image/') || file.type.startsWith('video/')
  );

  if (files.length === 0) {
    toast.error(translate('No valid image or video files dropped'));
    return;
  }

  for (const file of files) {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage: ImageFile = {
          id: `dropped-${Date.now()}-${Math.random()}`,
          file: file,
          src: event.target?.result as string,
          title: file.name,
          selected: true, // Auto-select dropped images
          type: 'image'
        };
        setImages(prev => [...prev.map(img => ({ ...img, selected: false })), newImage]);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      // Handle Video Drop
      if (!user) {
        toast.error(translate('Please sign in to upload dropped videos'));
        continue;
      }

      const tempId = `dropped-video-${Date.now()}-${Math.random()}`;
      const newVideo: ImageFile = {
        id: tempId,
        file: file,
        src: '', // Placeholder
        title: file.name,
        selected: true,
        type: 'video',
        uploadStatus: 'uploading',
        uploadProgress: 0
      };

      setImages(prev => [...prev.map(img => ({ ...img, selected: false })), newVideo]);

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
              id: data.dbId || tempId,
              realDatabaseId: data.dbId,
              uploadStatus: 'ready',
              src: data.thumbnailUrl || '',
              // aiText: JSON.stringify(data.meta || {})
            } : img
          ));
          toast.success(translate('Video uploaded successfully'));
        });
      } catch (err) {
        console.error("Video drop upload failed", err);
        setImages(prev => prev.map(img =>
          img.id === tempId ? { ...img, uploadStatus: 'error' } : img
        ));
        toast.error(translate('Failed to upload dropped video'));
      }
    }
  }

  toast.success(translate(`${files.length} file(s) added successfully!`));
};
