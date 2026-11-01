import React from "react";
import { T } from "@/i18n";
import { CardContent } from "@/components/ui/card";
import ImageGallery from "@/components/ImageGallery";
import { ImageFile } from "@/types";

interface ProfileGalleryProps {
  fetching: boolean;
  images: ImageFile[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  onDelete: (id: string) => void;
  onNavigate: (path: string) => void;
}

export const ProfileGallery: React.FC<ProfileGalleryProps> = ({
  fetching,
  images,
  currentIndex,
  setCurrentIndex,
  onDelete,
  onNavigate
}) => {
  return (
    <CardContent>
      {fetching ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-muted-foreground"><T>Loading your images...</T></div>
        </div>
      ) : (
        <ImageGallery
          images={images}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          onImageDelete={onDelete}
          showSelection={false}
          onDoubleClick={(imagePath) => {
            onNavigate(`/post/${imagePath}`);
          }}
        />
      )}
    </CardContent>
  );
};
