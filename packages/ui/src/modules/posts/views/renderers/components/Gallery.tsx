import React, { lazy, Suspense } from 'react';
import GalleryView from './GalleryView';
import type { GalleryProps } from './GalleryTypes';

const GalleryEdit = lazy(() => import('./GalleryEdit'));

export type { GalleryProps } from './GalleryTypes';

const GalleryComponent: React.FC<GalleryProps> = (props) => {
    if (!props.isEditMode) {
        return <GalleryView {...props} />;
    }

    return (
        <Suspense fallback={<GalleryView {...props} />}>
            <GalleryEdit {...props} />
        </Suspense>
    );
};

export const Gallery = GalleryComponent;
