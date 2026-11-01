import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageIcon, Upload, Loader2, Users, Trash2 } from "lucide-react";
import { T, translate } from "@/i18n";
import { ImageFile } from "../types";
import { QuickAction } from "@/constants";
import { QuickActionsToolbar } from "./QuickActionsToolbar";

interface ImageGalleryPanelProps {
  // Selected images
  images: ImageFile[];
  onImageClick: (imageId: string, isMultiSelect: boolean) => void;
  onImageDoubleClick: (index: number) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteSelected: () => void;
  onDownload: (image: ImageFile) => void;
  onSetAsSelected: (imageId: string) => void;
  onSaveAsVersion: (image: ImageFile, index: number) => void;
  onEdit: (index: number) => void;
  onRemove: (imageId: string) => void;

  // Gallery
  availableImages: ImageFile[];
  loadingImages: boolean;
  onGalleryImageSelect: (imageId: string, isMultiSelect: boolean) => void;

  // Quick actions
  quickActions: QuickAction[];
  onExecuteAction: (action: QuickAction) => void;
  onEditActions: () => void;
  isGenerating: boolean;

  // Drag & drop
  dragIn: boolean;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  dropZoneRef: React.RefObject<HTMLDivElement>;

  // Add to Post
  onAddToPost?: (image: ImageFile) => void;
  editingPostId?: string | null;
  onSettings: (index: number) => void;
}

export const ImageGalleryPanel: React.FC<ImageGalleryPanelProps> = ({
  images,
  onImageClick,
  onImageDoubleClick,
  onFileUpload,
  onDeleteSelected,
  onDownload,
  onSetAsSelected,
  onSaveAsVersion,
  onEdit,
  onRemove,
  availableImages,
  loadingImages,
  onGalleryImageSelect,
  quickActions,
  onExecuteAction,
  onEditActions,
  isGenerating,
  dragIn,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  dropZoneRef,
  onAddToPost,
  editingPostId,
  onSettings,
}) => {

  // Handlers for unified toolbar
  const handleDownloadSelected = () => {
    const selectedImages = images.filter(img => img.selected);
    selectedImages.forEach(img => onDownload(img));
  };

  const handleSetAsSelected = () => {
    const selectedImage = images.find(img => img.selected);
    if (selectedImage) {
      onSetAsSelected(selectedImage.id);
    }
  };

  const handleEditSelected = () => {
    const index = images.findIndex(img => img.selected);
    if (index !== -1) {
      onEdit(index);
    }
  };

  const handleSettingsSelected = () => {
    const index = images.findIndex(img => img.selected);
    if (index !== -1) {
      onSettings(index);
    }
  };

  const handleAddToPostSelected = () => {
    const selectedImage = images.find(img => img.selected);
    if (selectedImage && onAddToPost) {
      onAddToPost(selectedImage);
    }
  };

  const handleSaveAsVersionSelected = () => {
    const index = images.findIndex(img => img.selected);
    const selectedImage = images[index];
    if (selectedImage) {
      onSaveAsVersion(selectedImage, index);
    }
  };

  return (
    <div
      ref={dropZoneRef}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="lg:col-span-2"
    >
      <Tabs defaultValue="selected" className="h-full">
        <TabsList className="grid w-full grid-cols-2 h-11 md:h-10">
          <TabsTrigger value="selected" className="text-sm md:text-base">
            <T>Selected Images</T> ({images.filter(img => img.selected).length})
          </TabsTrigger>
          <TabsTrigger value="gallery" className="text-sm md:text-base">
            <Users className="h-4 w-4 mr-1 md:mr-2" />
            <T>Gallery</T>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="selected" className="space-y-3 md:space-y-4">
          <Card className={`transition-all ${dragIn ? 'ring-4 ring-primary ring-offset-2 bg-primary/5' : ''
            }`}>
            <CardContent className="p-3 md:p-6">
              {/* File Upload & Bulk Actions */}
              <div className="mb-3 md:mb-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" asChild className="h-11 md:h-10 text-base md:text-sm flex-1">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-5 w-5 md:h-4 md:w-4 mr-2" />
                      <span className="hidden sm:inline"><T>Choose Files or Drop Here</T></span>
                      <span className="sm:hidden"><T>Choose or Drop Files</T></span>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={onFileUpload}
                        className="hidden"
                      />
                    </label>
                  </Button>
                </div>
              </div>

              {/* Quick Actions Toolbar */}
              <QuickActionsToolbar
                quickActions={quickActions}
                images={images}
                isGenerating={isGenerating}
                onExecuteAction={onExecuteAction}
                onEditActions={onEditActions}
                onDownload={handleDownloadSelected}
                onDelete={onDeleteSelected}
                onSetAsSelected={handleSetAsSelected}
                onEdit={handleEditSelected}
                onSettings={handleSettingsSelected}
                onAddToPost={handleAddToPostSelected}
                onSaveAsVersion={handleSaveAsVersionSelected}
                editingPostId={editingPostId}
              />

              {/* Selected Images Grid */}
              {images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {images.map((image, index) => (
                    <div key={image.id} className="relative group">
                      <Card className={`overflow-hidden cursor-pointer transition-all ${image.selected ? 'ring-2 ring-primary' : ''
                        }`}>
                        <CardContent className="p-0">
                          <div className="aspect-square relative">
                            <img
                              src={image.src}
                              alt={image.title}
                              className="w-full h-full object-contain bg-muted cursor-pointer"
                              onClick={(e) => onImageClick(image.id, e.ctrlKey || e.metaKey)}
                              onDoubleClick={() => onImageDoubleClick(index)}
                            />
                            {/* Loading spinner overlay */}
                            {(image.title.includes('Generating') || image.title.includes('Agent working') || image.title.includes('Voice Agent working')) ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                <div className="flex flex-col items-center gap-2">
                                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                                  <span className="text-xs font-medium text-white/80">{image.title}</span>
                                </div>
                              </div>
                            ) : null}

                            {/* Selection Checkmark Overlay */}
                            {image.selected && (
                              <div className="absolute top-2 right-2 h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg transform scale-100 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            {/* Hide title + badge for loading placeholders — spinner overlay is enough */}
                            {!(image.title.includes('Generating') || image.title.includes('Agent working') || image.title.includes('Voice Agent working')) && (
                              <>
                                <p className="text-xs font-medium line-clamp-2 break-words text-center">{image.title}</p>
                                {image.isGenerated && (
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    Generated
                                  </Badge>
                                )}
                                {image.aiText && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    "{image.aiText}"
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p><T>No images selected</T></p>
                  <p className="text-sm"><T>Upload images or select from gallery</T></p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-3 md:space-y-4">
          <Card>
            <CardContent className="p-3 md:p-6">
              <ScrollArea className="h-64 md:h-96">
                {loadingImages ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    {availableImages.map(image => (
                      <Card
                        key={image.id}
                        className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all touch-manipulation"
                        onClick={(e) => onGalleryImageSelect(image.id, e.ctrlKey || e.metaKey)}
                      >
                        <CardContent className="p-0">
                          <div className="aspect-square">
                            <img
                              src={image.src}
                              alt={image.title}
                              className="w-full h-full object-contain bg-muted"
                            />
                          </div>
                          <div className="p-2">
                            <p className="text-xs truncate font-medium">{image.title}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImageGalleryPanel;




