import React, { lazy, Suspense } from 'react';
import FlexContainerView from './FlexContainerView';

// Re-export the full props type so existing consumers keep working
export type { FlexibleContainerRendererProps } from './FlexContainerEdit';

// Lazy-load the heavy edit component (DnD, commands, toolbars, popovers)
const FlexContainerEdit = lazy(() => import('./FlexContainerEdit'));

import type { FlexibleContainerRendererProps } from './FlexContainerEdit';

const FlexibleContainerRenderer: React.FC<FlexibleContainerRendererProps> = (props) => {
    if (!props.isEditMode) {
        return (
            <FlexContainerView
                container={props.container}
                isEditMode={false}
                pageId={props.pageId}
                isCompactMode={props.isCompactMode}
                contextVariables={props.contextVariables}
            />
        );
    }

    return (
        <Suspense
            fallback={
                <FlexContainerView
                    container={props.container}
                    isEditMode={true}
                    pageId={props.pageId}
                    isCompactMode={props.isCompactMode}
                    contextVariables={props.contextVariables}
                />
            }
        >
            <FlexContainerEdit {...props} />
        </Suspense>
    );
};

export default FlexibleContainerRenderer;
