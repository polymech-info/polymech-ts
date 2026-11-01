# Video Feed Playground

## Overview

A TikTok-style infinite scroll video player playground built on deobfuscated TikTok source code, integrated with our video database.

## Access

Navigate to: **`/playground/video-feed`**

## Configuration

### Environment Variables

- **`VITE_ENABLE_VIDEO_ERROR_OVERLAY`** (default: `true`)
  - Set to `false` to hide video error overlays
  - Useful for production or when you want a cleaner UX
  - Add to `.env.local`: `VITE_ENABLE_VIDEO_ERROR_OVERLAY=false`
  - Errors will still be logged to console

## Features

### ✅ Currently Implemented

- **Infinite Scroll**: Vertical scrolling through videos with snap-to-view behavior
- **Video Playback**: 
  - **HLS Support**: Uses Vidstack MediaPlayer for Mux HLS video streams
  - Full video controls (play/pause, seek, volume, fullscreen)
  - Auto-loop enabled
  - Responsive video player
- **Action Bar**: Like, comment, share, bookmark buttons (UI only)
- **Video Metadata**: Title, description, author info overlay
- **Real User Data**: 
  - ✅ Actual user avatars from profiles table
  - ✅ Real display names, usernames from database
  - ✅ Actual likes count from database
  - ✅ Real comments count from database
- **Keyboard Controls**:
  - `↑/↓` - Navigate videos
  - Vidstack's built-in controls for playback
- **Auto-play**: Videos auto-play when in view
- **Progress Indicator**: Visual indicators on the right showing current video
- **Loading States**: Smooth loading and error states

### 🚧 Mocked/Not Implemented Yet

The following features are mocked with placeholder data:

- **Stats** (partially mocked):
  - ✅ Likes count - **REAL** from database
  - ✅ Comments count - **REAL** from database
  - ❌ Play count - Mocked (proportional to likes)
  - ❌ Share count - Mocked (proportional to comments)
  - ❌ Bookmark count - Mocked (proportional to likes)
- **Subtitles/Captions**: Types exist, but no actual subtitle rendering
- **Music/Audio Info**: Shows mock music data
- **Challenges/Hashtags**: Extracted from description hashtags (partially real)
- **Effects**: No video effects applied
- **Interactive Actions**: 
  - Comment button - UI only, shows count but doesn't open comments
  - Like button - Shows real count, but clicking doesn't save
  - Share button - Copies URL to clipboard
  - Follow button - UI only, not functional
  - Bookmark button - UI only, not functional
- **Privacy Controls**: PNS (Privacy & Network Security) features omitted

## Data Flow

1. **Fetches videos** from database using `fetchMediaItems()` from `@/utils/mediaUtils`
   - Queries `pictures` table filtering for `type = 'mux-video'`
   - Gets real likes_count and comments_count
2. **Fetches user profiles** from `profiles` table
   - Gets avatar_url, display_name, username, email
   - Maps profiles to video authors
3. **Transforms** our `MediaItem` format to TikTok's `VideoItem` format
4. **Mixes real and mocked data**:
   - ✅ **Real**: User avatars, display names, likes count, comments count
   - ❌ **Mocked**: Music info, play count, share count, bookmark count
   - ⚠️ **Extracted**: Challenges from description hashtags

## Architecture

```
VideoFeedPlayground.tsx
├── Fetches videos from database
├── Transforms to TikTok format
└── Renders VideoFeed
    ├── useVideoPlayer (playback state)
    ├── useInfiniteScroll (scroll behavior)
    └── VideoItem[]
        ├── VideoPlayer (video element + controls)
        ├── VideoActionBar (right side actions)
        └── VideoMetadata (bottom overlay)
```

## Adding Features

### To Implement Subtitles

1. Add subtitle file URLs to video metadata
2. Fetch/parse WebVTT files using `src/player/utils/webvtt.ts`
3. Enable `showSubtitles` prop in `VideoPlayer`
4. Subtitles will render automatically

### To Connect Comments

1. Import comment components from `src/components/Comments.tsx`
2. Replace mock comment panel in `VideoFeed.tsx`
3. Connect to existing comment system

### To Add Real Music

1. Add music metadata to video records
2. Extract from video files or link separately
3. Update transform function in `VideoFeedPlayground.tsx`

## Technical Details

### Video Player Implementation

The player uses **Vidstack MediaPlayer** instead of native HTML5 `<video>` elements because:
- **HLS Support**: Mux videos are HLS streams (`.m3u8`) which need special handling
- **Cross-browser**: Works on all modern browsers without additional libraries
- **Built-in Controls**: Professional video controls out of the box
- **Already Installed**: Your project already uses `@vidstack/react` for VideoCard

The original TikTok player design used native HTML5 video, but that doesn't support HLS streams on most browsers. Vidstack provides the necessary HLS support while maintaining a clean interface.

## Known Limitations

- **Performance**: Not optimized for very large video counts (>100)
- **Mobile**: Touch gestures not fully implemented
- **Analytics**: No tracking/analytics hooked up yet
- **Custom Controls**: Using Vidstack's default controls instead of fully custom TikTok-style overlay

## Next Steps

1. **Implement Subtitles**: Add WebVTT subtitle support
2. **Connect Comments**: Link to existing comment system
3. **Add Video Upload**: Direct integration with upload flow
4. **Performance**: Add video preloading and memory management
5. **Mobile UX**: Swipe gestures, better mobile controls
6. **Analytics**: Track watch time, engagement

## Development Notes

- Player is in development mode (no build required)
- Component hot-reloading works
- Check console for video playback errors
- Uses existing database schema (no migrations needed)

