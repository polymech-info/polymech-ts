# Embed Implementation Plan

## Goal
Enable third-party sites to embed posts from our platform using an iframe. This requires a lightweight, dedicated build of the application that renders a single post with minimal distractions (no navigation, no sidebar, etc.).

## Architecture

### 1. Dedicated Output Build
We will create a separate Vite build for the embed view to ensure the bundle size is minimal and isolated from the main application's complexity.

- **Config**: `vite.config.embed.ts`
- **Entry**: `src/main-embed.tsx`
- **Output**: `dist/client/embed/`
- **Feature Flags**: Use Vite `define` to set `__IS_EMBED__` constant to `true` at build time. This allows dead-code elimination (tree-shaking) of unused components in `CompactRenderer`.

### 2. Client-Side Entry Point (`src/main-embed.tsx`)
A simplified entry point that:
- Does **not** include the full `App` router.
- Reads initial state from `window.__INITIAL_STATE__`.
- Renders `EmbedApp`.

### 3. Component Strategy (`EmbedRenderer.tsx`)
Create `src/pages/Post/renderers/EmbedRenderer.tsx`. This component will be:
- **Lightweight**: Minimal imports, no heavy third-party libs (unless critical).
- **Read-Only**: No edit controls, no comments, no wizard.
- **Navigation**:
  - Image click → Opens `window.open(postUrl, '_blank')`.
  - Title/Author click → Opens `window.open(profileUrl, '_blank')`.
- **Layout**:
  - Responsive Media (Image/Video).
  - Filmstrip (for galleries).
  - Simple footer (Like count, Share button).

### 4. Server-Side Serving (`server/src/products/serving/index.ts`)
A new route `GET /embed/:postId` will be added to the serving product.

- **Logic**:
    1. Fetch the post/media.
    2. Inject into `window.__INITIAL_STATE__`.
    3. Serve `embed.html` (which points to `main-embed.tsx`).
    4. Set headers to allow embedding.

### 5. UI Trigger (`ArticleRenderer.tsx`)
Add an "Embed" action button next to "Export to Markdown".
- **Action**: Opens a modal with the iframe code snippet.


## Implementation Steps

### 1. Build Configuration
Create `vite.config.embed.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/embed',
    rollupOptions: {
      input: 'embed.html', // We might need a dedicated HTML or use index.html with a different entry
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### 2. Embed Entry Point
Create `src/embed.html` (copy of index.html pointing to `src/main-embed.tsx`).
Create `src/main-embed.tsx`.
Create `src/EmbedApp.tsx`.

### 3. Server Route
Update `server/src/products/serving/index.ts`:
```typescript
// Add to routes
this.routes.push({ definition: { method: 'get', path: '/embed/:id' }, handler: this.handleGetEmbed.bind(this) });

// Handler
async handleGetEmbed(c: Context) {
    const id = c.req.param('id');
    // ... fetch post ...
    // ... load embed/index.html ...
    // ... inject data ...
    return c.html(injected);
}
```

### 4. UI Component
Modify `src/pages/Post/renderers/ArticleRenderer.tsx` to add the Embed button.

## Considerations
- **Styling**: Ensure global styles (`index.css`) are included but verify they don't assume a full page layout that breaks inside a small iframe.
- **Analytics**: Embed views might need distinct tracking.
- **Links**: All links inside the embed should open in a new tab (`target="_blank"`) to avoid navigating the iframe itself.
