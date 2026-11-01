export interface ImageFile {
  id: string;
  file?: File;
  src: string;
  title: string;
  selected?: boolean;
  isPreferred?: boolean; // Database selection status (star/preferred version)
  isGenerated?: boolean;
  userId?: string;
  aiText?: string; // Add AI description text
  description?: string; // User editable description/caption
  realDatabaseId?: string; // Store the real database ID when coming from MagicWizardButton
  parentForNewVersions?: string; // Store the parent ID for creating new versions (allows tree hierarchy)
  path?: string; // External link URL or generic path
  // Video specific fields
  type?: 'image' | 'video' | 'page-external';
  muxUploadId?: string;
  muxAssetId?: string;
  muxPlaybackId?: string;
  uploadStatus?: 'uploading' | 'processing' | 'ready' | 'error';
  uploadProgress?: number;
  isAddingToPost?: boolean; // UI state for adding to post
  meta?: any; // Start storing flexible metadata (like site-info for links)
}

// QuickAction is now defined in @constants.ts

export interface ImageWizardProps {
  isOpen: boolean;
  onClose: () => void;
  initialImages?: ImageFile[];
  onPublish?: (imageUrl: string, prompt: string) => void;
  originalImageId?: string;
  mode?: 'default' | 'post'; // Add mode prop
  initialPostTitle?: string;
  initialPostDescription?: string;
  initialPostSettings?: any;
  editingPostId?: string;
}

