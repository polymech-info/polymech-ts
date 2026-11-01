import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AuthProvider as OidcProvider } from "react-oidc-context";
import { userManager } from "@/lib/oidc";

import { LogProvider } from "@/contexts/LogContext";

import { MediaRefreshProvider } from "@/contexts/MediaRefreshContext";
import { ProfilesProvider } from "@/contexts/ProfilesContext";
//import { WebSocketProvider } from "@/contexts/WS_Socket";
import { registerAllWidgets } from "@/lib/registerWidgets";
import TopNavigation from "@/components/TopNavigation";
import Footer from "@/components/Footer";
import { DragDropProvider } from "@/contexts/DragDropContext";
import { useAppStore } from "@/store/appStore";

const GlobalDragDrop = React.lazy(() => import("@/components/GlobalDragDrop"));
// Register all widgets on app boot
registerAllWidgets();

import Index from "./pages/Index";
import AuthZ from "./pages/AuthZ";

const UpdatePassword = React.lazy(() => import("./pages/UpdatePassword"));

import Profile from "./modules/profile/Profile";
const Post = React.lazy(() => import("./modules/posts/PostPage"));

import UserProfile from "./pages/UserProfile";
import TagPage from "./pages/TagPage";
import SearchResults from "./pages/SearchResults";

const LogsPage = React.lazy(() => import("./components/logging/LogsPage"));
const Wizard = React.lazy(() => import("./pages/Wizard"));
const ProviderSettings = React.lazy(() => import("./pages/ProviderSettings"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const AdminPage = React.lazy(() => import("./pages/AdminPage"));

const enablePlaygrounds = import.meta.env.VITE_ENABLE_PLAYGROUNDS === 'true';

let PlaygroundEditor: any;
let PlaygroundEditorLLM: any;
let VideoPlayerPlaygroundIntern: any;
let PlaygroundImages: any;
let PlaygroundImageEditor: any;
let VideoGenPlayground: any;
let TypesPlayground: any;
let VariablePlayground: any;
let I18nPlayground: any;
let PlaygroundChat: any;
let PlaygroundVfs: any;
let PlaygroundAuth: any;
let GridSearch: any;
let LocationDetail: any;
let Tetris: any;

let FileBrowser: any;
let SupportChat: any;

GridSearch = React.lazy(() => import("./modules/places/gridsearch/GridSearch"));
LocationDetail = React.lazy(() => import("./modules/places/LocationDetail"));
TypesPlayground = React.lazy(() => import("@/modules/types/TypesPlayground"));
PlaygroundAuth = React.lazy(() => import("./playground/auth"));

if (enablePlaygrounds) {
  PlaygroundEditor = React.lazy(() => import("./pages/PlaygroundEditor"));
  PlaygroundEditorLLM = React.lazy(() => import("./pages/PlaygroundEditorLLM"));
  VideoPlayerPlaygroundIntern = React.lazy(() => import("./pages/VideoPlayerPlaygroundIntern"));
  PlaygroundImages = React.lazy(() => import("./pages/PlaygroundImages"));
  PlaygroundImageEditor = React.lazy(() => import("./pages/PlaygroundImageEditor"));
  VideoGenPlayground = React.lazy(() => import("./pages/VideoGenPlayground"));
  VariablePlayground = React.lazy(() => import("./components/variables/VariablesEditor").then(module => ({ default: module.VariablesEditor })));
  I18nPlayground = React.lazy(() => import("./components/playground/I18nPlayground"));
  PlaygroundChat = React.lazy(() => import("./pages/PlaygroundChat"));
  PlaygroundVfs = React.lazy(() => import("./pages/PlaygroundVfs"));  
  SupportChat = React.lazy(() => import("./pages/SupportChat"));
}


Tetris = React.lazy(() => import("./apps/tetris/Tetris"));
FileBrowser = React.lazy(() => import("./modules/storage/FileBrowser"));

const VersionMap = React.lazy(() => import("./pages/VersionMap"));
/*
const UserCollections = React.lazy(() => import("./pages/UserCollections"));
const Collections = React.lazy(() => import("./pages/Collections"));
const NewCollection = React.lazy(() => import("./pages/NewCollection"));
<Route path="/user/:userId/collections" element={<React.Suspense fallback={<div>Loading...</div>}><UserCollections /></React.Suspense>} />
<Route path="/collections/new" element={<React.Suspense fallback={<div>Loading...</div>}><NewCollection /></React.Suspense>} />
<Route path="/collections/:userId/:slug" element={<React.Suspense fallback={<div>Loading...</div>}><Collections /></React.Suspense>} />
*/
const UserPage = React.lazy(() => import("./modules/pages/UserPage"));
const NewPage = React.lazy(() => import("./modules/pages/NewPage"));
const NewPost = React.lazy(() => import("./modules/posts/NewPost"));
const EditPost = React.lazy(() => import("./modules/posts/EditPost"));

// <GlobalDebug />
import { EcommerceBundleWrapper } from "./bundles/ecommerce";

// Create a single tracker instance outside the component to avoid re-creation on re-renders
/*
const tracker = new Tracker({
  projectKey: import.meta.env.VITE_OPENREPLAY_KEY || 'wiN7QPfX48YLyozADQmW',
  respectDoNotTrack: false,
  __DISABLE_SECURE_MODE: true,
});
tracker.use(trackerAssist());
*/

const AppWrapper = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isPageEditor = location.pathname.includes('/pages/') && searchParams.get('edit') === 'true';
  const isFullScreenPage = location.pathname.startsWith('/video-feed') || isPageEditor;

  const isFileBrowserShellRoute =
    location.pathname.startsWith('/app/filebrowser') ||
    location.pathname.startsWith('/playground/vfs');
  const fileBrowserImmersive = useAppStore((s) => s.fileBrowserImmersive);
  const setFileBrowserImmersive = useAppStore((s) => s.setFileBrowserImmersive);

  React.useEffect(() => {
    if (!isFileBrowserShellRoute) setFileBrowserImmersive(false);
  }, [location.pathname, isFileBrowserShellRoute, setFileBrowserImmersive]);

  const hideAppChrome =
    isFullScreenPage || (fileBrowserImmersive && isFileBrowserShellRoute);

  const containerClassName = hideAppChrome
    ? "flex flex-col min-h-svh transition-colors duration-200 h-full"
    : "mx-auto max-w-[1400px] flex flex-col min-h-svh transition-colors duration-200 h-full";

  const { showGlobalFooter } = useAppStore();

  const ecommerce = import.meta.env.VITE_ENABLE_ECOMMERCE === 'true';
  return (
    <div className={containerClassName}>
      {!hideAppChrome && <TopNavigation />}
      <React.Suspense fallback={null}><GlobalDragDrop /></React.Suspense>
      <main className={hideAppChrome ? "flex-1 flex flex-col min-h-0 overflow-hidden" : "flex-1"}>
        <Routes>
          {/* Top-level routes (no organization context) */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthZ />} />
          <Route path="/authz" element={<AuthZ />} />
          <Route path="/auth/update-password" element={<React.Suspense fallback={<div>Loading...</div>}><UpdatePassword /></React.Suspense>} />
          <Route path="/profile/*" element={<Profile />} />
          <Route path="/post/new" element={<React.Suspense fallback={<div>Loading...</div>}><EditPost /></React.Suspense>} />
          <Route path="/post/:id" element={<React.Suspense fallback={<div>Loading...</div>}><Post /></React.Suspense>} />
          <Route path="/post/:id/edit" element={<React.Suspense fallback={<div>Loading...</div>}><EditPost /></React.Suspense>} />
          <Route path="/video/:id" element={<React.Suspense fallback={<div>Loading...</div>}><Post /></React.Suspense>} />
          <Route path="/user/:userId" element={<UserProfile />} />
          <Route path="/user/:userId/posts" element={<UserProfile />} />
          <Route path="/user/:userId/pages" element={<UserProfile />} />
          <Route path="/user/:userId/pictures" element={<UserProfile />} />
          <Route path="/user/:userId/pages/new" element={<React.Suspense fallback={<div>Loading...</div>}><NewPage /></React.Suspense>} />
          <Route path="/user/:username/pages/:slug" element={<React.Suspense fallback={<div>Loading...</div>}><UserPage /></React.Suspense>} />
          <Route path="/tags/:tag" element={<TagPage />} />
          <Route path="/latest" element={<Index />} />
          <Route path="/top" element={<Index />} />
          <Route path="/posts" element={<Index />} />
          <Route path="/pages" element={<Index />} />
          <Route path="/categories" element={<Index />} />
          <Route path="/categories/*" element={<Index />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/wizard" element={<React.Suspense fallback={<div>Loading...</div>}><Wizard /></React.Suspense>} />
          <Route path="/new" element={<React.Suspense fallback={<div>Loading...</div>}><NewPost /></React.Suspense>} />
          <Route path="/version-map/:id" element={
            <React.Suspense fallback={<div className="flex items-center justify-center h-screen">Loading map...</div>}>
              <VersionMap />
            </React.Suspense>
          } />
          <Route path="/settings/providers" element={<React.Suspense fallback={<div>Loading...</div>}><ProviderSettings /></React.Suspense>} />

          {enablePlaygrounds && (
            <>
              <Route path="/playground/editor" element={<React.Suspense fallback={<div>Loading...</div>}><PlaygroundEditor /></React.Suspense>} />
              <Route path="/playground/editor-llm" element={<React.Suspense fallback={<div>Loading...</div>}><PlaygroundEditorLLM /></React.Suspense>} />
              <Route path="/playground-video-player-intern" element={<React.Suspense fallback={<div>Loading...</div>}><VideoPlayerPlaygroundIntern /></React.Suspense>} />
            </>
          )}

          {/* Admin Routes */}
          <Route path="/admin/*" element={<React.Suspense fallback={<div>Loading...</div>}><AdminPage /></React.Suspense>} />

          <Route path="/products/gridsearch" element={<React.Suspense fallback={<div>Loading...</div>}><GridSearch /></React.Suspense>} />
          <Route path="/products/places/detail/:place_id" element={<React.Suspense fallback={<div>Loading...</div>}><LocationDetail /></React.Suspense>} />
          <Route path="/types-editor" element={<React.Suspense fallback={<div>Loading...</div>}><TypesPlayground /></React.Suspense>} />

          {/* Playground Routes */}
          {enablePlaygrounds && (
            <>
              <Route path="/playground/images" element={<React.Suspense fallback={<div>Loading...</div>}><PlaygroundImages /></React.Suspense>} />
              <Route path="/playground/image-editor" element={<React.Suspense fallback={<div>Loading...</div>}><PlaygroundImageEditor /></React.Suspense>} />
              <Route path="/playground/video-generator" element={<React.Suspense fallback={<div>Loading...</div>}><VideoGenPlayground /></React.Suspense>} />
              <Route path="/variables-editor" element={<React.Suspense fallback={<div>Loading...</div>}><VariablePlayground /></React.Suspense>} />
              <Route path="/playground/i18n" element={<React.Suspense fallback={<div>Loading...</div>}><I18nPlayground /></React.Suspense>} />
              <Route path="/playground/chat" element={<React.Suspense fallback={<div>Loading...</div>}><PlaygroundChat /></React.Suspense>} />
              <Route path="/playground/vfs" element={<React.Suspense fallback={<div>Loading...</div>}><PlaygroundVfs /></React.Suspense>} />
            </>
          )}

          {enablePlaygrounds && <Route path="/support-chat" element={<React.Suspense fallback={<div>Loading...</div>}><SupportChat /></React.Suspense>} />}

          <Route path="/playground/auth" element={<React.Suspense fallback={<div>Loading...</div>}><PlaygroundAuth /></React.Suspense>} />
          
          {/* Logs */}
          <Route path="/logs" element={<React.Suspense fallback={<div>Loading...</div>}><LogsPage /></React.Suspense>} />

          {/* Apps */}
          <Route path="/app/tetris" element={<React.Suspense fallback={<div>Loading...</div>}><Tetris /></React.Suspense>} />
          <Route path="/app/filebrowser/*" element={<React.Suspense fallback={<div>Loading...</div>}><FileBrowser /></React.Suspense>} />
          {enablePlaygrounds && <Route path="/support-chat" element={<React.Suspense fallback={<div>Loading...</div>}><SupportChat /></React.Suspense>} />}

          {/* Ecommerce Routes */}
          {(ecommerce) && (
            <>
              <Route path="/cart/*" element={<EcommerceBundleWrapper />} />
              <Route path="/checkout/*" element={<EcommerceBundleWrapper />} />
              <Route path="/shipping/*" element={<EcommerceBundleWrapper />} />
              <Route path="/returns/*" element={<EcommerceBundleWrapper />} />
              <Route path="/privacy/*" element={<EcommerceBundleWrapper />} />
              <Route path="/terms/*" element={<EcommerceBundleWrapper />} />
              <Route path="/impressum/*" element={<EcommerceBundleWrapper />} />
              <Route path="/purchases/*" element={<EcommerceBundleWrapper />} />
            </>
          )}

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<React.Suspense fallback={<div>Loading...</div>}><NotFound /></React.Suspense>} />
        </Routes >
      </main>
      {!hideAppChrome && showGlobalFooter && <Footer />}
    </div >
  );
};

import { initFormatDetection } from '@/utils/formatDetection';

import { SWRConfig } from 'swr';


// ... (imports)

import { FeedCacheProvider } from "@/contexts/FeedCacheContext";
import { StreamProvider } from "@/contexts/StreamContext";
import { StreamInvalidator } from "@/components/StreamInvalidator";

// ... (imports)

import { ActionProvider } from "@/actions/ActionProvider";
import { HelmetProvider } from 'react-helmet-async';

// ... previous imports ...

const App = () => {
  React.useEffect(() => {
    initFormatDetection();
  }, []);

  return (
    <HelmetProvider>
      <SWRConfig value={{ provider: () => new Map() }}>
        <OidcProvider
          userManager={userManager}
          onSigninCallback={(user) => {
            const redirectTo = (user?.state as any)?.redirectTo ?? '/';
            window.location.replace(redirectTo);
          }}
        >
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <LogProvider>
                <MediaRefreshProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <ActionProvider>
                      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
                        <DragDropProvider>
                          <ProfilesProvider>                            
                              <StreamProvider>
                                <StreamInvalidator />
                                <FeedCacheProvider>
                                  <AppWrapper />
                                </FeedCacheProvider>
                              </StreamProvider>                            
                          </ProfilesProvider>
                        </DragDropProvider>
                      </BrowserRouter>
                    </ActionProvider>
                  </TooltipProvider>
                </MediaRefreshProvider>
              </LogProvider>
            </AuthProvider>
          </QueryClientProvider>
        </OidcProvider>
      </SWRConfig>
    </HelmetProvider>
  );
};

export default App;
