import PhotoGrid from "@/components/PhotoGrid";
import GalleryLarge from "@/components/GalleryLarge";
import MobileFeed from "@/components/feed/MobileFeed";
import { useMediaRefresh } from "@/contexts/MediaRefreshContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, GalleryVerticalEnd, TrendingUp, Clock, List, FolderTree } from "lucide-react";
import { ListLayout } from "@/components/ListLayout";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { FeedSortOption } from "@/hooks/useFeedData";
import { SEO } from "@/components/SEO";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import CategoryTreeView from "@/components/CategoryTreeView";
import { fetchUserPage } from "@/modules/pages/client-pages";

const UserPage = lazy(() => import("@/modules/pages/UserPage"));

import { T } from "@/i18n";

const SIDEBAR_KEY = 'categorySidebarSize';
const DEFAULT_SIDEBAR = 15;

// A no-op component to suppress the default UserPageDetails header when embedded
const EmptyDetails = () => null;

const Index = () => {
  const params = useParams();
  const wildcardPath = params['*']; // e.g. "software/kb-cassandra"
  const pathSegments = wildcardPath ? wildcardPath.split('/').filter(Boolean) : [];
  const slug = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : undefined;
  const location = useLocation();
  const navigate = useNavigate();

  // Derive mode from URL pathname
  const pathname = location.pathname;
  const isTopRoute = pathname === '/top';
  const isCategoriesRoute = pathname === '/categories' || pathname.startsWith('/categories/');

  const sortBy: FeedSortOption = isTopRoute ? 'top' : 'latest';
  const showCategories = isCategoriesRoute;
  const categorySlugs = slug ? [slug] : undefined;

  // Derive content type from URL
  const isPostsRoute = pathname === '/posts';
  const isPagesRoute = pathname === '/pages';
  const contentType: 'posts' | 'pages' | undefined = isPostsRoute ? 'posts' : isPagesRoute ? 'pages' : undefined;

  const { refreshKey } = useMediaRefresh();
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'grid' | 'large' | 'list'>(() => {
    return (localStorage.getItem('feedViewMode') as 'grid' | 'large' | 'list') || 'grid';
  });

  // Site home page state (undefined = loading, null = not found, object = found)
  const [siteHomePage, setSiteHomePage] = useState<any | null | undefined>(() => {
    // Check for server-injected data first
    // console.log('index.tsx : window.__INITIAL_STATE__', window.__INITIAL_STATE__);
    const injected = window.__INITIAL_STATE__?.siteHomePage;
    if (injected) {
      window.__INITIAL_STATE__!.siteHomePage = undefined; // consume once
      return injected.page || null;
    }
    return undefined; // signals "loading" → trigger API fetch
  });

  useEffect(() => {
    if (siteHomePage !== undefined) return; // already resolved (from SSR or previous fetch)
    fetchUserPage('_site', 'home')
      .then(data => setSiteHomePage(data?.page || null))
      .catch(() => setSiteHomePage(null));
  }, [siteHomePage]);

  useEffect(() => {
    localStorage.setItem('feedViewMode', viewMode);
  }, [viewMode]);

  // Mobile sheet state — only opened by explicit user tap, never by route effects
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

  // Navigation helpers — toggles navigate to URLs
  const handleSortChange = useCallback((value: string) => {
    if (!value) return;
    if (value === 'latest') navigate('/latest');
    else if (value === 'top') navigate('/top');
    else if (value === 'categories') navigate('/categories');
  }, [navigate]);

  const handleCategoriesToggle = useCallback(() => {
    if (isCategoriesRoute) {
      navigate('/latest');
    } else {
      navigate('/categories');
      // On mobile, open the category sheet directly from the user's tap
      if (isMobile) setSheetOpen(true);
    }
  }, [isCategoriesRoute, isMobile, navigate]);

  const renderCategoryBreadcrumb = () => {
    if (pathSegments.length === 0) return null;

    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <FolderTree className="h-4 w-4 shrink-0" />
        {pathSegments.map((segment, i) => {
          const href = '/categories/' + pathSegments.slice(0, i + 1).join('/');
          const isLast = i === pathSegments.length - 1;
          return (
            <span key={href} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-muted-foreground/50">/</span>}
              <a
                href={href}
                className={cn(
                  "hover:text-primary transition-colors hover:underline capitalize",
                  isLast && "text-foreground font-medium"
                )}
              >
                {segment.replace(/-/g, ' ')}
              </a>
            </span>
          );
        })}
      </div>
    );
  };

  // Determine which sort toggle is active
  const activeSortValue = isTopRoute ? 'top' : isCategoriesRoute ? '' : 'latest';

  // --- Shared sort + categories toggle bar ---
  const renderSortBar = (options?: { size?: 'sm'; iconsOnly?: boolean }) => {
    const { size, iconsOnly } = options ?? {};
    const iconCls = iconsOnly ? "h-4 w-4" : "h-4 w-4 mr-2";
    return (
      <>
        <ToggleGroup type="single" value={activeSortValue} onValueChange={handleSortChange}>
          <ToggleGroupItem value="latest" aria-label="Latest Posts" size={size}>
            <Clock className={iconCls} />
            {!iconsOnly && <T>Latest</T>}
          </ToggleGroupItem>
          <ToggleGroupItem value="top" aria-label="Top Posts" size={size}>
            <TrendingUp className={iconCls} />
            {!iconsOnly && <T>Top</T>}
          </ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup type="single" value={showCategories ? 'categories' : ''} onValueChange={handleCategoriesToggle}>
          <ToggleGroupItem value="categories" aria-label="Show Categories" size={size}>
            <FolderTree className={iconCls} />
            {!iconsOnly && <T>Categories</T>}
          </ToggleGroupItem>
        </ToggleGroup>
        {renderCategoryBreadcrumb()}
      </>
    );
  };

  // --- Feed views ---
  const renderFeed = () => {
    if (isMobile) {
      return viewMode === 'list' ? (
        <ListLayout key={refreshKey} sortBy={sortBy} navigationSource="home" categorySlugs={categorySlugs} contentType={contentType} />
      ) : (
        <MobileFeed source="home" sortBy={sortBy} categorySlugs={categorySlugs} contentType={contentType} onNavigate={(id) => window.location.href = `/post/${id}`} />
      );
    }

    if (viewMode === 'grid') {
      return <PhotoGrid key={refreshKey} sortBy={sortBy} showVideos={true} categorySlugs={categorySlugs} contentType={contentType} />;
    } else if (viewMode === 'large') {
      return <GalleryLarge key={refreshKey} sortBy={sortBy} categorySlugs={categorySlugs} contentType={contentType} />;
    }
    return <ListLayout key={refreshKey} sortBy={sortBy} categorySlugs={categorySlugs} contentType={contentType} />;
  };

  // If a custom site home page exists and we're on the root route (not /top, /categories, etc.), show it
  const isRootRoute = pathname === '/' || pathname === '/latest';
  const showCustomHomePage = isRootRoute && siteHomePage && !contentType;

  if (showCustomHomePage) {
    return (
      <div className="bg-background">
        <SEO title="PolyMech Home" />
        <Suspense fallback={<div className="flex items-center justify-center h-64"><T>Loading...</T></div>}>
          <UserPage
            userId={siteHomePage.owner}
            slug="home"
            embedded
            initialPage={siteHomePage}
            showSidebar={false}
            DetailsComponent={EmptyDetails}
            preset="home"
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="bg-background">
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

      <div className="md:py-2">
        {isMobile ? (
          /* ---- Mobile layout ---- */
          <div className="md:hidden">
            <div className="flex justify-between items-center px-1 py-2 bg-muted/40 border-b">
              <div className="flex items-center gap-2">
                {renderSortBar({ size: 'sm', iconsOnly: true })}
              </div>
              <ToggleGroup type="single" value={viewMode === 'list' ? 'list' : 'grid'} onValueChange={(v) => v && setViewMode(v as any)}>
                <ToggleGroupItem value="grid" aria-label="Card View" size="sm">
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List View" size="sm">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            {renderFeed()}
          </div>
        ) : showCategories ? (
          /* ---- Desktop with category sidebar ---- */
          <div
            className={cn(
              'hidden md:flex md:flex-col md:min-h-0 overflow-hidden',
              viewMode === 'list' && 'h-[calc(100vh-8rem)] min-h-0',
            )}
          >
            <div className="flex shrink-0 justify-between px-4 mb-4">
              <div className="flex items-center gap-3">
                {renderSortBar()}
              </div>
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
            </div>

            <ResizablePanelGroup
              direction="horizontal"
              className={cn(
                'min-h-0 flex flex-col overflow-hidden',
                viewMode === 'list' ? 'min-h-0 flex-1' : 'min-h-[calc(100vh-8rem)]',
              )}
            >
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
                <div className={cn(viewMode === 'list' && 'flex h-full min-h-0 flex-col overflow-hidden')}>
                  {renderFeed()}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        ) : (
          /* ---- Desktop without sidebar ---- */
          <div
            className={cn(
              'hidden md:flex md:flex-col md:min-h-0 overflow-hidden',
              viewMode === 'list' && 'h-[calc(100vh-8rem)] min-h-0 flex flex-col',
            )}
          >
            <div className="flex shrink-0 justify-between px-4 mb-4">
              <div className="flex items-center gap-3">
                {renderSortBar()}
              </div>
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
            </div>
            <div className={cn(viewMode === 'list' && 'flex min-h-0 flex-1 flex-col overflow-hidden')}>
              {renderFeed()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
