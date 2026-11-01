# Posts Module Documentation

> **Module path:** `src/modules/posts/`

The posts module owns all post-related frontend functionality: creating, editing, viewing, and managing posts containing mixed media (images, videos, embeds, external links).

---

## Directory Structure

```
src/modules/posts/
├── EditPost.tsx               # Create & edit page (/post/new, /post/:id/edit)
├── NewPost.tsx                # Legacy new-post page (/new)
├── PostPage.tsx               # Post detail page (/post/:id)
├── client-posts.ts            # Post API client (CRUD, feed, meta)
├── client-pictures.ts         # Picture/media API client (CRUD, comments, likes, versions)
├── components/
│   ├── PostComposer.tsx       # Post editor form (title, description, settings, image list)
│   └── PostPicker.tsx         # Dialog for selecting existing posts (append-to-post flow)
└── views/
    ├── types.ts               # Core types (PostItem, PostMediaItem, PostSettings, etc.)
    ├── adapters.ts            # Data adapters (Supabase → frontend models)
    ├── PostActions.ts          # Post action utilities
    ├── usePostActions.ts       # Post action hooks
    ├── utils.ts               # Shared utilities
    ├── db.ts                  # DB helpers
    ├── llm.tsx                # AI/LLM integration for posts
    ├── components/
    │   ├── SmartLightbox.tsx   # Full-screen media lightbox
    │   ├── DeleteDialogs.tsx   # Post/picture delete confirmation
    │   ├── ExportDropdown.tsx  # Export menu (markdown, zip, etc.)
    │   ├── TikTokDialog.tsx    # TikTok embed dialog
    │   ├── TikTokEmbed.tsx     # TikTok embed renderer
    │   └── YouTubeDialog.tsx   # YouTube embed dialog
    └── renderers/
        ├── ArticleRenderer.tsx      # Blog/article-style layout
        ├── CompactRenderer.tsx      # Default compact layout
        ├── EmbedRenderer.tsx        # oEmbed rendering (/embed/:id)
        ├── ThumbsRenderer.tsx       # Thumbnail grid layout
        └── components/
            ├── CompactActionToolbar.tsx  # Action bar (like, share, edit, etc.)
            ├── CompactFilmStrip.tsx      # Horizontal thumbnail strip
            ├── CompactMediaDetails.tsx   # Media metadata panel
            ├── CompactMediaViewer.tsx    # Main media viewport
            ├── CompactPostHeader.tsx     # Post header (author, date, categories)
            ├── Gallery.tsx              # Gallery grid component
            ├── MobileGroupItem.tsx       # Mobile-optimized post item
            ├── MobileGroupedFeed.tsx     # Mobile grouped feed view
            └── SpyGlassImage.tsx        # Zoom/spy-glass image viewer
```

---

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/post/new` | `EditPost` | Create a new post |
| `/post/:id` | `PostPage` | View post detail |
| `/post/:id/edit` | `EditPost` | Edit an existing post |
| `/video/:id` | `PostPage` | View video post (same renderer) |
| `/new` | `NewPost` | Legacy new-post page |
| `/wizard` | `Wizard` | AI Image Wizard (separate module, not post-specific) |

Route definitions: [`src/App.tsx`](../src/App.tsx)

---

## Supported Media Types

Posts can contain mixed media items. Each `PostMediaItem` has a `type` field:

| Type | Description | Source |
|------|-------------|--------|
| `supabase-image` | Uploaded image (stored in Supabase Storage) | File upload / drag-drop |
| `mux-video` | Video (processed by Mux) | File upload |
| `video-intern` | Legacy internal video | Migration |
| `page-external` | External link card (with OG metadata) | URL paste |
| `youtube` | YouTube embed | YouTube dialog |
| `tiktok` | TikTok embed | TikTok dialog |

---

## Display Modes (Renderers)

Posts support multiple display modes, configured via `post.settings.display`:

| Mode | Renderer | Description |
|------|----------|-------------|
| `compact` (default) | [`CompactRenderer`](../src/modules/posts/views/renderers/CompactRenderer.tsx) | Side-panel layout: media viewer + filmstrip + details |
| `article` | [`ArticleRenderer`](../src/modules/posts/views/renderers/ArticleRenderer.tsx) | Blog-style: wide images with inline markdown text |
| `thumbs` | [`ThumbsRenderer`](../src/modules/posts/views/renderers/ThumbsRenderer.tsx) | Grid of thumbnails |
| embed | [`EmbedRenderer`](../src/modules/posts/views/renderers/EmbedRenderer.tsx) | For `/embed/:id` oEmbed endpoint |

The renderer is selected in [`PostPage.tsx`](../src/modules/posts/PostPage.tsx) based on the post's settings.

---

## Client APIs

### `client-posts.ts`

Post-level CRUD operations, all authenticated via Supabase session:

| Function | Method | Description |
|----------|--------|-------------|
| `fetchPostById(id)` | `GET /api/posts/:id` | Fetch single post with pictures |
| `fetchPostDetailsAPI(id)` | `GET /api/posts/:id` | Fetch with responsive image sizes/formats |
| `fetchPostsList(options)` | `GET /api/posts` | Paginated post list |
| `fetchFullPost(postId)` | Supabase RPC | Full post with all relations |
| `createPost(data)` | `POST /api/posts` | Create new post |
| `updatePostDetails(id, updates)` | `PATCH /api/posts/:id` | Update title, description, settings, meta |
| `updatePostMeta(id, meta)` | `PATCH /api/posts/:id` | Update meta only |
| `deletePost(id)` | `DELETE /api/posts/:id` | Delete post and associated pictures |
| `mapFeedPostsToMediaItems(posts)` | — | Convert feed posts to PhotoGrid-compatible format |
| `augmentFeedPosts(posts)` | — | Normalize API posts (add cover, author) |

### `client-pictures.ts`

Picture/media-level operations:

| Function | Method | Description |
|----------|--------|-------------|
| `createPicture(picture)` | `POST /api/pictures` | Create picture record |
| `updatePicture(id, updates)` | `PATCH /api/pictures/:id` | Update picture metadata |
| `deletePicture(id)` | `DELETE /api/pictures/:id` | Delete single picture |
| `deletePictures(ids)` | `POST /api/pictures/delete-batch` | Batch delete |
| `fetchPictures(options)` | `GET /api/pictures` | List pictures with filters |
| `fetchPictureById(id)` | `GET /api/pictures/:id` | Single picture |
| `fetchMediaItemsByIds(ids)` | `GET /api/media-items` | Batch fetch by IDs |
| `fetchVersions(item)` | `GET /api/pictures/versions` | Version tree |
| `toggleLike(userId, pictureId)` | Supabase | Toggle like on picture |
| `unlinkPictures(ids)` | `POST /api/pictures/unlink` | Unlink from post |
| `upsertPictures(pictures)` | `POST /api/pictures/upsert` | Batch upsert |
| `fetchCommentsAPI(pictureId)` | `GET /api/pictures/:id/comments` | Fetch comments |
| `addCommentAPI(pictureId, content)` | `POST /api/pictures/:id/comments` | Add comment |
| `editCommentAPI(pictureId, commentId, content)` | `PATCH` | Edit comment |
| `deleteCommentAPI(pictureId, commentId)` | `DELETE` | Delete comment |
| `toggleCommentLikeAPI(pictureId, commentId)` | `POST` | Toggle comment like |

---

## Core Types

Defined in [`views/types.ts`](../src/modules/posts/views/types.ts):

```typescript
// A media item attached to a post
type PostMediaItem = MediaItem & {
    post_id: string | null;
    renderKey?: string;
};

// The post entity
interface PostItem {
    id: string;
    title: string;
    description: string | null;
    user_id: string;
    created_at: string;
    updated_at: string;
    pictures?: PostMediaItem[];
    settings?: PostSettings;
    meta?: PostMeta;
}

// Post display and visibility settings
interface PostSettings {
    display?: 'compact' | 'thumbs';
    visibility?: 'public' | 'listed' | 'private';
    link?: string;           // For link posts
    image_url?: string;
    thumbnail_url?: string;
}

// Post metadata
interface PostMeta {
    slug?: string;
    categoryIds?: string[];
    [key: string]: any;
}
```

---

## Post Lifecycle

### Creating a Post

1. User navigates to `/post/new` (via CreationWizardPopup or direct URL)
2. [`EditPost.tsx`](../src/modules/posts/EditPost.tsx) renders in create mode (no `id` param)
3. User fills title, description, adds images via drag-drop or file picker
4. Configures visibility/display in PostComposer settings accordion
5. On publish: `publishImage()` from [`publishHandlers.ts`](../src/components/ImageWizard/handlers/publishHandlers.ts) creates the post via `createPost()`, uploads images, links them via `createPicture()`
6. Redirects to `/post/:id`

### Editing a Post

1. User clicks "Edit Post" on [`PostPage.tsx`](../src/modules/posts/PostPage.tsx) → navigates to `/post/:id/edit`
2. [`EditPost.tsx`](../src/modules/posts/EditPost.tsx) fetches post data from `fetchPostById()`
3. Converts existing pictures to `ImageFile[]` format for PostComposer
4. User modifies content; on save: `publishImage()` calls `updatePostDetails()` and updates pictures
5. Redirects back to `/post/:id`

### Viewing a Post

1. [`PostPage.tsx`](../src/modules/posts/PostPage.tsx) fetches post via `fetchPostDetailsAPI()`
2. Resolves display mode from `post.settings.display`
3. Delegates to appropriate renderer (Compact, Article, Thumbs)
4. Renderer receives all props via `PostRendererProps` interface

---

## Integration with ImageWizard

The ImageWizard (`src/components/ImageWizard.tsx`) is a **separate module** for AI image generation. It interacts with posts in two ways:

1. **Append to Post** — Images generated in the wizard can be appended to an existing post via `PostPicker` dialog
2. **Open in Wizard** — Individual post images can be opened in the wizard for AI-powered editing (variations, upscaling, etc.)

The shared interface is the `ImageFile` type from [`ImageWizard/types.ts`](../src/components/ImageWizard/types.ts) and the `publishImage()` function from [`publishHandlers.ts`](../src/components/ImageWizard/handlers/publishHandlers.ts).

> **Note:** `publishHandlers.ts` still lives in `ImageWizard/handlers/` but is functionally post-module logic. It should be migrated to `modules/posts/` in a future cleanup.

---

## Post Settings & Visibility

| Setting | Values | Effect |
|---------|--------|--------|
| `visibility` | `public` / `listed` / `private` | Controls feed inclusion and access |
| `display` | `compact` / `article` / `thumbs` | Selects renderer |
| `link` | URL string | Attaches external link to post |

Managed via the settings accordion in [`PostComposer.tsx`](../src/modules/posts/components/PostComposer.tsx).
