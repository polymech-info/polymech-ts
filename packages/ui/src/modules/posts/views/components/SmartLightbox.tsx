import React, { Suspense, lazy } from 'react';
import ImageLightbox from "@/components/ImageLightbox";
import { PostMediaItem } from "../types";
import { User } from "@polymech/shared";

// Lazy load the LLM-powered editor — only fetched when user is logged in
const SmartLightboxEditor = lazy(() => import('./SmartLightboxEditor'));

interface SmartLightboxProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl?: string;
    imageTitle?: string;
    mediaItem: PostMediaItem;
    user: User | null;
    isVideo: boolean;

    // Navigation / Parent Actions
    onPublish: (option: 'overwrite' | 'new' | 'version', imageUrl: string, newTitle: string, description?: string, parentId?: string, collectionIds?: string[]) => Promise<void>;
    onNavigate: (direction: 'prev' | 'next') => void;
    onOpenInWizard: () => void;
    currentIndex?: number;
    totalCount?: number;
}

const SmartLightbox: React.FC<SmartLightboxProps> = (props) => {
    const {
        isOpen,
        onClose,
        imageUrl,
        imageTitle,
        mediaItem,
        user,
        isVideo,
        onNavigate,
        onOpenInWizard,
        currentIndex,
        totalCount
    } = props;

    // Authenticated: lazy-load the full LLM editor (separate chunk with usePostLLM + OpenAI etc.)
    if (user) {
        return (
            <Suspense fallback={null}>
                <SmartLightboxEditor {...props} user={user} />
            </Suspense>
        );
    }

    // Anonymous: lightweight viewer — no LLM bundle loaded
    return (
        <ImageLightbox
            isOpen={isOpen}
            onClose={onClose}
            imageUrl={imageUrl || mediaItem.image_url}
            imageTitle={imageTitle || mediaItem.title}
            showPrompt={false}
            currentIndex={currentIndex}
            totalCount={totalCount}
            onNavigate={onNavigate}
            originalImageId={mediaItem.id}
            onOpenInWizard={onOpenInWizard}
        />
    );
};

export default SmartLightbox;
