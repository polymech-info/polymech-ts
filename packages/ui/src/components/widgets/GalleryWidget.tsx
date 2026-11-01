import React, { lazy, Suspense } from 'react';
import GalleryWidgetView from './GalleryWidgetView';
import type { GalleryWidgetProps } from './GalleryWidgetTypes';

const GalleryWidgetEdit = lazy(() => import('./GalleryWidgetEdit'));

export type { GalleryWidgetProps } from './GalleryWidgetTypes';

const GalleryWidgetComponent: React.FC<GalleryWidgetProps> = (props) => {
    if (!props.isEditMode) {
        return <GalleryWidgetView {...props} />;
    }

    return (
        <Suspense fallback={<GalleryWidgetView {...props} />}>
            <GalleryWidgetEdit {...props} />
        </Suspense>
    );
};

export default GalleryWidgetComponent;
