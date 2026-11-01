import React, { lazy, Suspense } from 'react';
import LayoutContainerView from './LayoutContainerView';
import type { LayoutContainerEditProps } from './LayoutContainerEdit';

const LayoutContainerEdit = lazy(() => import('./LayoutContainerEdit'));

export type { LayoutContainerEditProps as LayoutContainerProps } from './LayoutContainerEdit';

const LayoutContainerComponent: React.FC<LayoutContainerEditProps> = (props) => {
  if (!props.isEditMode) {
    return <LayoutContainerView {...props} />;
  }

  return (
    <Suspense fallback={<LayoutContainerView {...props} />}>
      <LayoutContainerEdit {...props} />
    </Suspense>
  );
};

export const LayoutContainer = LayoutContainerComponent;
