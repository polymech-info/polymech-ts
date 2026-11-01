# Support Chat

Embeddable AI support chat built on `ChatPanel` with a fixed `support` preset (no header, no sidebar). System prompts are assembled from [`defaults.ts`](../src/modules/ai/defaults.ts), injecting the user's UI language and named context blocks automatically.

---

## Route

`/support-chat` — public, no auth required. Registered in `App.tsx` via the `SupportChat` page.

---

## Architecture

```
SupportChat (page/embed)
  └── ChatPanel  preset="support"
        ├── useChatEngine('support')          ← isolated localStorage namespace
        ├── buildSupportPrompt(context)       ← from defaults.ts
        │     ├── BASE_SUPPORT_PROMPT
        │     ├── getCurrentLang()            ← from i18n.tsx
        │     └── SUPPORT_CONTEXTS[key...]    ← named blocks
        └── seed useEffect (once on mount)
              sets provider / model / tools / systemPrompt
```

### localStorage isolation

Each `ChatPanel` preset gets its own storage namespace via `useChatEngine(preset)`:

| Preset | Key prefix |
|---|---|
| `developer` / `standard` / `simple` | `developer-settings-*` etc. |
| `support` | `support-settings-*` |

This prevents PlaygroundChat from polluting SupportChat settings (and vice versa).

---

## System Prompt Assembly

**File:** `src/modules/ai/defaults.ts`

```ts
buildSupportPrompt(contexts?)
// → BASE_SUPPORT_PROMPT
// + "Always reply in Français (language code: fr)."   ← auto from getCurrentLang()
// + SUPPORT_CONTEXTS['shipping-rates']                 ← if in contexts
```

### Default contexts

```ts
export const DEFAULT_CONTEXTS: SupportContextKey[] = ['shipping-rates'];
```

Applied when no `context` prop is passed.

### Adding a new context block

```ts
// src/modules/ai/defaults.ts
export const SUPPORT_CONTEXTS: Record<string, string> = {
  'shipping-rates': `...`,
  'returns': `## Returns Policy\n...`,   // ← add here
};
```

The key becomes the `SupportContextKey` union type automatically.

---

## Embedding

### Standalone page (default)

```tsx
<SupportChat />
// Uses: openrouter / gpt-4o, search tools ON, DEFAULT_CONTEXTS
```

### With custom contexts

```tsx
<SupportChat context={['shipping-rates', 'returns']} />
```

### With different model / provider

```tsx
<SupportChat
  provider="openai"
  model="gpt-4o-mini"
  context={['shipping-rates']}
/>
```

### With live runtime context (e.g. current order)

Use `ChatPanel` directly with `getContext` — called before every send:

```tsx
<ChatPanel
  preset="support"
  context={['shipping-rates']}
  getContext={() => `User is viewing order #${orderId}`}
/>
```

### All props

#### `SupportChat`

| Prop | Type | Default | Description |
|---|---|---|---|
| `context` | `SupportContextKey[]` | `DEFAULT_CONTEXTS` | Context blocks appended to base prompt |
| `provider` | `string` | `'openrouter'` | AI provider |
| `model` | `string` | `'openai/gpt-4o'` | AI model |
| `searchTools` | `boolean` | `true` | Site search tools |
| `pageTools` | `boolean` | `false` | Page/content tools |
| `imageTools` | `boolean` | `false` | Image generation tool |
| `vfsTools` | `boolean` | `false` | VFS file tools |

#### `ChatPanel` (additional props relevant to support embeds)

| Prop | Type | Description |
|---|---|---|
| `context` | `SupportContextKey[]` | Same as above, passed through |
| `initialSystemPrompt` | `string` | Overrides `buildSupportPrompt` entirely |
| `getContext` | `() => string \| null` | Dynamic context injected before each send |
| `extraTools` | `() => any[]` | Additional tool definitions |

---

## Navigation

A `MessageSquare` icon button is always visible in `TopNavigation` (public, no auth guard), highlighting when the route is active.

---

## Files

| File | Role |
|---|---|
| `src/pages/SupportChat.tsx` | Page component + embed wrapper |
| `src/modules/ai/defaults.ts` | Prompt registry (`BASE_SUPPORT_PROMPT`, `SUPPORT_CONTEXTS`, `buildSupportPrompt`) |
| `src/modules/ai/ChatPanel.tsx` | Panel with `support` preset + `initial*` seed props + `context` prop |
| `src/modules/ai/useChatEngine.ts` | Engine hook, namespaced via `namespace` param |
| `src/App.tsx` | `/support-chat` route |
| `src/components/TopNavigation.tsx` | Nav icon button |
