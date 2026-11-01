import React, { useState, useEffect } from 'react';
import { T } from '@/i18n';
import { Grid3X3 } from 'lucide-react';
import { useLayout } from '@/modules/layout/LayoutContext';
import { LayoutContainer } from './LayoutContainer';
import FlexibleContainerRenderer from './FlexibleContainerRenderer';
import { WidgetPalette } from './WidgetPalette';

import { uploadAndCreatePicture } from '@/lib/uploadUtils';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { translate } from '@/i18n';

export interface GenericCanvasEditProps {
    pageId: string;
    pageName: string;
    isEditMode?: boolean;
    showControls?: boolean;
    className?: string;
    selectedWidgetId?: string | null;
    selectedWidgetIds?: Set<string>;
    onSelectWidget?: (widgetId: string, pageId?: string) => void;
    selectedContainerId?: string | null;
    onSelectContainer?: (containerId: string | null, pageId?: string) => void;
    initialLayout?: any;
    editingWidgetId?: string | null;
    onEditWidget?: (widgetId: string | null) => void;
    newlyAddedWidgetId?: string | null;
    contextVariables?: Record<string, any>;
    pageContext?: Record<string, any>;
    onSave?: () => Promise<void | boolean>;
    selectionBreadcrumb?: React.ReactNode;
}

const GenericCanvasEdit: React.FC<GenericCanvasEditProps> = ({
    pageId,
    pageName,
    isEditMode = false,
    showControls = true,
    className = '',
    selectedWidgetId,
    selectedWidgetIds,
    onSelectWidget,
    selectedContainerId: propSelectedContainerId,
    onSelectContainer: propOnSelectContainer,
    initialLayout,
    editingWidgetId,
    onEditWidget,
    newlyAddedWidgetId,
    contextVariables,
    pageContext,
    onSave,
    selectionBreadcrumb
}) => {
    const { user } = useAuth();
    const {
        loadedPages,
        loadPageLayout,
        hydratePageLayout,
        addWidgetToPage,
        removeWidgetFromPage,
        moveWidgetInPage,
        updatePageContainerColumns,
        updatePageContainerSettings,
        addPageContainer,
        addFlexPageContainer,
        removePageContainer,
        movePageContainer,
        isLoading
    } = useLayout();
    const layout = loadedPages.get(pageId);

    // Load the page layout on mount or hydrate from prop
    useEffect(() => {
        if (initialLayout && !layout) {
            console.log(`[GenericCanvasEdit HYDRATE] Initial hydration for "${pageId}"`, {
                widgetCount: initialLayout.containers?.reduce((sum: number, c: any) => sum + (c.widgets?.length || 0), 0),
                updatedAt: initialLayout.updatedAt
            });
            hydratePageLayout(pageId, initialLayout);
            return;
        }

        // Re-hydrate if initialLayout was updated externally (e.g. page content reloaded)
        if (initialLayout && layout && initialLayout.updatedAt && layout.updatedAt
            && initialLayout.updatedAt > layout.updatedAt) {
            console.log(`[GenericCanvasEdit HYDRATE] RE-HYDRATING "${pageId}" (stale)`, {
                initialUpdatedAt: initialLayout.updatedAt,
                layoutUpdatedAt: layout.updatedAt,
                initialWidgets: initialLayout.containers?.reduce((sum: number, c: any) => sum + (c.widgets?.length || 0), 0),
                currentWidgets: layout.containers?.reduce((sum: number, c: any) => sum + (c.widgets?.length || 0), 0)
            });
            hydratePageLayout(pageId, initialLayout);
            return;
        }

        if (!layout) {
            console.log(`[GenericCanvasEdit HYDRATE] Loading from API for "${pageId}"`);
            loadPageLayout(pageId, pageName);
        }
    }, [pageId, pageName, layout, loadPageLayout, hydratePageLayout, initialLayout]);

    const [internalSelectedContainer, setInternalSelectedContainer] = useState<string | null>(null);

    const selectedContainer = propSelectedContainerId !== undefined ? propSelectedContainerId : internalSelectedContainer;
    const setSelectedContainer = (id: string | null, pageId?: string) => {
        if (propOnSelectContainer) {
            propOnSelectContainer(id, pageId);
        } else {
            setInternalSelectedContainer(id);
        }
    };

    const [showWidgetPalette, setShowWidgetPalette] = useState(false);
    const [targetContainerId, setTargetContainerId] = useState<string | null>(null);
    const [targetColumn, setTargetColumn] = useState<number | undefined>(undefined);
    const [targetRowId, setTargetRowId] = useState<string | undefined>(undefined);

    if (isLoading || !layout) {
        return (
            <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-slate-500 dark:text-slate-400">Loading {pageName.toLowerCase()}...</p>
                </div>
            </div>
        );
    }

    const handleSelectContainer = (containerId: string, innerPageId?: string) => {
        setSelectedContainer(containerId, innerPageId);
    };

    const handleAddWidget = (containerId: string, columnIndex?: number, rowId?: string) => {
        setTargetContainerId(containerId);
        setTargetColumn(columnIndex);
        setTargetRowId(rowId);
        setShowWidgetPalette(true);
    };

    const handleWidgetAdd = async (widgetId: string) => {
        if (targetContainerId) {
            try {
                await addWidgetToPage(pageId, targetContainerId, widgetId, targetColumn, targetRowId);
            } catch (error) {
                console.error('Failed to add widget:', error);
            }
        }
        setShowWidgetPalette(false);
        setTargetContainerId(null);
        setTargetColumn(undefined);
        setTargetRowId(undefined);
    };

    const handleCanvasClick = () => {
        if (isEditMode) {
            setSelectedContainer(null);
        }
    };


    // Drag and Drop Handler for Image Files
    const handleFilesDrop = async (files: File[], targetContainerId?: string, targetColumn?: number) => {
        if (!targetContainerId) return;

        const toastId = toast.loading(translate('Uploading images...'));

        try {
            if (!user) {
                toast.error(translate('You must be logged in to upload images'), { id: toastId });
                return;
            }

            for (const file of files) {
                // Upload and create record
                const picture = await uploadAndCreatePicture(file, user.id);

                if (picture) {
                    // Create widget with initial props
                    await addWidgetToPage(pageId, targetContainerId, 'photo-card', targetColumn, undefined, {
                        pictureId: picture.id
                    });
                }
            }
            toast.success(translate('Images added to page'), { id: toastId });
        } catch (error) {
            console.error('Failed to process dropped files:', error);
            toast.error(translate('Failed to upload images'), { id: toastId });
        }
    };

    const totalWidgets = layout.containers.reduce((total, container) => {
        const getContainerWidgetCount = (cont: any): number => {
            let count = cont.widgets.length;
            if (cont.children) {
                cont.children.forEach((child: any) => {
                    count += getContainerWidgetCount(child);
                });
            }
            return count;
        };
        return total + getContainerWidgetCount(container);
    }, 0);

    if (!isEditMode && totalWidgets === 0) {
        return null;
    }

    return (
        <div className={`${className.includes('p-0') ? 'space-y-2' : 'space-y-6'} ${className}`}>

            {/* Header with Controls */}
            {showControls && (
                <div className="">
                    {/* Layout Info */}
                    <div className="mt-3 pt-3 border-t border-slate-300/30 dark:border-white/10">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            <T>Containers</T>: {layout.containers.length} | <T>Widgets</T>: {totalWidgets} | <T>Last updated</T>: {new Date(layout.updatedAt).toLocaleString()}
                        </p>
                        {selectionBreadcrumb}
                    </div>
                </div>
            )}

            {/* Container Canvas */}
            <div
                className={`${className.includes('p-0') ? 'space-y-2' : 'space-y-4'}`}
                onClick={handleCanvasClick}
            >
                {layout.containers
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((container, index, array) => {
                        // Dispatch to the correct renderer based on container type
                        if (container.type === 'flex-container') {
                            return (
                                <FlexibleContainerRenderer
                                    key={container.id}
                                    container={container}
                                    isEditMode={isEditMode}
                                    pageId={pageId}
                                    selectedContainerId={selectedContainer}
                                    onSelect={handleSelectContainer}
                                    onAddWidget={handleAddWidget}
                                    isCompactMode={className.includes('p-0')}
                                    selectedWidgetId={selectedWidgetId}
                                    selectedWidgetIds={selectedWidgetIds}
                                    onSelectWidget={onSelectWidget}
                                    editingWidgetId={editingWidgetId}
                                    onEditWidget={onEditWidget}
                                    newlyAddedWidgetId={newlyAddedWidgetId}
                                    contextVariables={contextVariables}
                                    pageContext={pageContext}
                                    onRemoveWidget={async (widgetId) => {
                                        try {
                                            await removeWidgetFromPage(pageId, widgetId);
                                        } catch (error) {
                                            console.error('Failed to remove widget:', error);
                                        }
                                    }}
                                    onRemoveContainer={async (containerId) => {
                                        try {
                                            await removePageContainer(pageId, containerId);
                                        } catch (error) {
                                            console.error('Failed to remove container:', error);
                                        }
                                    }}
                                    onMoveContainer={async (containerId, direction) => {
                                        try {
                                            await movePageContainer(pageId, containerId, direction);
                                        } catch (error) {
                                            console.error('Failed to move container:', error);
                                        }
                                    }}
                                    canMoveContainerUp={index > 0}
                                    canMoveContainerDown={index < array.length - 1}
                                />
                            );
                        }

                        // Default: LayoutContainer
                        return (
                            <LayoutContainer
                                key={container.id}
                                container={container}
                                isEditMode={isEditMode}
                                pageId={pageId}
                                selectedContainerId={selectedContainer}
                                onSelect={handleSelectContainer}
                                onAddWidget={handleAddWidget}
                                isCompactMode={className.includes('p-0')}
                                selectedWidgetId={selectedWidgetId}
                                selectedWidgetIds={selectedWidgetIds}
                                onSelectWidget={onSelectWidget}
                                editingWidgetId={editingWidgetId}
                                onEditWidget={onEditWidget}
                                newlyAddedWidgetId={newlyAddedWidgetId}
                                contextVariables={contextVariables}
                                pageContext={pageContext}
                                onRemoveWidget={async (widgetId) => {
                                    try {
                                        await removeWidgetFromPage(pageId, widgetId);
                                    } catch (error) {
                                        console.error('Failed to remove widget:', error);
                                    }
                                }}
                                onMoveWidget={async (widgetId, direction) => {
                                    try {
                                        await moveWidgetInPage(pageId, widgetId, direction);
                                    } catch (error) {
                                        console.error('Failed to move widget:', error);
                                    }
                                }}
                                onUpdateColumns={async (containerId, columns) => {
                                    try {
                                        await updatePageContainerColumns(pageId, containerId, columns);
                                    } catch (error) {
                                        console.error('Failed to update columns:', error);
                                    }
                                }}
                                onUpdateSettings={async (containerId, settings) => {
                                    try {
                                        await updatePageContainerSettings(pageId, containerId, settings);
                                    } catch (error) {
                                        console.error('Failed to update settings:', error);
                                    }
                                }}
                                onAddContainer={async (parentId) => {
                                    try {
                                        await addPageContainer(pageId, parentId);
                                    } catch (error) {
                                        console.error('Failed to add container:', error);
                                    }
                                }}
                                onMoveContainer={async (containerId, direction) => {
                                    try {
                                        await movePageContainer(pageId, containerId, direction);
                                    } catch (error) {
                                        console.error('Failed to move container:', error);
                                    }
                                }}
                                canMoveContainerUp={index > 0}
                                canMoveContainerDown={index < array.length - 1}
                                onRemoveContainer={async (containerId) => {
                                    try {
                                        await removePageContainer(pageId, containerId);
                                    } catch (error) {
                                        console.error('Failed to remove container:', error);
                                    }
                                }}
                                onFilesDrop={(files, targetColumn) => handleFilesDrop(files, container.id, targetColumn)}
                            />
                        );
                    })}

                {layout.containers.length === 0 && (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        {isEditMode ? (
                            <>
                                <Grid3X3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium mb-2">
                                    <T>No containers yet</T>
                                </p>
                                <p className="text-sm mb-4">
                                    <T>Add a container to start building your layout</T>
                                </p>
                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                        onClick={async () => {
                                            try { await addPageContainer(pageId); } catch (e) { console.error(e); }
                                        }}
                                    >
                                        + Container
                                    </button>
                                    <button
                                        className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                                        onClick={async () => {
                                            try { await addFlexPageContainer(pageId); } catch (e) { console.error(e); }
                                        }}
                                    >
                                        + Flexible Container
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-sm">
                                    <T>Switch to edit mode to add containers</T>
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Widget Palette Modal */}
            <WidgetPalette
                isVisible={showWidgetPalette}
                onClose={() => {
                    setShowWidgetPalette(false);
                    setTargetContainerId(null);
                }}
                onWidgetAdd={handleWidgetAdd}
            />
        </div>
    );
};

export default GenericCanvasEdit;
