import React, { Suspense, lazy } from 'react';
import PageCardWidgetView from './PageCardWidgetView';
import type { PageCardWidgetProps } from './PageCardWidgetView';

const PageCardWidgetEdit = lazy(() => import('./PageCardWidgetEdit'));

/** Thin router: eagerly renders view, lazy-loads edit */
const PageCardWidget: React.FC<PageCardWidgetProps> = (props) => {
    if (props.isEditMode) {
        return (
            <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            }>
                <PageCardWidgetEdit {...props} />
            </Suspense>
        );
    }

    return <PageCardWidgetView {...props} />;
};

export default PageCardWidget;
