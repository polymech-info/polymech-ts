import { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getCurrentLang } from "@/i18n";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { T, translate } from "@/i18n";
import { apiClient } from "@/lib/db";
import { mergePageVariables } from "@/lib/page-variables";
import { useAppStore } from "@/store/appStore";

import { GenericCanvas } from "@/modules/layout/GenericCanvas";
import { useLayout, LayoutProvider } from "@/modules/layout/LayoutContext";

import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

import MarkdownRenderer from "@/components/MarkdownRenderer";

import { Sidebar } from "@/components/sidebar/Sidebar";
import { TableOfContents } from "@/components/sidebar/TableOfContents";
import { MobileTOC } from "@/components/sidebar/MobileTOC";
import { extractHeadings, extractHeadingsFromLayout, MarkdownHeading } from "@/lib/toc";

import { UserPageTopBar } from "./UserPageTopBar";
import { UserPageDetails } from "./editor/UserPageDetails";

import { SEO } from "@/components/SEO";
import { useAppConfig } from '@/hooks/useSystemInfo';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';

const UserPageEdit = lazy(() => import("./editor/UserPageEdit"));

import { Page, UserProfile } from "./types";
import { fetchUserPage, createPage } from "./client-pages";

const MYSPACE_TEMPLATE_CONTENT = {
  pages: {
    "page-PLACEHOLDER": {
      updatedAt: Date.now(),
      containers: [
        {
          id: `container-${Date.now()}-tpl`,
          gap: 16,
          type: "container",
          order: 0,
          columns: 1,
          widgets: [
            {
              id: `widget-${Date.now()}-tpl`,
              order: 0,
              props: {
                sortBy: "latest",
                userId: "",
                viewMode: "grid",
                variables: {},
                showFooter: true,
                showSortBar: true,
                categorySlugs: "",
                showCategories: false,
              },
              widgetId: "home",
            },
          ],
          children: [],
        },
      ],
    },
  },
  version: "1.0.0",
  lastUpdated: Date.now(),
  containers: [],
};

type UserPagePreset = 'home';

interface UserPageProps {
  userId?: string;
  slug?: string;
  embedded?: boolean;
  initialPage?: Page;
  DetailsComponent?: React.ComponentType<any>;
  ActionsComponent?: React.ComponentType<any>;
  showSidebar?: boolean;
  initialEditMode?: boolean;
  preset?: UserPagePreset;
}

const UserPageContent = ({ userId: propUserId, slug: propSlug, embedded = false, initialPage, DetailsComponent = UserPageDetails, ActionsComponent, showSidebar = true, initialEditMode = false, preset }: UserPageProps) => {
  const { userId: paramUserId, username: paramUsername, slug: paramSlug, orgSlug } = useParams<{ userId: string; username: string; slug: string; orgSlug?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: currentUser, roles } = useAuth();
  const { getLoadedPageLayout, loadPageLayout, hydratePageLayout } = useLayout();
  const appConfig = useAppConfig();
  const srcLang = appConfig?.i18n?.source_language || 'en';

  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

  const setShowGlobalFooter = useAppStore(state => state.setShowGlobalFooter);

  // Determine effective userId - either from prop, existing param, or resolved from username
  const userId = propUserId || paramUserId || resolvedUserId;

  const [page, setPage] = useState<Page | null>(initialPage || null);
  const [originalPage, setOriginalPage] = useState<Page | null>(initialPage || null);
  const [childPages, setChildPages] = useState<{ id: string; title: string; slug: string }[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine if edit mode was requested via prop or URL query param
  const editRequested = initialEditMode || searchParams.get('edit') === 'true';
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Scroll restoration — use URL params (instantly available) not async-resolved userId
  const scrollKey = `userpage-${paramUsername || propUserId || 'anon'}-${propSlug || paramSlug || 'home'}`;
  useScrollRestoration(scrollKey);

  // TOC State
  const [headings, setHeadings] = useState<MarkdownHeading[]>([]);

  const contextVariables = useMemo(() => {
    if (!page) return {};
    // We attempt to read userVariables from page or extra props if available.
    // Ideally we need userVariables from the server response.
    const userVars = (page as any).userVariables || {};
    const merged = mergePageVariables(page, userVars);
    return merged;
  }, [page]);

  const showToc = contextVariables['showToc'] !== 'false' && contextVariables['showToc'] !== false;
  const showLastUpdated = contextVariables['showLastUpdated'] !== 'false' && contextVariables['showLastUpdated'] !== false;

  // Custom logic to hide the global app footer if `showFooter` is false in page variables
  const showFooter = contextVariables['showFooter'] !== 'false' && contextVariables['showFooter'] !== false;

  const hasTocContent = headings.length > 0 && showToc;

  useEffect(() => {
    setShowGlobalFooter(showFooter);
    return () => {
      // Always restore global footer on unmount
      setShowGlobalFooter(true);
    };
  }, [showFooter, setShowGlobalFooter]);

  // Auto-open sidebar when TOC headings exist (non-embedded only); collapse when empty
  useEffect(() => {
    if (headings.length > 5 && !embedded) {
      setIsSidebarCollapsed(false);
    } else if (headings.length === 0 || contextVariables['showToc'] === false || contextVariables['showToc'] === 'false') {
      setIsSidebarCollapsed(true);
    }
  }, [headings.length, embedded, contextVariables]);

  const isOwner = currentUser?.id === userId || roles.includes('admin');

  useEffect(() => {
    if (initialPage) {
      setLoading(false);
      return;
    }

    // Determine effective identifier
    const identifier = propUserId || paramUserId || paramUsername;
    const effectiveSlug = propSlug || paramSlug;

    if (identifier && effectiveSlug) {
      fetchUserPageData(identifier, effectiveSlug);
    }
  }, [propUserId, paramUserId, paramUsername, propSlug, paramSlug, initialPage]);

  const fetchUserPageData = async (id: string, slugStr: string) => {
    setLoading(true);
    try {
      const data = await fetchUserPage(id, slugStr);

      if (data) {
        setPage(data.page);
        setUserProfile(data.userProfile as any);
        setChildPages(data.childPages || []);

        // If a non-English lang is active, the response has translated content.
        // Fetch original (no lang) for the editor to avoid saving translations as source.
        const lang = getCurrentLang();
        if (lang && lang !== srcLang) {
          try {
            const orig = await apiClient<any>(`/api/user-page/${id}/${slugStr}`);
            setOriginalPage(orig.page);
          } catch {
            setOriginalPage(data.page); // fallback
          }
        } else {
          setOriginalPage(data.page);
        }

        if (!resolvedUserId && data.page.owner) {
          setResolvedUserId(data.page.owner);
        }

        // Auto-enter edit mode if requested via prop or query param
        if (editRequested && (currentUser?.id === data.page.owner || roles.includes('admin'))) {
          setIsEditMode(true);
        }
      } else if (editRequested && (slugStr === 'myspace' || slugStr === 'home') && currentUser?.id) {
        // Auto-create myspace or home page for the owner
        // For 'home' slug, require admin role
        if (slugStr === 'home' && !roles.includes('admin')) {
          toast.error(translate('Only admins can create the site home page'));
          navigate('/');
          return;
        }
        try {
          const pageId = crypto.randomUUID();
          const templateContent = JSON.parse(JSON.stringify(MYSPACE_TEMPLATE_CONTENT));
          // Replace placeholder key with actual page ID
          const placeholderKey = Object.keys(templateContent.pages)[0];
          templateContent.pages[`page-${pageId}`] = templateContent.pages[placeholderKey];
          delete templateContent.pages[placeholderKey];

          // Customize widget props per slug
          const pageData = templateContent.pages[`page-${pageId}`];
          for (const container of pageData.containers || []) {
            for (const widget of container.widgets || []) {
              if (widget.widgetId === 'home' && widget.props) {
                if (slugStr === 'myspace') {
                  widget.props.userId = currentUser.id;
                }
                if (slugStr === 'home') {
                  widget.props.showFooter = false;
                }
              }
            }
          }

          const newPage = await createPage({
            id: pageId,
            title: slugStr === 'home' ? 'Home' : 'My Space',
            slug: slugStr,
            owner: currentUser.id,
            visible: slugStr === 'home' ? true : false,
            is_public: true,
            content: templateContent,
          });
          if (newPage) {
            setPage(newPage);
            setOriginalPage(newPage);
            setResolvedUserId(currentUser.id);
            setIsEditMode(true);
          }
        } catch (err) {
          console.error('Error auto-creating myspace page:', err);
          toast.error(translate('Failed to create profile page'));
          navigate(orgSlug ? `/org/${orgSlug}/user/${id}` : `/user/${id}`);
        }
      } else {
        toast.error(translate('Page not found or you do not have access'));
        navigate(orgSlug ? `/org/${orgSlug}/user/${id}` : `/user/${id}`);
      }
    } catch (error) {
      console.error('Error fetching user page:', error);
      toast.error(translate('Failed to load page'));
    } finally {
      setLoading(false);
    }
  };

  // Reactive Heading Extraction
  // This ensures we extract headings whenever the page loads OR when specific layouts are loaded into context
  const { loadedPages } = useLayout();

  useEffect(() => {
    if (!page) return;

    if (typeof page.content === 'string') {
      const extracted = extractHeadings(page.content);
      setHeadings(extracted);
    } else {
      const pageId = `page-${page.id}`;
      // Try to get from context
      let layout = getLoadedPageLayout(pageId);

      if (!layout && page.content) {
        // page.content could be a PageLayout directly or a RootLayoutData wrapper
        const content = page.content as any;
        let resolved = null;
        if (content.id && content.containers) {
          // Direct PageLayout
          resolved = content;
        } else if (content.pages && content.pages[pageId]) {
          // RootLayoutData wrapper
          resolved = content.pages[pageId];
        }
        if (resolved) {
          hydratePageLayout(pageId, resolved);
        }
        // Effect will re-run when loadedPages updates
      } else if (layout) {
        const extracted = extractHeadingsFromLayout(layout);
        setHeadings(extracted);
      }
    }
  }, [page, loadedPages]); // Re-run when page set or any layout loads

  // Re-hydrate layout context when switching between edit and view modes.
  // Edit mode must use original (English) content so saves don't overwrite source with translations.
  // View mode uses (potentially translated) page content.
  useEffect(() => {
    if (!page) return;
    const lang = getCurrentLang();
    if (!lang || lang === srcLang) return; // No translation active, nothing to swap

    const pageLayoutId = `page-${page.id}`;
    const source = isEditMode ? originalPage : page;
    if (!source?.content || typeof source.content === 'string') return;

    const content = source.content as any;
    let resolved = null;
    if (content.id && content.containers) {
      resolved = content;
    } else if (content.pages && content.pages[pageLayoutId]) {
      resolved = content.pages[pageLayoutId];
    }
    if (resolved) {
      hydratePageLayout(pageLayoutId, resolved);
    }
  }, [isEditMode]);



  // Actions now handled by PageActions component
  const handlePageUpdate = (updatedPage: Page) => {
    // If parent changed or critical metadata changed, strictly we should re-fetch to get enriched data
    // But for responsiveness we can update local state.
    // If parent changed, we don't have the new parent's title/slug unless we fetch it.
    // So if parent ID changed, we should probably re-fetch the whole page data from server.

    if (updatedPage.parent !== page?.parent && !isEditMode) {
      // Re-fetch everything to get correct parent details
      if (userId && updatedPage.slug) {
        fetchUserPageData(userId, updatedPage.slug);
      }
    } else {
      setPage(updatedPage);
      // Keep originalPage in sync so the editor (which receives originalPage || page) sees changes.
      // Preserve original English content — only update metadata (title, categories, meta, etc.)
      if (isEditMode) {
        setOriginalPage(prev => prev ? { ...prev, ...updatedPage, content: prev.content } : updatedPage);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground"><T>Loading page...</T></div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-4"><T>Page not found</T></div>
          <Link to={orgSlug ? `/org/${orgSlug}/user/${userId}` : `/user/${userId}`}>
            <Button><T>Back to Profile</T></Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isEditMode && isOwner) {
    return (
      <Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><T>Loading Editor...</T></div>}>
        <UserPageEdit
          page={originalPage || page}
          userProfile={userProfile}
          isOwner={isOwner}
          userId={userId || ''}
          orgSlug={orgSlug}
          headings={headings}
          childPages={childPages}
          onExitEditMode={() => {
            setIsEditMode(false);
            const sp = new URLSearchParams(searchParams);
            sp.delete('edit');
            navigate({ search: sp.toString() }, { replace: true });
          }}
          onPageUpdate={handlePageUpdate}
          contextVariables={contextVariables}
        />
      </Suspense>
    );
  }

  return (
    <div className={`${embedded ? 'h-full overflow-hidden' : 'flex-1 min-h-0'} bg-background flex flex-col`}>
      {/* SEO Metadata */}
      {page && (
        <SEO
          title={page.title}
          description={page.meta?.description || `View ${page.title} on Polymech`}
          image={page.meta?.ogImage} // Assuming meta might have ogImage
        />
      )}

      {/* Top Header (Back button) or Ribbon Bar - Fixed if not embedded */}
      {!embedded && (
        <UserPageTopBar
          embedded={embedded}
          orgSlug={orgSlug}
          userId={userId || ''}
          isOwner={isOwner}
        />
      )}

      {/* Main Split Layout */}
      <div className="flex-1 flex min-h-0">

        {/* Sidebar Left - Fixed width, sticky TOC */}
        {showSidebar && (hasTocContent || childPages.length > 0) && (
          <Sidebar className={`${isSidebarCollapsed ? 'w-12' : 'w-[300px]'} border-r bg-background/50 hidden lg:block self-start sticky top-0 max-h-screen overflow-y-auto shrink-0 transition-all duration-300`}>
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-end'} p-2 bg-background/50 z-10`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
            </div>
            {!isSidebarCollapsed && (
              <div className="pb-4 scrollbar-custom">
                {/* Child Pages List */}
                {childPages.length > 0 && (
                  <div className="px-4 py-2 border-b mb-2">
                    <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider text-xs"><T>Child Pages</T></h3>
                    <div className="flex flex-col gap-1">
                      {childPages.map(child => (
                        <Link
                          key={child.id}
                          to={orgSlug ? `/org/${orgSlug}/user/${userId}/pages/${child.slug}` : `/user/${userId}/pages/${child.slug}`}
                          className="text-sm py-1 px-2 rounded hover:bg-muted truncate block text-foreground/80 hover:text-primary transition-colors"
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Table of Contents */}
                {preset !== 'home' && hasTocContent && (
                  <TableOfContents
                    headings={headings}
                    minHeadingLevel={2}
                    title=""
                    className="border-t-0 pt-2 px-4"
                  />
                )}
              </div>
            )}
          </Sidebar>
        )}

        {/* Right Content - Independent scroll */}
        <ResizablePanelGroup direction="horizontal" className="flex-1 h-full min-w-0">
          <ResizablePanel defaultSize={100} minSize={30} order={1}>
            <div className="h-full overflow-y-auto scrollbar-custom ">
              <div className={preset === 'home' ? '' : 'px-2 md:p-8'}>
                {/* Mobile TOC */}
                {preset !== 'home' && hasTocContent && (
                  <div className="lg:hidden">
                    <MobileTOC headings={headings} />
                  </div>
                )}

                <DetailsComponent
                  page={page}
                  userProfile={userProfile}
                  isOwner={isOwner}
                  isEditMode={isEditMode}
                  embedded={embedded}
                  userId={userId || ''} // Fallback if undefined, though it should be defined if loaded
                  orgSlug={orgSlug}
                  onPageUpdate={handlePageUpdate}
                  onToggleEditMode={() => setIsEditMode(!isEditMode)}
                  onWidgetRename={() => { }}
                  contextVariables={contextVariables}
                  {...(ActionsComponent ? { ActionsComponent } : {})}
                />

                {/* Content Body */}
                <div className="">
                  {page.content && typeof page.content === 'string' ? (
                    <div className="prose prose-lg dark:prose-invert max-w-none pb-12">
                      <MarkdownRenderer content={page.content} variables={contextVariables} />
                    </div>
                  ) : (
                    <GenericCanvas
                      pageId={`page-${page.id}`}
                      pageName={page.title}
                      isEditMode={false}
                      showControls={false}
                      initialLayout={page.content}
                      selectedWidgetId={null}
                      onSelectWidget={() => { }}
                      contextVariables={contextVariables}
                      pageContext={{
                        title: page.title,
                        slug: page.slug,
                        meta: page.meta,
                        content: page.content,
                        categories: page.categories,
                        category_paths: page.category_paths,
                        tags: page.tags
                      }}
                    />
                  )}
                </div>

                {/* Footer — skip for home preset (App.tsx renders global footer) */}
                {preset !== 'home' && showLastUpdated && (
                  <div className="mt-8 pt-8 border-t text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <div>
                        <T>Last updated:</T> {new Date(page.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {page.parent && (
                        <Link
                          to={`/user/${userId}/pages/${page.parent}`}
                          className="text-primary hover:underline"
                        >
                          <T>View parent page</T>
                        </Link>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div >
  );
};

const UserPage = (props: UserPageProps) => (
  <LayoutProvider>
    <UserPageContent {...props} />
  </LayoutProvider>
);

export default UserPage;
