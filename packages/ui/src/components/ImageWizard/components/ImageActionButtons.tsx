import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Plus, Edit, X } from 'lucide-react';
import { ImageFile } from '../types';

interface ImageActionButtonsProps {
  image: ImageFile;
  index: number;
  images: ImageFile[];
  onDownload: (image: ImageFile) => void;
  onSetAsSelected: (imageId: string) => void;
  onSaveAsVersion: (image: ImageFile, index: number) => void;
  onEdit: (index: number) => void;
  onRemove: (imageId: string) => void;
  onAddToPost?: () => void;
  editingPostId?: string | null;
}

/**
 * Image Action Buttons
 * 
 * Displays action buttons below each image in the wizard:
 * - Download: Download image to device
 * - Set as Selected: Mark this version as the selected one (for saved images)
 * - Save as Version: Save as a new version (for generated images)
 * - Edit: Open in lightbox for editing
 * - Remove: Remove from wizard
 * - Add to Post: Add to the current post (if in post editing context)
 */
export const ImageActionButtons: React.FC<ImageActionButtonsProps> = ({
  image,
  index,
  images,
  onDownload,
  onSetAsSelected,
  onSaveAsVersion,
  onEdit,
  onRemove,
  onAddToPost,
  editingPostId,
}) => {
  const isSavedImage = image.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(image.id);
  const isGeneratedUnsaved = image.isGenerated && !isSavedImage;

  return (
    <div className="mt-2 flex gap-1 justify-center flex-wrap">
      {/* Download Button */}
      <Button
        variant="outline"
        size="sm"
        className="h-7 w-7 p-0 touch-manipulation flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onDownload(image);
        }}
        title="Download"
      >
        <Download className="h-3.5 w-3.5" />
      </Button>

      {/* Set as Selected Button */}
      {(isSavedImage || isGeneratedUnsaved) && (
        <Button
          variant="outline"
          size="sm"
          className={`h-7 w-7 p-0 touch-manipulation flex-shrink-0 ${image.selected ? 'bg-yellow-100 border-yellow-400 text-yellow-700' : ''
            }`}
          onClick={(e) => {
            e.stopPropagation();
            onSetAsSelected(image.id);
          }}
          title="Set as Selected Version"
        >
          <span className={image.selected ? 'text-yellow-500 text-xs' : 'text-gray-400 text-xs'}>⭐</span>
        </Button>
      )}

      {/* Add to Post Button */}
      {editingPostId && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0 touch-manipulation flex-shrink-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 disabled:opacity-50"
          onClick={(e) => {
            e.stopPropagation();
            onAddToPost?.();
          }}
          disabled={!!image.realDatabaseId || image.isAddingToPost}
          title={image.realDatabaseId ? "Already in database" : "Add to Current Post"}
        >
          {image.isAddingToPost ? (
            <div className="h-3.5 w-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      )}

      {/* Save as Version Button */}
      {isGeneratedUnsaved && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0 touch-manipulation flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onSaveAsVersion(image, index);
          }}
          title="Save as Version"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      )}

      {/* Edit Button */}
      <Button
        variant="outline"
        size="sm"
        className="h-7 w-7 p-0 touch-manipulation flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(index);
        }}
        title="Edit"
      >
        <Edit className="h-3.5 w-3.5" />
      </Button>

      {/* Remove Button */}
      <Button
        variant="destructive"
        size="sm"
        className="h-7 w-7 p-0 touch-manipulation flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(image.id);
        }}
        title="Remove"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

export default ImageActionButtons;
