# PM-Pics Routes Reference

> **Purpose**: Quick reference for LLM code assistants  
> **Format**: Structured mappings of routes → components → files

---

## Route-to-Component Mapping

### Top-Level Routes

```yaml
/:
  component: Index
  file: src/pages/Index.tsx
  renders: PhotoGrid
  file: src/components/PhotoGrid.tsx
  auth: false
  
/auth:
  component: Auth
  file: src/pages/Auth.tsx
  auth: false
  
/profile:
  component: Profile
  file: src/pages/Profile.tsx
  auth: required
  
/post/:id:
  component: Post
  file: src/pages/Post.tsx
  auth: false
  child_components:
    - ImageLightbox: src/components/ImageLightbox.tsx
    - Comments: src/components/Comments.tsx
    - EditImageModal: src/components/EditImageModal.tsx
    - MagicWizardButton: src/components/MagicWizardButton.tsx
  
/user/:userId:
  component: UserProfile
  file: src/pages/UserProfile.tsx
  auth: false
  
/user/:userId/collections:
  component: UserCollections
  file: src/pages/UserCollections.tsx
  auth: false
  
/collections/new:
  component: NewCollection
  file: src/pages/NewCollection.tsx
  auth: required
  
/collections/:userId/:slug:
  component: Collections
  file: src/pages/Collections.tsx
  auth: conditional # private collections require ownership
  renders: PhotoGrid
  
/tags/:tag:
  component: TagPage
  file: src/pages/TagPage.tsx
  auth: false
  renders: PhotoGrid
  
/search:
  component: SearchResults
  file: src/pages/SearchResults.tsx
  auth: false
  query_params: [q]
  renders: PhotoGrid
  
/wizard:
  component: Wizard
  file: src/pages/Wizard.tsx
  renders: ImageWizard
  file: src/components/ImageWizard.tsx
  auth: required
  child_components:
    - ImageLightbox: src/components/ImageLightbox.tsx
    - ModelSelector: src/components/ImageWizard/components/ModelSelector.tsx
    - QuickActionsToolbar: src/components/ImageWizard/components/QuickActionsToolbar.tsx
    - ImageActionButtons: src/components/ImageWizard/components/ImageActionButtons.tsx
  
/new:
  component: NewPost
  file: src/pages/NewPost.tsx
  auth: required
  
/version-map/:id:
  component: VersionMap
  file: src/pages/VersionMap.tsx
  auth: false
  
/organizations:
  component: Organizations
  file: src/pages/Organizations.tsx
  auth: false
```

### Organization-Scoped Routes

All routes above have org-scoped equivalents:

```yaml
/org/:orgSlug/*:
  pattern: /org/:orgSlug + [any top-level route]
  examples:
    - /org/acme-corp
    - /org/acme-corp/post/:id
    - /org/acme-corp/wizard
  context: OrganizationContext
  file: src/contexts/OrganizationContext.tsx
  filtering: Content filtered by organization_id
```

---

## Core Navigation Components

```yaml
TopNavigation:
  file: src/components/TopNavigation.tsx
  provides_links:
    - Home: / or /org/:orgSlug
    - Organizations: /organizations
    - Wizard: /wizard
    - Profile: /profile
    - Auth: /auth
  uses_contexts:
    - OrganizationContext
    - AuthContext

PhotoGrid:
  file: src/components/PhotoGrid.tsx
  renders: PhotoCard[]
  sets_context: PostNavigationContext
  navigation_target: /post/:id
  
PhotoCard:
  file: src/components/PhotoCard.tsx
  navigation: onClick -> /post/:id
  
ImageLightbox:
  file: src/components/ImageLightbox.tsx
  navigation: prev/next via PostNavigationContext
  keyboard: [ArrowLeft, ArrowRight, Escape, Space]
  features: [Wizard mode, Templates, Voice, History]
  
MagicWizardButton:
  file: src/components/MagicWizardButton.tsx
  navigation: Current post -> /wizard
  persistence: sessionStorage[wizardInitialImage, postNavigationContext]
```

---

## Navigation Contexts

```yaml
PostNavigationContext:
  file: src/contexts/PostNavigationContext.tsx
  provider: PostNavigationProvider
  state:
    posts: Array<{id, title, image_url, user_id}>
    currentIndex: number
    source: home | collection | tag | search | user
    sourceId?: string
  methods:
    - setNavigationData(data)
    - preloadImage(url)
  persistence: sessionStorage (when navigating to wizard)
  
OrganizationContext:
  file: src/contexts/OrganizationContext.tsx
  provider: OrganizationProvider
  state:
    orgSlug: string | null
    isOrgContext: boolean
  usage: Filters content, prefixes routes with /org/:orgSlug
  
AuthContext:
  file: src/hooks/useAuth.tsx
  provider: AuthProvider
  state:
    user: User | null
  guards: Protects /profile, /wizard, /new, /collections/new
  
LogContext:
  file: src/contexts/LogContext.tsx
  provider: LogProvider
  state:
    logs: LogEntry[]
    isLoggerVisible: boolean
  usage: Debug logging in wizard and image generation
```

---

## Navigation Mechanisms

### 1. React Router Navigation

```typescript
// File: src/pages/*.tsx
import { useNavigate } from "react-router-dom";

const navigate = useNavigate();
navigate('/post/:id');        // Click navigation
navigate(-1);                 // Back navigation
```

### 2. PostNavigationContext (Prev/Next)

```typescript
// File: src/pages/Post.tsx, src/components/ImageLightbox.tsx
const { navigationData, setNavigationData } = usePostNavigation();

// Navigate to next post
const newPost = navigationData.posts[navigationData.currentIndex + 1];
navigate(`/post/${newPost.id}`);
```

### 3. Session Storage Persistence

```typescript
// File: src/components/MagicWizardButton.tsx
// Store before navigating to wizard
sessionStorage.setItem('wizardInitialImage', JSON.stringify(imageData));
sessionStorage.setItem('postNavigationContext', JSON.stringify(navigationData));

// File: src/pages/Post.tsx
// Restore on return from wizard
const storedData = sessionStorage.getItem('postNavigationContext');
setNavigationData(JSON.parse(storedData));
sessionStorage.removeItem('postNavigationContext');
```

### 4. Keyboard Navigation

```typescript
// File: src/pages/Post.tsx
// Global keyboard listeners
ArrowLeft  -> handleNavigate('prev')  // Previous post
ArrowRight -> handleNavigate('next')  // Next post
Escape     -> navigate back           // Return to feed

// File: src/components/ImageLightbox.tsx
// Lightbox keyboard listeners
ArrowLeft    -> onNavigate('prev')      // Previous image
ArrowRight   -> onNavigate('next')      // Next image
Space        -> toggle prompt field     // Show/hide prompt
Escape       -> onClose()               // Close lightbox
Ctrl+ArrowUp -> navigate history up     // Previous prompt
Ctrl+ArrowDown -> navigate history down // Next prompt
```

### 5. Mouse Wheel Navigation

```typescript
// File: src/pages/Post.tsx
// Scroll-based navigation at page boundaries
wheelDelta > THRESHOLD && isAtBottom -> handleNavigate('next')
wheelDelta < THRESHOLD && isAtTop -> handleNavigate('prev')
```

### 6. Touch Gestures

```typescript
// File: src/components/ImageLightbox.tsx
// Swipe detection
swipe_left  -> onNavigate('next')  // Next image
swipe_right -> onNavigate('prev')  // Previous image
double_tap  -> open lightbox       // On Post page
```

---

## Key Navigation Flows

### 1. Browse → View → Edit

```
Index (PhotoGrid)
  ↓ click photo
Post (/post/:id)
  ↓ click MagicWizardButton
  ↓ store context → sessionStorage
Wizard (/wizard)
  ↓ load from sessionStorage
  ↓ generate variations
  ↓ back button
Post (/post/:id)
  ↓ restore context ← sessionStorage
  ↓ resume at exact position
```

**Files involved**:
- `src/components/PhotoGrid.tsx` - Sets navigation data
- `src/pages/Post.tsx` - Stores/restores context
- `src/components/MagicWizardButton.tsx` - Handles storage
- `src/pages/Wizard.tsx` - Loads initial image
- `src/components/ImageWizard.tsx` - Main wizard logic

### 2. Lightbox Prev/Next Navigation

```
PhotoGrid
  ↓ setNavigationData(posts[], currentIndex)
PostNavigationContext
  ↓ posts[0...N]
Post page opens
  ↓ opens ImageLightbox
ImageLightbox
  ↓ user presses ← or →
  ↓ onNavigate('prev' | 'next')
Post page
  ↓ navigate(/post/[newId])
  ↓ updates currentIndex
```

**Files involved**:
- `src/contexts/PostNavigationContext.tsx` - Context provider
- `src/components/PhotoGrid.tsx` - Sets initial data
- `src/pages/Post.tsx` - Handles navigation
- `src/components/ImageLightbox.tsx` - UI controls

### 3. Organization Context Navigation

```
Any page
  ↓ URL contains /org/:orgSlug
OrganizationProvider
  ↓ extracts orgSlug from useParams()
  ↓ provides {orgSlug, isOrgContext}
All components
  ↓ read context
  ↓ filter content by organization_id
  ↓ prefix all routes with /org/:orgSlug
```

**Files involved**:
- `src/contexts/OrganizationContext.tsx` - Context provider
- `src/components/TopNavigation.tsx` - Adjusts links
- `src/components/PhotoGrid.tsx` - Filters content
- `src/pages/Post.tsx` - Scoped navigation

---

## Router Configuration

```typescript
// File: src/App.tsx
<BrowserRouter>
  <AuthProvider>
    <LogProvider>
      <PostNavigationProvider>
        <OrganizationProvider>
          <Routes>
            {/* Top-level routes */}
            <Route path="/" element={<Index />} />
            <Route path="/post/:id" element={<Post />} />
            <Route path="/wizard" element={<Wizard />} />
            {/* ... all other routes */}
            
            {/* Organization-scoped routes */}
            <Route path="/org/:orgSlug" element={<Index />} />
            <Route path="/org/:orgSlug/post/:id" element={<Post />} />
            <Route path="/org/:orgSlug/wizard" element={<Wizard />} />
            {/* ... all other org routes */}
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </OrganizationProvider>
      </PostNavigationProvider>
    </LogProvider>
  </AuthProvider>
</BrowserRouter>
```

**Provider Nesting Order** (outer to inner):
1. `QueryClientProvider` - React Query
2. `AuthProvider` - Authentication state
3. `LogProvider` - Debug logging
4. `PostNavigationProvider` - Post navigation
5. `BrowserRouter` - Routing
6. `OrganizationProvider` - Organization context

---

## Image-Related Files (Wizard Features)

```yaml
Image Generation/Editing:
  router: src/lib/image-router.ts
  apis:
    - OpenAI: src/lib/openai.ts
    - Replicate: src/lib/replicate.ts
    - AIMLAPI: src/lib/aimlapi.ts
    - Bria: src/lib/bria.ts
  entry: src/image-api.ts
  
Wizard Handlers:
  base: src/components/ImageWizard/handlers/
  files:
    - imageHandlers.ts: Upload, selection, download
    - generationHandlers.ts: Image generation, optimization
    - publishHandlers.ts: Publishing to gallery
    - dataHandlers.ts: Loading versions, images
    - settingsHandlers.ts: Templates, presets, history
    - voiceHandlers.ts: Voice recording, transcription
    - agentHandlers.ts: AI agent generation
    
Wizard Components:
  base: src/components/ImageWizard/components/
  files:
    - ModelSelector.tsx: Model selection UI
    - QuickActionsToolbar.tsx: Quick action buttons
    - ImageActionButtons.tsx: Per-image actions
```

---

## Authentication Guards

```typescript
// Pattern used in protected routes
// Files: src/pages/Profile.tsx, src/pages/Wizard.tsx, src/pages/NewPost.tsx

import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

if (!user) {
  return <Navigate to="/auth" replace />;
}
```

**Protected Routes**:
- `/profile` → `/auth`
- `/wizard` → `/auth`
- `/new` → `/auth`
- `/collections/new` → `/auth`

---

## Common Patterns

### Navigate to Post from Grid

```typescript
// File: src/components/PhotoGrid.tsx
const handleImageClick = (pictureId: string) => {
  navigate(`/post/${pictureId}`);
};
```

### Navigate with Org Context

```typescript
// File: src/components/TopNavigation.tsx
const { orgSlug, isOrgContext } = useOrganization();
const basePath = isOrgContext ? `/org/${orgSlug}` : '';
navigate(`${basePath}/wizard`);
```

### Preserve Navigation on Wizard Visit

```typescript
// File: src/components/MagicWizardButton.tsx
// Before navigate
sessionStorage.setItem('postNavigationContext', JSON.stringify(navigationData));

// File: src/pages/Post.tsx  
// On mount
const stored = sessionStorage.getItem('postNavigationContext');
if (stored) {
  setNavigationData(JSON.parse(stored));
  sessionStorage.removeItem('postNavigationContext');
}
```

### Lightbox Navigation Handler

```typescript
// File: src/pages/Post.tsx
const handleNavigate = (direction: 'prev' | 'next') => {
  if (!navigationData) return;
  
  const newIndex = direction === 'next' 
    ? navigationData.currentIndex + 1 
    : navigationData.currentIndex - 1;
  
  if (newIndex >= 0 && newIndex < navigationData.posts.length) {
    const newPost = navigationData.posts[newIndex];
    setNavigationData({ ...navigationData, currentIndex: newIndex });
    navigate(`/post/${newPost.id}`);
  }
};
```

---

## Quick Reference

### Find Route Handler
- Route definition: `src/App.tsx`
- Page component: `src/pages/[PageName].tsx`
- Navigation setup: `src/components/TopNavigation.tsx`

### Find Context Usage
- Auth: `useAuth()` from `src/hooks/useAuth.tsx`
- Navigation: `usePostNavigation()` from `src/contexts/PostNavigationContext.tsx`
- Organization: `useOrganization()` from `src/contexts/OrganizationContext.tsx`

### Find Navigation Logic
- Click navigation: `src/components/PhotoGrid.tsx`, `src/components/TopNavigation.tsx`
- Keyboard navigation: `src/pages/Post.tsx` (global), `src/components/ImageLightbox.tsx` (lightbox)
- Context persistence: `src/components/MagicWizardButton.tsx`, `src/pages/Post.tsx`

---

**Version**: 2.0  
**Last Updated**: 2025-10-03  
**Format**: LLM-optimized reference

