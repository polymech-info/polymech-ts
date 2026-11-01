import React, { Suspense, lazy } from 'react';
import PhotoCardWidgetView from './PhotoCardWidgetView';
import type { PhotoCardWidgetProps } from './PhotoCardWidgetView';

// Heavy edit component — lazy loaded only when isEditMode is true
const PhotoCardWidgetEdit = lazy(() => import('./PhotoCardWidgetEdit'));

/** Thin router: eagerly renders view, lazy-loads edit */
const PhotoCardWidget: React.FC<PhotoCardWidgetProps> = (props) => {
  if (props.isEditMode) {
    return (
      <Suspense fallback={
        <div className="bg-card border rounded-lg p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        </div>
      }>
        <PhotoCardWidgetEdit {...props} />
      </Suspense>
    );
  }

  return <PhotoCardWidgetView {...props} />;
};

export default PhotoCardWidget;
