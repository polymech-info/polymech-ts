import React from "react";
import { Upload, Check, Camera } from "lucide-react";
import { T, translate } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageFile } from "@/types";

interface AvatarPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploading: boolean;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  galleryImages: ImageFile[];
  onSelectFromGallery: (url: string) => void;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  open,
  onOpenChange,
  uploading,
  onUpload,
  galleryImages,
  onSelectFromGallery
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Camera className="h-4 w-4 mr-2" />
          <T>Change Avatar</T>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle><T>Choose Avatar</T></DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload New Image */}
          <div className="space-y-3">
            <h4 className="font-medium"><T>Upload New Image</T></h4>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                asChild
                disabled={uploading}
              >
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? translate('Uploading...') : translate('Choose File')}
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={onUpload}
                    className="hidden"
                  />
                </label>
              </Button>
              <span className="text-sm text-muted-foreground">
                <T>Max 5MB, JPG/PNG/WebP</T>
              </span>
            </div>
          </div>

          {/* Select from Gallery */}
          {galleryImages.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium"><T>Select from Gallery</T></h4>
              <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                {galleryImages.map((image) => (
                  <button
                    key={image.path}
                    onClick={() => onSelectFromGallery(image.src)}
                    className="relative aspect-square rounded-lg overflow-hidden bg-muted hover:ring-2 hover:ring-primary transition-all group"
                  >
                    <img
                      src={image.src}
                      alt={image.title || image.path}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
