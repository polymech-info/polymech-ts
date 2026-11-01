import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Download, Trash2, Plus, Star, Wand2 } from 'lucide-react';
import { T, translate } from '@/i18n';
import { QuickAction } from '@/constants';
import { ImageFile } from '../types';
import { StylePresetSelector } from '@/components/StylePresetSelector';

interface QuickActionsToolbarProps {
  quickActions: QuickAction[];
  images: ImageFile[];
  isGenerating: boolean;
  onExecuteAction: (action: QuickAction) => void;
  onEditActions: () => void;
  // File actions
  onDownload: () => void;
  onDelete: () => void;
  onSetAsSelected: () => void;
  onEdit: () => void;
  onSettings: () => void;
  onAddToPost?: () => void;
  onSaveAsVersion: () => void;
  editingPostId?: string | null;
}

/**
 * Quick Actions Toolbar
 * 
 * Displays a unified toolbar with:
 * 1. File management actions (always visible, disabled if not applicable)
 * 2. Style presets in a separate row
 */
export const QuickActionsToolbar: React.FC<QuickActionsToolbarProps> = ({
  quickActions,
  images,
  isGenerating,
  onExecuteAction,
  onEditActions,
  onDownload,
  onDelete,
  onSetAsSelected,
  onEdit,
  onSettings,
  onAddToPost,
  onSaveAsVersion,
  editingPostId,
}) => {
  const selectedImages = images.filter(img => img.selected);
  const hasSelectedImages = selectedImages.length > 0;
  const singleImageSelected = selectedImages.length === 1;
  const selectedImage = singleImageSelected ? selectedImages[0] : null;

  // Determine capability states
  const isSavedImage = selectedImage?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedImage.id);
  const isGeneratedUnsaved = selectedImage?.isGenerated && !isSavedImage;

  // Allow setting as preferred for any single image (saved, generated, or upload)
  const canSetAsSelected = singleImageSelected;
  const canEdit = singleImageSelected;
  const canConfig = singleImageSelected && isSavedImage;
  const canSaveAsVersion = singleImageSelected && isGeneratedUnsaved;
  // Add to Post is valid if we are editing a post, single image selected, not already a real DB image (which implies it's already "in" the system, though logic might vary), and not currently adding.
  const canAddToPost = singleImageSelected && editingPostId && !selectedImage?.realDatabaseId && !selectedImage?.isAddingToPost;

  if (images.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">

      {/* Primary Toolbar: File Actions */}
      <div className="p-2 md:p-3 bg-muted/50 rounded-lg border border-border">
        <div className="flex items-center justify-between mb-2 px-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Wand2 className="h-3 w-3" />
            <T>Image Actions</T>
            {hasSelectedImages && (
              <span className="text-primary font-normal normal-case ml-2 bg-primary/10 px-2 py-0.5 rounded-full">
                {selectedImages.length} selected
              </span>
            )}
          </label>
        </div>

        <div className="flex items-center gap-2 flex-wrap pb-1">
          {/* Download */}
          <Button
            variant="outline"
            size="sm"
            disabled={!hasSelectedImages}
            onClick={onDownload}
            className="h-9 px-3"
            title={translate("Download selected")}
          >
            <Download className="h-4 w-4 mr-1.5" />
            <span className="text-xs whitespace-nowrap"><T>Download</T></span>
          </Button>

          {/* Preferred */}
          <Button
            variant="outline"
            size="sm"
            disabled={!canSetAsSelected}
            onClick={onSetAsSelected}
            className={`h-9 px-3 ${selectedImage?.isPreferred ? 'bg-yellow-100/50 border-yellow-400 text-yellow-700 dark:text-yellow-400' : ''}`}
            title={translate("Set as Preferred Version")}
          >
            <Star className={`h-3.5 w-3.5 mr-1.5 ${selectedImage?.isPreferred ? 'fill-yellow-500 text-yellow-500' : ''}`} />
            <span className="text-xs whitespace-nowrap"><T>Preferred</T></span>
          </Button>

          {/* Edit */}
          <Button
            variant="outline"
            size="sm"
            disabled={!canEdit}
            onClick={onEdit}
            className="h-9 px-3"
            title={translate("Edit in Lightbox")}
          >
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs whitespace-nowrap"><T>Edit</T></span>
          </Button>

          {/* Settings */}
          <Button
            variant="outline"
            size="sm"
            disabled={!canConfig}
            onClick={onSettings}
            className="h-9 px-3"
            title={translate("Image Settings & Metadata")}
          >
            <Wand2 className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs whitespace-nowrap"><T>Settings</T></span>
          </Button>

          {/* Add to Post - Only visible if context allows */}
          {editingPostId && (
            <Button
              variant="outline"
              size="sm"
              disabled={!canAddToPost}
              onClick={onAddToPost}
              className="h-9 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
              title={translate("Add to Post")}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              <span className="text-xs whitespace-nowrap"><T>Add to Post</T></span>
            </Button>
          )}

          {/* Save Version */}
          <Button
            variant="outline"
            size="sm"
            disabled={!canSaveAsVersion}
            onClick={onSaveAsVersion}
            className="h-9 px-3"
            title={translate("Save as Version")}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs whitespace-nowrap"><T>Save Version</T></span>
          </Button>

          {/* Delete */}
          <Button
            variant="outline"
            size="sm"
            disabled={!hasSelectedImages}
            onClick={onDelete}
            className="h-9 px-3 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
            title={translate("Delete selected")}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            <span className="text-xs whitespace-nowrap"><T>Delete</T></span>
          </Button>
        </div>
      </div>

      {/* Secondary Toolbar: Style Presets */}
      <div className="p-2 md:p-3 bg-muted/50 rounded-lg border border-border">
        <div className="flex items-center justify-between mb-2 px-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <T>Style Presets</T>
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onEditActions}
            className="h-6 px-2 text-xs"
            title="Edit quick actions"
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>

        <div className="pb-1">
          <StylePresetSelector
            presets={quickActions}
            onSelect={onExecuteAction}
            disabled={!hasSelectedImages || isGenerating}
          />
        </div>
      </div>
    </div>
  );
};

export default QuickActionsToolbar;
