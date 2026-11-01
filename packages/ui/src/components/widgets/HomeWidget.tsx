import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { FeedSortOption } from '@/hooks/useFeedData';
import { useMediaRefresh } from '@/contexts/MediaRefreshContext';
import { useIsMobile } from '@/hooks/use-mobile';
import MediaCard from '@/components/MediaCard';
import { normalizeMediaType } from '@/lib/mediaRegistry';

import PhotoGrid from '@/components/PhotoGrid';
import GalleryLarge from '@/components/GalleryLarge';
import MobileFeed from '@/components/feed/MobileFeed';
import { ListLayout } from '@/components/ListLayout';
import CategoryTreeView from '@/components/CategoryTreeView';
import Footer from '@/components/Footer';
import { T } from '@/i18n';
import { SEO } from '@/components/SEO';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { LayoutGrid, GalleryVerticalEnd, TrendingUp, Clock, List, FolderTree, FileText, Image as ImageIcon, EyeOff, Lock, SlidersHorizontal, Layers, Camera, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { serverUrl } from '@/lib/db';

/** Feed props for {@link HomeWidget} (also the base for category-feed and other composites). */
export interface HomeWidgetProps {
    sortBy?: 'latest' | 'top';
    viewMode?: 'grid' | 'large' | 'list';
    showCategories?: boolean;
    /** Comma-separated category slugs (optional filter) */
    categorySlugs?: string;
    /** Category ID for feed APIs when resolved from a picker */
    categoryId?: string;
    userId?: string;
    showSortBar?: boolean;
    showLayoutToggles?: boolean;
    showFooter?: boolean;
    center?: boolean;
    columns?: number | 'auto';
    showTitle?: boolean;
    showDescription?: boolean;
    /** Author avatar and name on cards (grid, large, list, and mobile feed). */
    showAuthor?: boolean;
    /** Likes and comments UI on cards (matches PageCard/MediaCard “actions”). */
    showSocial?: boolean;
    /** Section heading displayed above the feed */
    heading?: string;
    /** Heading level: h1–h4 */
    headingLevel?: 'h1' | 'h2' | 'h3' | 'h4';
    variables?: Record<string, any>;
    searchQuery?: string;
    initialContentType?: 'posts' | 'pages' | 'pictures' | 'files' | 'places';
    initialVisibilityFilter?: 'invisible' | 'private';
    /** Widget editor: composite widgets use this; HomeWidget ignores it */
    isEditMode?: boolean;
    onPropsChange?: (props: Record<string, any>) => void;
    /**
     * When true, the widget fills the parent height (`h-full`) and uses flex + `min-h-0` so list/grid
     * layouts scroll inside the widget instead of stretching the page. Use when embedding in CMS pages
     * or any container with a defined height.
     */
    fillHeight?: boolean;
}

const SIDEBAR_KEY = 'categorySidebarSize';
const DEFAULT_SIDEBAR = 15;

const HomeWidget: React.FC<HomeWidgetProps> = ({
    sortBy: propSortBy = 'latest',
    viewMode: propViewMode = 'grid',
    showCategories: propShowCategories = false,
    categorySlugs: propCategorySlugs = '',
    categoryId: propCategoryId,
    userId: propUserId = '',
    showSortBar = true,
    showLayoutToggles = true,
    showFooter = true,
    showTitle = true,
    showDescription = false,
    showAuthor = true,
    showSocial = true,
    center = false,
    columns = 'auto',
    heading,
    headingLevel = 'h2',
    variables: _variables,
    searchQuery,
    initialContentType,
    initialVisibilityFilter,
    isEditMode: _isEditMode,
    onPropsChange: _onPropsChange,
    fillHeight = false,
}) => {
    const { refreshKey } = useMediaRefresh();
    const isMobile = useIsMobile();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Derive content type from URL path (/user/:id/... or top-level /posts, /pages)
    const urlContentType = useMemo(() => {
        // Match /user/:id/posts|pages|pictures|files
        const userMatch = location.pathname.match(/^\/user\/[^/]+\/(posts|pages|pictures|files)$/);
        if (userMatch) return userMatch[1] as 'posts' | 'pages' | 'pictures' | 'files';
        // Match top-level /posts or /pages or /files
        const topMatch = location.pathname.match(/^\/(posts|pages|files)$/);
        if (topMatch) return topMatch[1] as 'posts' | 'pages' | 'files';
        return undefined;
    }, [location.pathname]);

    // Effective initial: prop takes priority, then URL
    const effectiveInitial = initialContentType ?? urlContentType;

    // Show visibility toggles on own profile OR in search mode when authenticated
    const isOwnProfile = !!(propUserId && currentUser?.id === propUserId) || !!(searchQuery && currentUser);

    // Local state driven from props (with user overrides)
    const [sortBy, setSortBy] = useState<FeedSortOption>(propSortBy);
    const [viewMode, setViewMode] = useState<'grid' | 'large' | 'list'>(() => {
        return (localStorage.getItem('feedViewMode') as 'grid' | 'large' | 'list') || propViewMode;
    });
    const [showCategories, setShowCategories] = useState(propShowCategories);

    // Sync from prop changes
    useEffect(() => { setSortBy(propSortBy); }, [propSortBy]);
    useEffect(() => { setShowCategories(propShowCategories); }, [propShowCategories]);
    useEffect(() => { setViewMode(propViewMode); }, [propViewMode]);

    // Content type filter
    const [contentType, setContentType] = useState<'posts' | 'pages' | 'pictures' | 'files' | 'places' | undefined>(
        String(effectiveInitial) === 'all' ? undefined : (effectiveInitial as any)
    );

    // Sync when URL changes (e.g. browser back/forward)
    useEffect(() => {
        setContentType(String(effectiveInitial) === 'all' ? undefined : (effectiveInitial as any));
    }, [effectiveInitial]);

    // Navigate URL when content type changes (only when rendered on a user profile or in search)
    const handleContentTypeChange = useCallback((newType: 'posts' | 'pages' | 'pictures' | 'files' | 'places' | undefined) => {
        setContentType(newType);
        if (propUserId) {
            const basePath = `/user/${propUserId}`;
            const targetPath = newType ? `${basePath}/${newType}` : basePath;
            navigate(targetPath, { replace: true });
        } else if (searchQuery) {
            const params = new URLSearchParams(location.search);
            if (newType) params.set('type', newType);
            else params.delete('type');
            navigate(`/search?${params.toString()}`, { replace: true });
        }
    }, [propUserId, searchQuery, location.search, navigate]);

    // Visibility filter (own profile only) — exclusive: shows ONLY invisible or ONLY private
    const [visibilityFilter, setVisibilityFilter] = useState<'invisible' | 'private' | undefined>(initialVisibilityFilter);

    useEffect(() => {
        setVisibilityFilter(initialVisibilityFilter);
    }, [initialVisibilityFilter]);

    const handleVisibilityFilterChange = useCallback((value: string) => {
        const newValue = value === 'invisible' || value === 'private' ? value : undefined;
        setVisibilityFilter(newValue);
        if (searchQuery) {
            const params = new URLSearchParams(location.search);
            if (newValue) params.set('visibilityFilter', newValue);
            else params.delete('visibilityFilter');
            navigate(`/search?${params.toString()}`, { replace: true });
        }
    }, [searchQuery, location.search, navigate]);

    useEffect(() => {
        localStorage.setItem('feedViewMode', viewMode);
    }, [viewMode]);

    const categorySlugs = useMemo(() => {
        if (!propCategorySlugs) return undefined;
        return propCategorySlugs.split(',').map(s => s.trim()).filter(Boolean);
    }, [propCategorySlugs]);

    /** Same targets as {@link CategoryTreeView} category selection: `/categories/…` or home. */
    const headingLinkTo = useMemo(
        () =>
            categorySlugs && categorySlugs.length > 0
                ? `/categories/${categorySlugs.join('/')}`
                : '/',
        [categorySlugs],
    );

    const cardPreset = useMemo(
        () => ({
            showTitle,
            showDescription,
            showAuthor,
            showActions: showSocial,
        }),
        [showTitle, showDescription, showAuthor, showSocial]
    );

    // Derive source/sourceId for user filtering
    const feedSource = searchQuery ? 'search' as const : propUserId ? 'user' as const : 'home' as const;
    const feedSourceId = searchQuery || propUserId || undefined;

    // Mobile sheet state
    const [sheetOpen, setSheetOpen] = useState(false);
    const closeSheet = useCallback(() => setSheetOpen(false), []);

    // Persist sidebar size
    const [sidebarSize, setSidebarSize] = useState(() => {
        const stored = localStorage.getItem(SIDEBAR_KEY);
        return stored ? Number(stored) : DEFAULT_SIDEBAR;
    });
    const handleSidebarResize = useCallback((size: number) => {
        setSidebarSize(size);
        localStorage.setItem(SIDEBAR_KEY, String(size));
    }, []);

    // Navigation helpers — toggle local state
    const handleSortChange = useCallback((value: string) => {
        if (!value) return;
        if (value === 'latest') setSortBy('latest');
        else if (value === 'top') setSortBy('top');
        else if (value === 'categories') setShowCategories(prev => !prev);
    }, []);

    const handleCategoriesToggle = useCallback(() => {
        setShowCategories(prev => {
            const next = !prev;
            if (next && isMobile) setSheetOpen(true);
            return next;
        });
    }, [isMobile]);

    // --- Shared sort + categories toggle bar ---
    const renderSortBar = (size?: 'sm') => (
        <div className="flex flex-wrap items-center gap-1">
            <ToggleGroup type="single" value={sortBy} onValueChange={handleSortChange}>
                <ToggleGroupItem value="latest" aria-label="Latest Posts" size={size}>
                    <Clock className="h-4 w-4 mr-1.5" />
                    <T>Latest</T>
                </ToggleGroupItem>
                <ToggleGroupItem value="top" aria-label="Top Posts" size={size}>
                    <TrendingUp className="h-4 w-4 mr-1.5" />
                    <T>Top</T>
                </ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup type="single" value={showCategories ? 'categories' : ''} onValueChange={handleCategoriesToggle}>
                <ToggleGroupItem value="categories" aria-label="Show Categories" size={size}>
                    <FolderTree className="h-4 w-4 mr-1.5" />
                    <T>Categories</T>
                </ToggleGroupItem>
            </ToggleGroup>
            {/* Content type + visibility — collapsed into a compact dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 relative">
                        <SlidersHorizontal className="h-4 w-4" />
                        {contentType ? (
                            <span className="text-xs font-medium capitalize"><T>{contentType}</T></span>
                        ) : (
                            <span className="text-xs font-medium"><T>All</T></span>
                        )}
                        {(contentType || visibilityFilter) && (
                            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                    <DropdownMenuLabel className="text-xs"><T>Content type</T></DropdownMenuLabel>
                    <DropdownMenuRadioGroup value={contentType || 'all'} onValueChange={(v) => {
                        if (v === 'all') handleContentTypeChange(undefined);
                        else handleContentTypeChange(v as 'posts' | 'pages' | 'pictures' | 'files' | 'places');
                    }}>
                        <DropdownMenuRadioItem value="all">
                            <Layers className="h-4 w-4 mr-2" /><T>All</T>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="posts">
                            <ImageIcon className="h-4 w-4 mr-2" /><T>Posts</T>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="pages">
                            <FileText className="h-4 w-4 mr-2" /><T>Pages</T>
                        </DropdownMenuRadioItem>
                        {searchQuery && (
                            <DropdownMenuRadioItem value="places">
                                <MapPin className="h-4 w-4 mr-2" /><T>Places</T>
                            </DropdownMenuRadioItem>
                        )}
                        {isOwnProfile && (
                            <DropdownMenuRadioItem value="pictures">
                                <Camera className="h-4 w-4 mr-2" /><T>Pictures</T>
                            </DropdownMenuRadioItem>
                        )}
                        <DropdownMenuRadioItem value="files">
                            <FolderTree className="h-4 w-4 mr-2" /><T>Files</T>
                        </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                    {isOwnProfile && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs"><T>Visibility</T></DropdownMenuLabel>
                            <DropdownMenuRadioGroup value={visibilityFilter || ''} onValueChange={handleVisibilityFilterChange}>
                                <DropdownMenuRadioItem value="">
                                    <Layers className="h-4 w-4 mr-2" /><T>All</T>
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="invisible">
                                    <EyeOff className="h-4 w-4 mr-2" /><T>Invisible</T>
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="private">
                                    <Lock className="h-4 w-4 mr-2" /><T>Private</T>
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );

    // --- Pictures grid (standalone pictures, not posts) ---
    const [pictures, setPictures] = useState<any[]>([]);
    const [picturesLoading, setPicturesLoading] = useState(false);

    useEffect(() => {
        if (contentType !== 'pictures' || !propUserId) return;
        let cancelled = false;
        setPicturesLoading(true);
        import('@/modules/posts/client-pictures').then(({ fetchPictures }) =>
            fetchPictures({ userId: propUserId })
        ).then(result => {
            if (!cancelled) setPictures(result.data);
        }).catch(err => console.error('Failed to load pictures', err))
            .finally(() => { if (!cancelled) setPicturesLoading(false); });
        return () => { cancelled = true; };
    }, [contentType, propUserId, refreshKey]);

    const renderPicturesGrid = () => {
        if (picturesLoading) {
            return <div className="py-8 text-center text-muted-foreground"><T>Loading pictures...</T></div>;
        }
        if (pictures.length === 0) {
            return <div className="py-8 text-center text-muted-foreground"><T>No pictures yet</T></div>;
        }
        const SERVER_URL = serverUrl || '';
        const isAuto = columns === 'auto';
        const gridColsClass = isAuto ? 'grid-cols-[repeat(auto-fit,minmax(250px,350px))] justify-center' :
            Number(columns) === 1 ? 'grid-cols-1' :
                Number(columns) === 2 ? 'grid-cols-1 md:grid-cols-2' :
                    Number(columns) === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                        Number(columns) === 5 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' :
                            Number(columns) === 6 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' :
                                'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:grid-cols-5'; // default 4-ish/5

        return (
            <div className={`grid ${gridColsClass} gap-1 px-1`}>
                {pictures.map(pic => {
                    const thumbUrl = pic.thumbnail_url || pic.image_url;
                    const optimized = thumbUrl
                        ? thumbUrl.startsWith('http')
                            ? thumbUrl
                            : `${SERVER_URL}/api/v1/image?url=${encodeURIComponent(thumbUrl)}&w=400&q=75`
                        : undefined;

                    return (
                        <div key={pic.id} className="relative group">
                            <MediaCard
                                id={pic.id}
                                pictureId={pic.picture_id}
                                url={pic.image_url!}
                                thumbnailUrl={optimized}
                                title={pic.title}
                                author={undefined as any}
                                authorAvatarUrl={undefined}
                                authorId={pic.user_id}
                                likes={pic.likes_count || 0}
                                comments={0}
                                isLiked={false}
                                type={normalizeMediaType(pic.type)}
                                meta={pic.meta}
                                onClick={() => navigate(`/post/${pic.id}`)}
                                onLike={() => { }}
                                onDelete={() => { }}
                                onEdit={() => { }}
                                created_at={pic.created_at}
                                job={pic.job}
                                responsive={pic.responsive}
                                apiUrl={SERVER_URL}
                                preset={cardPreset}
                            />
                        </div>
                    );
                })}
            </div >
        );
    };

    // --- Feed views ---
    const renderFeed = () => {
        // When 'pictures' content type is selected, render the standalone grid
        if (contentType === 'pictures') {
            return renderPicturesGrid();
        }

        if (isMobile) {
            return viewMode === 'list' ? (
                <ListLayout key={refreshKey} sortBy={sortBy} navigationSource={feedSource} navigationSourceId={feedSourceId} categorySlugs={categorySlugs} categoryIds={propCategoryId ? [propCategoryId] : undefined} contentType={contentType} visibilityFilter={visibilityFilter} center={center} preset={cardPreset} />
            ) : (
                <MobileFeed source={feedSource} sourceId={feedSourceId} sortBy={sortBy} categorySlugs={categorySlugs} categoryIds={propCategoryId ? [propCategoryId] : undefined} contentType={contentType} visibilityFilter={visibilityFilter} onNavigate={(id) => window.location.href = `/post/${id}`} showTitle={showTitle} showDescription={showDescription} showAuthor={showAuthor} showSocial={showSocial} />
            );
        }

        if (viewMode === 'grid') {
            return <PhotoGrid key={refreshKey} navigationSource={feedSource} navigationSourceId={feedSourceId} sortBy={sortBy} showVideos={true} categorySlugs={categorySlugs} categoryIds={propCategoryId ? [propCategoryId] : undefined} contentType={contentType} visibilityFilter={visibilityFilter} center={center} columns={columns} preset={cardPreset} />;
        } else if (viewMode === 'large') {
            return <GalleryLarge key={refreshKey} navigationSource={feedSource} navigationSourceId={feedSourceId} sortBy={sortBy} categorySlugs={categorySlugs} categoryIds={propCategoryId ? [propCategoryId] : undefined} contentType={contentType} visibilityFilter={visibilityFilter} center={center} preset={cardPreset} />;
        }
        return <ListLayout key={refreshKey} navigationSource={feedSource} navigationSourceId={feedSourceId} sortBy={sortBy} categorySlugs={categorySlugs} categoryIds={propCategoryId ? [propCategoryId] : undefined} contentType={contentType} visibilityFilter={visibilityFilter} center={center} preset={cardPreset} />;
    };

    // Fixed height (not only min-height) so children can use h-full / % and grid min-h-0 works.
    const listDesktopShellClass = cn(
        'flex flex-col overflow-hidden',
        fillHeight ? 'min-h-0 flex-1' : 'h-[calc(100vh-8rem)] min-h-0',
    );
    // With categories: toolbar sits above the panel group — use flex-1 inside listDesktopShellClass, not a second full-viewport height.
    const feedPanelGroupClass = cn(
        'flex flex-col overflow-hidden',
        fillHeight || viewMode === 'list' ? 'min-h-0 flex-1' : 'min-h-[calc(100vh-8rem)]',
    );

    return (
        <div
            className={cn(
                'dark:bg-slate-800/50 lg:rounded-lg p-2 md:p-6',
                center && 'container mx-auto max-w-7xl',
                fillHeight && 'flex h-full min-h-0 flex-col',
            )}
        >
            <SEO title="PolyMech Home" />

            {/* Mobile: Sheet for category navigation */}
            {isMobile && (
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetContent side="left" className="w-[280px] p-4">
                        <SheetHeader className="mb-2">
                            <SheetTitle className="text-sm"><T>Categories</T></SheetTitle>
                            <SheetDescription className="sr-only"><T>Browse categories</T></SheetDescription>
                        </SheetHeader>
                        <div className="overflow-y-auto flex-1">
                            <CategoryTreeView onNavigate={closeSheet} filterType="pages" />
                        </div>
                    </SheetContent>
                </Sheet>
            )}

            <div className={cn('md:py-2', fillHeight && 'flex min-h-0 flex-1 flex-col overflow-hidden')}>
                {isMobile ? (
                    /* ---- Mobile layout ---- */
                    <div className={cn('md:hidden', fillHeight && 'flex min-h-0 flex-1 flex-col')}>
                        <div className="flex justify-between items-center px-1 py-2 bg-muted/40 border-b">
                            <div className="flex items-center gap-1">
                                {heading && (() => {
                                    const H = headingLevel || 'h2';
                                    return (
                                        <div className="px-2 py-1">
                                            <H className="font-bold truncate max-w-[120px]">
                                                <Link
                                                    to={headingLinkTo}
                                                    className="block truncate text-inherit hover:underline"
                                                >
                                                    <T>{heading}</T>
                                                </Link>
                                            </H>
                                        </div>
                                    );
                                })()}
                                {showSortBar && (
                                    <ToggleGroup type="single" value={sortBy} onValueChange={handleSortChange}>
                                        <ToggleGroupItem value="latest" aria-label="Latest Posts" size="sm">
                                            <Clock className="h-4 w-4" />
                                        </ToggleGroupItem>
                                        <ToggleGroupItem value="top" aria-label="Top Posts" size="sm">
                                            <TrendingUp className="h-4 w-4" />
                                        </ToggleGroupItem>
                                    </ToggleGroup>
                                )}
                                {showSortBar && (
                                    <ToggleGroup type="single" value={showCategories ? 'categories' : ''} onValueChange={handleCategoriesToggle}>
                                        <ToggleGroupItem value="categories" aria-label="Show Categories" size="sm">
                                            <FolderTree className="h-4 w-4" />
                                        </ToggleGroupItem>
                                    </ToggleGroup>
                                )}
                            </div>
                            
                            {categorySlugs && categorySlugs.length > 0 && (
                                <span className="flex-1 text-center text-sm font-semibold text-foreground/70 truncate px-2 capitalize">
                                    
                                </span>
                            )}
                            
                            <div className="flex items-center gap-1">
                                {showLayoutToggles && (
                                    <ToggleGroup type="single" value={viewMode === 'list' ? 'list' : 'grid'} onValueChange={(v) => v && setViewMode(v as any)}>
                                        <ToggleGroupItem value="grid" aria-label="Card View" size="sm">
                                            <LayoutGrid className="h-4 w-4" />
                                        </ToggleGroupItem>
                                        <ToggleGroupItem value="list" aria-label="List View" size="sm">
                                            <List className="h-4 w-4" />
                                        </ToggleGroupItem>
                                    </ToggleGroup>
                                )}
                                {showSortBar && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative">
                                                <SlidersHorizontal className="h-4 w-4" />
                                                {(contentType || visibilityFilter) && (
                                                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
                                                )}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-44">
                                            <DropdownMenuLabel className="text-xs"><T>Content</T></DropdownMenuLabel>
                                            <DropdownMenuRadioGroup value={contentType || 'all'} onValueChange={(v) => {
                                                if (v === 'all') handleContentTypeChange(undefined);
                                                else handleContentTypeChange(v as 'posts' | 'pages' | 'pictures' | 'files' | 'places');
                                            }}>
                                                <DropdownMenuRadioItem value="all">
                                                    <Layers className="h-4 w-4 mr-2" /><T>All</T>
                                                </DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="posts">
                                                    <ImageIcon className="h-4 w-4 mr-2" /><T>Posts</T>
                                                </DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="pages">
                                                    <FileText className="h-4 w-4 mr-2" /><T>Pages</T>
                                                </DropdownMenuRadioItem>
                                                {searchQuery && (
                                                    <DropdownMenuRadioItem value="places">
                                                        <MapPin className="h-4 w-4 mr-2" /><T>Places</T>
                                                    </DropdownMenuRadioItem>
                                                )}
                                                {isOwnProfile && (
                                                    <DropdownMenuRadioItem value="pictures">
                                                        <Camera className="h-4 w-4 mr-2" /><T>Pictures</T>
                                                    </DropdownMenuRadioItem>
                                                )}
                                                <DropdownMenuRadioItem value="files">
                                                    <FolderTree className="h-4 w-4 mr-2" /><T>Files</T>
                                                </DropdownMenuRadioItem>
                                            </DropdownMenuRadioGroup>
                                            {isOwnProfile && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuLabel className="text-xs"><T>Visibility</T></DropdownMenuLabel>
                                                    <DropdownMenuRadioGroup value={visibilityFilter || ''} onValueChange={handleVisibilityFilterChange}>
                                                        <DropdownMenuRadioItem value="">
                                                            <Layers className="h-4 w-4 mr-2" /><T>All</T>
                                                        </DropdownMenuRadioItem>
                                                        <DropdownMenuRadioItem value="invisible">
                                                            <EyeOff className="h-4 w-4 mr-2" /><T>Invisible</T>
                                                        </DropdownMenuRadioItem>
                                                        <DropdownMenuRadioItem value="private">
                                                            <Lock className="h-4 w-4 mr-2" /><T>Private</T>
                                                        </DropdownMenuRadioItem>
                                                    </DropdownMenuRadioGroup>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>
                        {renderFeed()}
                    </div>
                ) : showCategories ? (
                    /* ---- Desktop with category sidebar ---- */
                    <div
                        className={cn(
                            'hidden md:flex md:flex-col md:min-h-0 overflow-hidden',
                            fillHeight && 'md:flex-1',
                            viewMode === 'list' && listDesktopShellClass,
                        )}
                    >
                        <div className="flex shrink-0 justify-between items-center px-4 mb-4">
                            <div className="flex items-center gap-3">
                                {heading && (() => {
                                    const H = headingLevel || 'h2';
                                    const cls = H === 'h1' ? 'text-2xl' : H === 'h2' ? 'text-xl' : H === 'h3' ? 'text-lg' : 'text-base';
                                    return (
                                        <H className={`${cls} font-bold text-foreground max-w-[50vw] truncate`}>
                                            <Link
                                                to={headingLinkTo}
                                                className="block truncate text-inherit hover:underline"
                                            >
                                                <T>{heading}</T>
                                            </Link>
                                        </H>
                                    );
                                })()}
                                {showSortBar && renderSortBar()}
                            </div>
                            {showLayoutToggles && (
                                <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)}>
                                    <ToggleGroupItem value="grid" aria-label="Grid View">
                                        <LayoutGrid className="h-4 w-4" />
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="large" aria-label="Large View">
                                        <GalleryVerticalEnd className="h-4 w-4" />
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="list" aria-label="List View">
                                        <List className="h-4 w-4" />
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            )}
                        </div>

                        <ResizablePanelGroup direction="horizontal" className={cn(feedPanelGroupClass, 'min-h-0')}>
                            <ResizablePanel
                                defaultSize={sidebarSize}
                                minSize={10}
                                maxSize={25}
                                onResize={handleSidebarResize}
                            >
                                <div className="h-full overflow-y-auto border-r px-2">
                                    <div className="sticky top-0 bg-background/95 backdrop-blur-sm pb-1 pt-1 px-1 border-b mb-1">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"><T>Categories</T></span>
                                    </div>
                                    <CategoryTreeView filterType="pages" />
                                </div>
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={100 - sidebarSize} className={viewMode === 'list' ? 'min-h-0' : undefined}>
                                <div
                                    className={cn(
                                        viewMode === 'list' && 'flex h-full min-h-0 flex-col overflow-hidden',
                                    )}
                                >
                                    {renderFeed()}
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </div>
                ) : (
                    /* ---- Desktop without sidebar ---- */
                    <div
                        className={cn(
                            'hidden md:flex md:flex-col md:min-h-0',
                            fillHeight && 'md:flex-1',
                            viewMode === 'list' && listDesktopShellClass,
                        )}
                    >
                        <div className="flex shrink-0 justify-between items-center px-4 mb-4">
                            <div className="flex items-center gap-3">
                                {heading && (() => {
                                    const H = headingLevel || 'h2';
                                    const cls = H === 'h1' ? 'text-2xl' : H === 'h2' ? 'text-xl' : H === 'h3' ? 'text-lg' : 'text-base';
                                    return (
                                        <H className={`${cls} font-bold text-foreground max-w-[50vw] truncate`}>
                                            <Link
                                                to={headingLinkTo}
                                                className="block truncate text-inherit hover:underline"
                                            >
                                                <T>{heading}</T>
                                            </Link>
                                        </H>
                                    );
                                })()}
                                {showSortBar && renderSortBar()}
                            </div>
                            {showLayoutToggles && (
                                <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)}>
                                    <ToggleGroupItem value="grid" aria-label="Grid View">
                                        <LayoutGrid className="h-4 w-4" />
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="large" aria-label="Large View">
                                        <GalleryVerticalEnd className="h-4 w-4" />
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="list" aria-label="List View">
                                        <List className="h-4 w-4" />
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            )}
                        </div>
                        <div
                            className={cn(
                                (viewMode === 'list' || fillHeight) &&
                                    'flex min-h-0 flex-1 flex-col overflow-hidden',
                            )}
                        >
                            {renderFeed()}
                        </div>
                    </div>
                )}
            </div>
            {showFooter && <Footer />}
        </div>
    );
};

export default HomeWidget;
