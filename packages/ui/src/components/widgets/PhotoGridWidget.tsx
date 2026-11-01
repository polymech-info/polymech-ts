import React, { useState, useEffect } from 'react';
import PhotoGrid, { MediaItemType } from '@/components/PhotoGrid';
import { ImagePickerDialog } from '@/components/widgets/ImagePickerDialog';
import { T } from '@/i18n';
import { ImageIcon, Plus, Grid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface PhotoGridWidgetProps {
    isEditMode?: boolean;
    pictureIds?: string[];
    // Widget instance management
    widgetInstanceId?: string;
    id?: string; // Widget Instance ID passed by registry/layout
    onPropsChange?: (props: Record<string, any>) => void;
    columns?: number | 'auto';
}

const PhotoGridWidget: React.FC<PhotoGridWidgetProps> = ({ isEditMode = false, pictureIds: propPictureIds = [], id, onPropsChange, columns = 'auto' }) => {
    const { user } = useAuth();
    const [pictureIds, setPictureIds] = useState<string[]>(propPictureIds || []);
    const [mediaItems, setMediaItems] = useState<MediaItemType[]>([]);
    const [loading, setLoading] = useState(false);
    const [internalEditMode, setInternalEditMode] = useState(false);
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    // Use widget ID or generate a stable ID based on content if not provided
    const navigationSourceId = id || `widget-${pictureIds.slice(0, 5).join('-')}`;

    // Use passed isEditMode or internal state (though typically widget container drives this)
    const effectiveEditMode = isEditMode || internalEditMode;

    // Sync local state with props
    useEffect(() => {
        // Deep compare or simple length check to avoid loops? 
        // Array simple comparison is safest for now
        if (JSON.stringify(propPictureIds) !== JSON.stringify(pictureIds)) {
            setPictureIds(propPictureIds || []);
        }
    }, [propPictureIds]);

    // Fetch pictures data when pictureIds changes
    useEffect(() => {
        if (pictureIds && pictureIds.length > 0) {
            fetchMediaItems();
        } else {
            setMediaItems([]);
        }
    }, [pictureIds]);

    const fetchMediaItems = async () => {
        if (!pictureIds || pictureIds.length === 0) return;

        setLoading(true);
        try {
            const { fetchMediaItemsByIds } = await import('@/lib/db');
            const items = await fetchMediaItemsByIds(pictureIds, { maintainOrder: true });

            // Transform to format expected by PhotoGrid (add comments count)
            const gridItems = items.map(item => ({
                ...item,
                comments: [{ count: 0 }] // Mock comments count
            }));

            setMediaItems(gridItems as any[]);
        } catch (error) {
            console.error('Error fetching grid media:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPictures = (selectedIds: string[]) => {
        setPictureIds(selectedIds);
        // Persist the change
        if (onPropsChange) {
            onPropsChange({ pictureIds: selectedIds });
        }
        setIsPickerOpen(false);
    };

    const handleOpenPicker = () => {
        if (effectiveEditMode) {
            setIsPickerOpen(true);
        }
    };

    if (!pictureIds || pictureIds.length === 0) {
        return (
            <>
                <div
                    className={`bg-card border rounded-lg p-8 text-center min-h-[200px] flex flex-col items-center justify-center ${effectiveEditMode ? 'cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors' : ''
                        }`}
                    onClick={handleOpenPicker}
                >
                    <Grid className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground mb-3">
                        {effectiveEditMode ? (
                            <T>No pictures selected</T>
                        ) : (
                            <T>No pictures to display</T>
                        )}
                    </p>
                    {effectiveEditMode && (
                        <Button variant="outline" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPicker();
                        }}>
                            <Plus className="h-4 w-4 mr-2" />
                            <T>Select Pictures</T>
                        </Button>
                    )}
                </div>

                {effectiveEditMode && (
                    <ImagePickerDialog
                        isOpen={isPickerOpen}
                        onClose={() => setIsPickerOpen(false)}
                        onMultiSelect={handleSelectPictures}
                        currentValues={pictureIds}
                        multiple={true}
                    />
                )}
            </>
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            {effectiveEditMode && (
                <div className="flex justify-end mb-2">
                    <Button variant="outline" size="sm" onClick={handleOpenPicker}>
                        <Grid className="h-3 w-3 mr-2" />
                        <T>Edit Selection</T>
                        <span className="ml-2 text-xs bg-muted px-1.5 rounded-full">{pictureIds.length}</span>
                    </Button>
                </div>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-[200px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <PhotoGrid
                        customPictures={mediaItems}
                        customLoading={loading}
                        showVideos={true} // Allow videos in grid if selected
                        navigationSource="widget"
                        navigationSourceId={navigationSourceId}
                        columns={columns}
                    />
                )}
            </div>

            {effectiveEditMode && (
                <ImagePickerDialog
                    isOpen={isPickerOpen}
                    onClose={() => setIsPickerOpen(false)}
                    onMultiSelect={handleSelectPictures}
                    currentValues={pictureIds}
                    multiple={true}
                />
            )}
        </div>
    );
};

export default PhotoGridWidget;
