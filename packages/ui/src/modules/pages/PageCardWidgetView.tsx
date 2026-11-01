import React, { useState, useEffect } from 'react';
import PageCard from '@/modules/pages/PageCard';
import type { MediaType } from '@/types';
import { fetchPageDetailsById } from '@/modules/pages/client-pages';

export interface PageCardWidgetProps {
    isEditMode?: boolean;
    pageId?: string | null;
    showHeader?: boolean;
    showFooter?: boolean;
    showAuthor?: boolean;
    showActions?: boolean;
    showTitle?: boolean;
    showDescription?: boolean;
    contentDisplay?: 'below' | 'overlay' | 'overlay-always';
    widgetInstanceId?: string;
    onPropsChange?: (props: Record<string, any>) => void;
    className?: string;
}

export interface PageData {
    id: string;
    title: string;
    description: string | null;
    slug: string;
    user_id: string;
    likes_count: number;
    comments_count: number;
    image_url: string | null;
    type: MediaType;
    meta: any;
    created_at: string;
}

/** Shared hook for page data fetching */
export function usePageCardData(propPageId: string | null) {
    const [pageId, setPageId] = useState<string | null>(propPageId);
    const [page, setPage] = useState<PageData | null>(null);
    const [loading, setLoading] = useState(false);
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => { setPageId(propPageId); }, [propPageId]);

    useEffect(() => {
        if (pageId) {
            fetchPageData(pageId);
        } else {
            setPage(null);
        }
    }, [pageId]);

    const fetchPageData = async (id: string) => {
        setLoading(true);
        try {
            const result = await fetchPageDetailsById(id);
            if (!result || !result.page) { setPage(null); return; }

            const pageData = result.page;
            let thumbnailUrl = (pageData.meta as any)?.thumbnail;
            if (thumbnailUrl && (thumbnailUrl.includes('/pages/') || thumbnailUrl.includes('/user/'))) {
                thumbnailUrl = null;
            }

            setPage({
                id: pageData.id,
                title: pageData.title,
                description: pageData.description || (pageData.meta as any)?.description || null,
                slug: pageData.slug,
                user_id: pageData.owner,
                likes_count: 0,
                comments_count: 0,
                image_url: thumbnailUrl || 'https://picsum.photos/640',
                type: 'page-intern',
                meta: pageData.meta,
                created_at: pageData.created_at
            });
        } catch (error) {
            console.error('Error fetching page:', error);
            setPage(null);
        } finally {
            setLoading(false);
        }
    };

    return { pageId, setPageId, page, setPage, loading, isLiked };
}

/** Lightweight view-only component — eagerly loaded */
const PageCardWidgetView: React.FC<PageCardWidgetProps> = ({
    pageId: propPageId = null,
    showHeader = true,
    showFooter = true,
    showAuthor = true,
    showActions = true,
    showTitle = true,
    showDescription = false,
    contentDisplay = 'below',
    className,
}) => {
    const { page, loading } = usePageCardData(propPageId);

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!page) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-lg">
                <p className="text-sm text-muted-foreground">No page selected</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <PageCard
                id={page.id}
                url={`/user/${page.user_id}/pages/${page.slug}`}
                thumbnailUrl={page.image_url}
                title={page.title}
                author=""
                authorId={page.user_id}
                likes={page.likes_count}
                comments={page.comments_count}
                isLiked={false}
                description={page.description}
                type={page.type}
                meta={page.meta}
                onClick={() => {
                    window.location.href = `/user/${page.user_id}/pages/${page.slug}`;
                }}
                onLike={() => { }}
                variant={contentDisplay === 'overlay' || contentDisplay === 'overlay-always' ? 'grid' : 'feed'}
                overlayMode={contentDisplay === 'overlay-always' ? 'always' : 'hover'}
                showHeader={showHeader}
                showContent={showFooter}
                created_at={page.created_at}
                preset={{ showTitle, showDescription, showAuthor, showActions }}
                className={className}
            />
        </div>
    );
};

export default PageCardWidgetView;
