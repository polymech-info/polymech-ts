import React, { lazy, Suspense } from 'react';
import GenericCanvasView from './GenericCanvasView';

// Re-export the full props type so existing consumers keep working
export type { GenericCanvasEditProps as GenericCanvasProps } from './GenericCanvasEdit';

// Lazy-load the heavy edit component (WidgetPalette, upload utils, etc.)
const GenericCanvasEdit = lazy(() => import('./GenericCanvasEdit'));

import type { GenericCanvasEditProps } from './GenericCanvasEdit';

const GenericCanvasComponent: React.FC<GenericCanvasEditProps> = (props) => {
  if (!props.isEditMode) {
    return (
      <GenericCanvasView
        pageId={props.pageId}
        pageName={props.pageName}
        className={props.className}
        initialLayout={props.initialLayout}
        contextVariables={props.contextVariables}
        pageContext={props.pageContext}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <GenericCanvasView
          pageId={props.pageId}
          pageName={props.pageName}
          className={props.className}
          initialLayout={props.initialLayout}
          contextVariables={props.contextVariables}
          pageContext={props.pageContext}
        />
      }
    >
      <GenericCanvasEdit {...props} />
    </Suspense>
  );
};

export const GenericCanvas = GenericCanvasComponent;
