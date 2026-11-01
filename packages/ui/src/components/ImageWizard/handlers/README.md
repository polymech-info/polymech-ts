# ImageWizard Handlers - Quick Reference

This directory contains modular handler functions for the ImageWizard component, organized by responsibility.

## 📁 File Structure

```
handlers/
├── index.ts                    # Central export file
├── imageHandlers.ts           # Image operations
├── generationHandlers.ts      # Image generation
├── publishHandlers.ts         # Publishing workflows
├── dataHandlers.ts           # Data loading
├── settingsHandlers.ts       # User settings
├── voiceHandlers.ts          # Voice/audio
├── agentHandlers.ts          # AI agent mode
└── README.md                 # This file
```

## 🎯 Quick Import Guide

### Import Everything
```typescript
import {
  handleFileUpload,
  loadPromptTemplates,
  handleVoiceToImage,
  // ... etc
} from './ImageWizard/handlers';
```

### Import Specific Module
```typescript
import { handleFileUpload } from './ImageWizard/handlers/imageHandlers';
```

## 📚 Handler Reference

### imageHandlers.ts
**Purpose**: Image file operations

| Function | Description |
|----------|-------------|
| `handleFileUpload` | Upload images from file system |
| `toggleImageSelection` | Toggle image selection state |
| `removeImageRequest` | Request image deletion |
| `confirmDeleteImage` | Confirm and delete image |
| `setAsSelected` | Mark image version as selected |
| `handleDownloadImage` | Download image to device |

**Usage Example**:
```typescript
// File upload
handleFileUpload(event, setImages);

// Toggle selection
toggleImageSelection(imageId, isMultiSelect, fromGallery, availableImages, images, setImages);
```

---

### generationHandlers.ts
**Purpose**: Image generation operations

| Function | Description |
|----------|-------------|
| `handleOptimizePrompt` | Optimize prompt with AI |
| `buildFullPrompt` | Build prompt with preset context |
| `abortGeneration` | Cancel generation |

**Usage Example**:
```typescript
// Optimize prompt
await handleOptimizePrompt(
  prompt,
  lightboxOpen,
  setLightboxPrompt,
  setPrompt,
  setIsOptimizingPrompt
);

// Build full prompt
const fullPrompt = buildFullPrompt(selectedPreset, prompt);
```

---

### publishHandlers.ts
**Purpose**: Publishing workflows

| Function | Description |
|----------|-------------|
| `publishImage` | Standard publish with metadata |
| `quickPublishAsNew` | Quick publish (prompt as description) |

**Usage Example**:
```typescript
// Standard publish
await publishImage(
  {
    user,
    generatedImage,
    images,
    lightboxOpen,
    currentImageIndex,
    postTitle,
    prompt,
    isOrgContext,
    orgSlug,
    onPublish,
  },
  setIsPublishing
);
```

---

### dataHandlers.ts
**Purpose**: Data loading from database

| Function | Description |
|----------|-------------|
| `loadFamilyVersions` | Load image version families |
| `loadAvailableImages` | Load gallery images |

**Usage Example**:
```typescript
// Load family versions
await loadFamilyVersions(parentImages, setImages, addLog);

// Load available images
await loadAvailableImages(setAvailableImages, setLoadingImages);
```

---

### settingsHandlers.ts
**Purpose**: User settings management

| Function | Description |
|----------|-------------|
| `loadPromptTemplates` | Load prompt templates |
| `savePromptTemplates` | Save prompt templates |
| `loadPromptPresets` | Load prompt presets |
| `loadWorkflows` | Load workflows |
| `loadQuickActions` | Load quick actions |
| `saveQuickActions` | Save quick actions |
| `loadPromptHistory` | Load prompt history |
| `addToPromptHistory` | Add to history |
| `navigatePromptHistory` | Navigate history |

**Usage Example**:
```typescript
// Load templates
await loadPromptTemplates(userId, setPromptTemplates, setLoadingTemplates);

// Save templates
await savePromptTemplates(userId, templates);

// Navigate history
navigatePromptHistory('up', promptHistory, historyIndex, setHistoryIndex, setPrompt);
```

---

### voiceHandlers.ts
**Purpose**: Voice recording and transcription

| Function | Description |
|----------|-------------|
| `handleMicrophone` | Start/stop recording |
| `handleVoiceToImage` | Voice-to-image workflow |

**Usage Example**:
```typescript
// Microphone control
await handleMicrophone(
  isRecording,
  mediaRecorderRef,
  setIsRecording,
  setIsTranscribing,
  audioChunksRef,
  lightboxOpen,
  setLightboxPrompt,
  setPrompt
);

// Voice to image
await handleVoiceToImage(
  transcribedText,
  userId,
  selectedPreset,
  selectedModel,
  setPrompt,
  setImages,
  setPostTitle,
  setPostDescription,
  voicePopupRef,
  addLog
);
```

---

### agentHandlers.ts
**Purpose**: AI agent mode with tool calling

| Function | Description |
|----------|-------------|
| `handleAgentGeneration` | Agent-based generation |

**Usage Example**:
```typescript
await handleAgentGeneration(
  prompt,
  userId,
  fullPrompt,
  selectedModel,
  setIsAgentMode,
  setIsGenerating,
  setImages,
  setPostTitle,
  setPostDescription,
  addLog
);
```

---

## 🔧 Common Patterns

### State Setter Pattern
Most handlers accept React state setters as parameters:
```typescript
const handleSomething = (
  data: string,
  setSomeState: React.Dispatch<React.SetStateAction<string>>
) => {
  setSomeState(data);
};
```

### Async Operations
Handlers that interact with APIs/database are async:
```typescript
const result = await someHandler(...);
```

### Error Handling
All handlers include try-catch with toast notifications:
```typescript
try {
  // operation
  toast.success('Success!');
} catch (error) {
  toast.error('Failed');
  throw error;
}
```

## 🎨 Best Practices

1. **Always pass state setters** - Don't access component state directly
2. **Use TypeScript types** - Import from `../types`
3. **Handle errors gracefully** - Use toast for user feedback
4. **Log important actions** - Use `addLog` for debugging
5. **Keep handlers pure** - No side effects beyond parameters

## 🚀 Migration Guide

### Before (Inline Function)
```typescript
const loadSettings = async () => {
  if (!user) return;
  setLoading(true);
  try {
    const { data } = await supabase.from('profiles')...
    // ... more code
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

### After (Using Handler)
```typescript
import { loadPromptTemplates } from './ImageWizard/handlers';

useEffect(() => {
  if (user) {
    loadPromptTemplates(user.id, setPromptTemplates, setLoadingTemplates);
  }
}, [user]);
```

## 📝 Adding New Handlers

1. **Choose the right file** - Group by responsibility
2. **Export function** - Use named exports
3. **Add to index.ts** - Re-export from index
4. **Document** - Add JSDoc comment
5. **Update this README** - Add to reference table

Example:
```typescript
/**
 * Description of what this does
 */
export const myNewHandler = async (
  param1: string,
  setState: React.Dispatch<React.SetStateAction<SomeType>>
) => {
  try {
    // implementation
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
```

## 🐛 Debugging

Enable debug logs in browser console:
```typescript
// In handlers, logs are already included
console.log('🔧 [Handler] Debug message', data);
```

Look for these emoji prefixes:
- 🔧 Debug/info logs
- ✅ Success
- ❌ Error
- 🎤 Voice operations
- 🤖 Agent operations

---

**Last Updated**: 2025-10-03  
**Version**: 1.0  
**Status**: Production Ready








