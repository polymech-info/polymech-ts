import React from 'react';
import { EmbedRenderer } from './modules/posts/views/renderers/EmbedRenderer';
import UserPage from '@/modules/pages/UserPage';
import { Toaster } from "@/components/ui/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { MemoryRouter } from 'react-router-dom';
import { LayoutProvider } from '@/modules/layout/LayoutContext';
import { AuthProvider } from '@/hooks/useAuth';
import { LogProvider } from '@/contexts/LogContext';

interface EmbedAppProps {
    initialState: any;
}

const EmbedApp: React.FC<EmbedAppProps> = ({ initialState }) => {
    const { post, mediaItems, authorProfile, page } = initialState;

    if (!post && !mediaItems && !page) {
        return (
            <div className="flex items-center justify-center h-full w-full bg-background text-muted-foreground p-4 text-center">
                <p>Content not found or failed to load.</p>
            </div>
        );
    }

    if (page) {
        return (
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <LogProvider>
                        <MemoryRouter>
                            <LayoutProvider>
                                <UserPage
                                    initialPage={page}
                                    embedded={true}
                                    userId={page.owner}
                                    slug={page.slug}
                                />
                                <Toaster />
                            </LayoutProvider>
                        </MemoryRouter>
                    </LogProvider>
                </AuthProvider>
            </QueryClientProvider>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <LogProvider>
                    <div className="w-full h-full bg-background overflow-hidden relative">
                        <EmbedRenderer
                            post={post}
                            mediaItems={mediaItems || []}
                            authorProfile={authorProfile}
                            // Pass simplified props
                            mediaItem={mediaItems?.[0]}
                            user={null}
                            isOwner={false}
                            isLiked={false}
                            likesCount={post?.likes_count || 0}
                            // No-ops for actions
                            onEditPost={() => { }}
                            onViewModeChange={() => { }}
                            onExportMarkdown={() => { }}
                            onDeletePost={() => { }}
                            onDeletePicture={() => { }}
                            onLike={() => { }}
                            onEditPicture={() => { }}
                            onMediaSelect={() => { }}
                            onExpand={() => {
                                // Open post in new tab
                                window.open(`/post/${post?.id || mediaItems?.[0]?.id}`, '_blank');
                            }}
                            onDownload={() => { }}
                            currentImageIndex={0}
                            videoPlaybackUrl=""
                            videoPosterUrl=""
                            versionImages={[]}
                            handlePrevImage={() => { }}
                            handleNavigate={(dir) => { }}
                            navigationData={null}
                            isEditMode={false}
                            localPost={null}
                            setLocalPost={() => { }}
                            localMediaItems={[]}
                            setLocalMediaItems={() => { }}
                            onMoveItem={() => { }}
                            onEditModeToggle={() => { }}
                            onSaveChanges={() => { }}
                            onYouTubeAdd={() => { }}
                            onTikTokAdd={() => { }}
                            onAIWizardOpen={() => { }}
                            onInlineUpload={async () => { }}
                            onRemoveFromPost={() => { }}
                            onGalleryPickerOpen={() => { }}
                            onUnlinkImage={() => { }}
                        />
                        <Toaster />
                    </div>
                </LogProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
};

export default EmbedApp;
