import React, { useState } from 'react';
import PageCard from '@/modules/pages/PageCard';
import { Button } from '@/components/ui/button';
import { FileText, ImageIcon } from 'lucide-react';
import { usePageCardData } from './PageCardWidgetView';
import type { PageCardWidgetProps } from './PageCardWidgetView';

const PagePickerDialog = React.lazy(() => import('@/modules/pages/PagePickerDialog').then(m => ({ default: m.PagePickerDialog })));

/** Edit-mode component — lazy loaded */
const PageCardWidgetEdit: React.FC<PageCardWidgetProps> = ({
    pageId: propPageId = null,
    showHeader = true,
    showFooter = true,
    showAuthor = true,
    showActions = true,
    showTitle = true,
    showDescription = false,
    contentDisplay = 'below',
    onPropsChange
}) => {
    const { pageId, setPageId, page, loading, isLiked } = usePageCardData(propPageId);
    const [showPagePicker, setShowPagePicker] = useState(false);

    const handleLike = async () => {
        console.log('Like functionality not yet implemented');
    };

    const handlePageSelect = (selectedPage: { id: string } | null) => {
        const selectedPageId = selectedPage ? selectedPage.id : null;
        setPageId(selectedPageId);
        setShowPagePicker(false);
        onPropsChange?.({ pageId: selectedPageId });
    };

    // No page selected — show picker prompt
    if (!pageId) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-muted/20 border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
                <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">No page selected</p>
                    <Button onClick={() => setShowPagePicker(true)} variant="outline">
                        Select Page
                    </Button>
                </div>
                <React.Suspense fallback={null}>
                    <PagePickerDialog
                        isOpen={showPagePicker}
                        onClose={() => setShowPagePicker(false)}
                        onSelect={handlePageSelect}
                        currentValue={pageId}
                    />
                </React.Suspense>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Page selected — show card with edit overlay
    return (
        <div className="relative w-full h-full">
            {page && (
                <PageCard
                    id={page.id}
                    url={`/user/${page.user_id}/pages/${page.slug}`}
                    thumbnailUrl={page.image_url}
                    title={page.title}
                    author=""
                    authorId={page.user_id}
                    likes={page.likes_count}
                    comments={page.comments_count}
                    isLiked={isLiked}
                    description={page.description}
                    type={page.type}
                    meta={page.meta}
                    onClick={() => { }}
                    onLike={handleLike}
                    variant={contentDisplay === 'overlay' || contentDisplay === 'overlay-always' ? 'grid' : 'feed'}
                    overlayMode={contentDisplay === 'overlay-always' ? 'always' : 'hover'}
                    showHeader={showHeader}
                    showContent={showFooter}
                    created_at={page.created_at}
                    preset={{ showTitle, showDescription, showAuthor, showActions }}
                />
            )}
            <div className="absolute top-2 right-2 z-10">
                <Button
                    onClick={() => setShowPagePicker(true)}
                    size="sm"
                    variant="secondary"
                    className="rounded-full"
                >
                    <ImageIcon className="w-4 h-4" />
                </Button>
            </div>
            <React.Suspense fallback={null}>
                <PagePickerDialog
                    isOpen={showPagePicker}
                    onClose={() => setShowPagePicker(false)}
                    onSelect={handlePageSelect}
                    currentValue={pageId}
                />
            </React.Suspense>
        </div>
    );
};

export default PageCardWidgetEdit;
