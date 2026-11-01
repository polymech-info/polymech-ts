# PWA Sharing & Mobile Integration Options

## Overview
We have implemented a **Progressive Web App (PWA)** with the **Web Share Target API** to allow sharing text, images, and videos from mobile apps directly to the Polymech Pics app.

## Implementation Details

### 1. Manifest
The manifest is manually managed in `public/manifest.webmanifest`.
It includes the `share_target` configuration:
```json
"share_target": {
    "action": "/upload-share-target",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
        "title": "title",
        "text": "text",
        "url": "url",
        "files": [
            {
                "name": "file",
                "accept": ["image/*", "video/*"]
            }
        ]
    }
}
```

### 2. Service Worker (`src/sw.ts`)
The Service Worker intercepts `POST` requests to `/upload-share-target`:
1.  Catches the request.
2.  Parses `FormData` (files, title, text).
3.  Stores data in **IndexedDB** (using `idb-keyval`, key: `share-target`).
4.  Redirects the user to `/new?shared=true`.

### 3. Frontend (`src/pages/NewPost.tsx`)
On the "New Post" page:
1.  Checks for `?shared=true`.
2.  Reads from IndexedDB (`share-target`).
3.  Pre-loads the images/text into the wizard.
4.  Clears the IndexedDB entry.

### 4. Build Configuration (`vite.config.ts`)
- `vite-plugin-pwa` is configured with `manifest: false` to respect the manual file in `public/`.
- Strategy is `injectManifest` using `src/sw.ts`.
- Updates are handled via `workbox-core`'s `skipWaiting()` and `clientsClaim()` for immediate activation.

## Installation (Add to Home Screen)
The app meets the criteria for "Add to Home Screen" (A2HS):
- **Manifest**: Correctly linked with `name`, `icons` (192px/512px), `start_url`, and `display: standalone`.
- **Service Worker**: Registered and functioning offline (precaching cached assets).
- **HTTPS**: Required for PWA installation (ensure your deployment provider supports this).

### Testing A2HS
- **Desktop Chrome**: Look for the "Install" icon in the address bar.
- **Android**: Open Chrome -> Menu -> "Add to Home screen".
- **iOS**: Open Safari -> **Share** button -> "Add to Home Screen" (Note: iOS doesn't prompt automatically).
