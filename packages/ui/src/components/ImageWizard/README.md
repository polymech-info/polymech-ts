# ImageWizard Component Structure

## Overview
The ImageWizard is split into focused modules for better maintainability.

## File Structure

```
ImageWizard/
├── types.ts                    # TypeScript interfaces (ImageFile, ImageWizardProps)
├── utils/
│   └── logger.ts              # Logger utility with clean API ✅
├── hooks/
│   └── useImageWizardState.ts # Centralized state management ✅ NEW!
├── handlers/
│   ├── index.ts               # Centralized exports ✅
│   ├── imageHandlers.ts       # Image upload, selection, deletion ✅
│   ├── generationHandlers.ts  # Image generation, optimization, abort ✅
│   ├── publishHandlers.ts     # Publishing logic ✅
│   ├── dataHandlers.ts        # Data loading/saving (presets, workflows, etc.) ✅
│   ├── voiceHandlers.ts       # Voice recording, transcription, voice-to-image ✅
│   ├── agentHandlers.ts       # AI Agent mode with tool calling ✅
│   ├── promptHandlers.ts      # Prompt splitting & sequential generation ✅
│   ├── dropHandlers.ts        # Drag and drop file handling ✅
│   └── settingsHandlers.ts    # User settings (templates, history, etc.) ✅
└── ImageWizard.tsx            # Main UI component (2,129 lines, down from 2,359)
```

## Recent Refactorings

### 1. ✅ Prompt Splitter Extracted (`promptHandlers.ts`)
- `generateImageSplit` - Sequential multi-prompt generation
- Uses `splitPromptByLines` from `@constants.ts`

### 2. ✅ Logger Refactored (`utils/logger.ts`)
- Changed from `addLog('debug', ...)` to `logger.debug(...)`
- Created `Logger` interface with clean methods: `debug()`, `info()`, `warning()`, `error()`, `success()`, `verbose()`
- All handlers now accept `Logger` instead of raw `addLog` function
- Component name auto-prefixed in logs

### 3. ✅ DEFAULT_QUICK_ACTIONS Moved to `@constants.ts`
- `QuickAction` interface now exported from constants
- Available throughout the codebase
- Removed duplicate from `types.ts`

### 4. ✅ Drag and Drop Extracted (`dropHandlers.ts`)
- `handleDragEnter` - Show drop overlay
- `handleDragOver` - Keep overlay active
- `handleDragLeave` - Debounced hide (prevents flicker)
- `handleDrop` - Process dropped files

## Handler Categories

### 📸 imageHandlers.ts
- `handleFileUpload` - Upload files
- `toggleImageSelection` - Select/deselect images
- `removeImageRequest` - Request image deletion
- `confirmDeleteImage` - Confirm and execute deletion
- `setAsSelected` - Set image as selected version
- `handleDownloadImage` - Download image

### 🎨 generationHandlers.ts
- `handleOptimizePrompt` - Optimize prompt with AI
- `buildFullPrompt` - Build prompt with preset context
- `abortGeneration` - Cancel generation

### 📝 promptHandlers.ts
- `generateImageSplit` - Sequential multi-prompt generation

### 🎤 voiceHandlers.ts
- `handleMicrophone` - Record audio
- `handleVoiceToImage` - Voice-to-image workflow with AI

### 🤖 agentHandlers.ts
- `handleAgentGeneration` - AI Agent mode with tool calling

### 📤 publishHandlers.ts
- `publishImage` - Standard publish
- `quickPublishAsNew` - Quick publish with prompt as description

### 💾 dataHandlers.ts
- `loadFamilyVersions` - Load image version families
- `loadAvailableImages` - Load gallery images

### ⚙️ settingsHandlers.ts
- Template, preset, workflow, history management

### 🎯 dropHandlers.ts
- Drag and drop file handling

## Usage Example

```typescript
import { 
  handleFileUpload, 
  toggleImageSelection,
  publishImage 
} from './handlers';
import { createLogger } from './utils/logger';

// In component
const logger = createLogger(addLog, 'ImageWizard');
handleFileUpload(event, setImages);
logger.info('File uploaded successfully');
```

## Benefits
✅ Easier to find specific logic
✅ Better code organization
✅ Simpler testing
✅ Reduced file size
✅ Clear separation of concerns
✅ Clean logging API
✅ Reusable utilities

