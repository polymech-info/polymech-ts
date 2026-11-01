import React, { lazy, Suspense } from 'react';
import { Page, UserProfile } from "../types";
import UserPageDetailsView from './UserPageDetailsView';

type Layout = any; // TODO: replace with actual type

export interface UserPageDetailsProps {
    page: Page;
    userProfile: UserProfile | null;
    isOwner: boolean;
    isEditMode: boolean;
    embedded?: boolean;
    userId: string;
    orgSlug?: string;
    onPageUpdate: (updatedPage: Page) => void;
    onToggleEditMode: () => void;
    onWidgetRename: (id: string | null) => void;
    templates?: Layout[];
    onLoadTemplate?: (template: Layout) => void;
    showActions?: boolean;
    ActionsComponent?: React.ComponentType<any>;
    contextVariables?: Record<string, any>;
}

const UserPageDetailsEdit = lazy(() => import('./UserPageDetailsEdit'));

export const UserPageDetails: React.FC<UserPageDetailsProps> = (props) => {
    if (!props.isEditMode) {
        return <UserPageDetailsView {...props} />;
    }

    return (
        <Suspense fallback={<UserPageDetailsView {...props} />}>
            <UserPageDetailsEdit {...props} />
        </Suspense>
    );
};
