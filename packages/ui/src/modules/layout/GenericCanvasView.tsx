import React, { useEffect } from 'react';
import { useLayout } from '@/modules/layout/LayoutContext';
import { LayoutContainer } from './LayoutContainer';
import FlexibleContainerRenderer from './FlexibleContainerRenderer';

export interface GenericCanvasViewProps {
    pageId: string;
    pageName: string;
    className?: string;
    initialLayout?: any;
    contextVariables?: Record<string, any>;
    pageContext?: Record<string, any>;
}

const GenericCanvasView: React.FC<GenericCanvasViewProps> = ({
    pageId,
    pageName,
    className = '',
    initialLayout,
    contextVariables,
    pageContext,
}) => {
    const {
        loadedPages,
        loadPageLayout,
        hydratePageLayout,
        isLoading,
    } = useLayout();
    const layout = loadedPages.get(pageId);

    // Load the page layout on mount or hydrate from prop
    useEffect(() => {
        if (initialLayout && !layout) {
            hydratePageLayout(pageId, initialLayout);
            return;
        }

        if (!layout) {
            loadPageLayout(pageId, pageName);
        }
    }, [pageId, pageName, layout, loadPageLayout, hydratePageLayout, initialLayout]);

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

    if (totalWidgets === 0) {
        return null;
    }

    return (
        <div className={`${className.includes('p-0') ? 'space-y-2' : 'space-y-6'} ${className}`}>
            {/* Container Canvas */}
            <div className={`${className.includes('p-0') ? 'space-y-2' : 'space-y-4'}`}>
                {layout.containers
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((container) => {
                        if (container.type === 'flex-container') {
                            return (
                                <FlexibleContainerRenderer
                                    key={container.id}
                                    container={container}
                                    isEditMode={false}
                                    pageId={pageId}
                                    isCompactMode={className.includes('p-0')}
                                    contextVariables={contextVariables}
                                    pageContext={pageContext}
                                />
                            );
                        }

                        return (
                            <LayoutContainer
                                key={container.id}
                                container={container}
                                isEditMode={false}
                                pageId={pageId}
                                isCompactMode={className.includes('p-0')}
                                contextVariables={contextVariables}
                                pageContext={pageContext}
                            />
                        );
                    })}
            </div>
        </div>
    );
};

export default GenericCanvasView;
