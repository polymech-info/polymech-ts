# Client E2E Testing Guide

## Quick Start

```bash
# 1. Ensure both servers are running
npm run dev       # Vite client  → http://localhost:8080
npm run server    # Express API  → http://localhost:3333

# 2. Run all tests (chromium only)
npm test

# 3. Run a single spec
npx playwright test tests/my-test.spec.ts --project=chromium

# 4. Interactive UI mode
npm run test:ui

# 5. Headed (see the browser)
npm run test:headed

# 6. Debug mode (step through)
npm run test:debug

# 7. View last HTML report
npm run test:report
```

---

## Prerequisites

| Requirement | Details |
|---|---|
| **Node >= 18** | `node -v` |
| **Playwright browsers** | `npx playwright install` (run once) |
| **Client running** | `npm run dev` → `http://localhost:8080` |
| **Server running** | `npm run server` → `http://localhost:3333` |
| **`.env` populated** | credentials + `VITE_SERVER_IMAGE_API_URL` |

### Building Local Dependencies

pm-pics links to monorepo packages via `file:` references. If you change any of these, rebuild before running tests:

```bash
# @polymech/ecommerce
cd ../polymech-mono/packages/ecommerce && npm run build:lib

# @polymech/acl
cd ../polymech-mono/packages/acl && npm run build
```

> [!TIP]
> You only need to rebuild when the dependency source has changed. If you're only editing `pm-pics` code, skip this step.

---

## Environment & Config

### `.env` (development)

```env
TEST_EMAIL="cgoflyn@gmail.com" ( admin user)
TEST_PASSWORD="...."
TEST_USER_ID="cgo"


TEST_EMAIL_REGULAR="sales@plastic-hub.com" (regular user)
TEST_PASSWORD_REGULAR="..."


VITE_SUPABASE_URL="https://…supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="…"

# ⭐ Server API base — client fetches go here
VITE_SERVER_IMAGE_API_URL=http://192.168.1.14:3333
```

> **`VITE_SERVER_IMAGE_API_URL`** is the most relevant setting.
> It controls server-side API base for image/media endpoints.
> In production (`.env.production`) it points to `https://service.polymech.info`.

### `playwright.config.ts`

Key settings:

```ts
testDir: './tests',
fullyParallel: false,
timeout: 60_000,
use: {
  baseURL: process.env.TEST_URL || 'http://localhost:8080',
  trace: 'on',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
},
```

Configured browser projects: `chromium' (only!).

---

## Shared Test Helpers — `tests/test-commons.ts`

Every spec imports from here. Key exports:

```ts
import { loginUser, TEST_CONFIG } from './test-commons';
```

### `TEST_CONFIG`

```ts
TEST_CONFIG = {
  USER: { EMAIL, PASSWORD, ID },   // from .env
  BASE_URL,                         // VITE_SERVER_IMAGE_API_URL
  APP_URL: 'http://localhost:8080',
  TEST_PAGE:        { SLUG: 'test-page',           TITLE: 'Test Page' },
  TEST_PAGE_STRIPE: { SLUG: 'polymech-controller', TITLE: 'Polymech Controller' },
};
```

### `loginUser(page)`

Navigates to `/auth`, fills email + password, submits, and waits for the profile button to appear (15 s timeout). Captures a screenshot on failure.

> [!TIP]
> Always call `loginUser(page)` in `beforeEach` if your test requires authentication.

---

## NPM Test Scripts

| Script | Command |
|---|---|
| `npm test` | all specs, chromium |
| `npm run test:all` | all specs, all browsers |
| `npm run test:ui` | Playwright UI mode |
| `npm run test:headed` | headed chromium |
| `npm run test:debug` | step-through debugger |
| `npm run test:report` | open last HTML report |
| `npm run test:pages-meta` | `pages-meta.spec.ts` only |
| `npm run test:stripe` | `stripe-test.spec.ts` only |

To add a convenience script for a new spec, edit `package.json`:

```json
"test:my-feature": "playwright test tests/my-feature.spec.ts --project=chromium --workers=1"
```

### Passing Extra Flags

Use `--` to forward extra Playwright flags to **any** test script:

```bash
npm run test:pages-meta -- --ui        # open in UI mode
npm run test:pages-meta -- --headed    # see the browser
npm run test:pages-meta -- --debug     # step-through debugger
npm run test:stripe -- --ui
```

---

## App Architecture (for Writing Selectors)

Understanding the component tree helps you target the right selectors:

```
src/App.tsx                 ← router, provides all context wrappers
  └─ src/pages/Index.tsx    ← home feed ("/")
  └─ src/pages/Auth.tsx     ← "/auth" login page
  └─ src/pages/Profile.tsx  ← "/profile"
  └─ ...
  └─ src/modules/pages/UserPage.tsx     ← "/user/:userId/pages/:slug"
       └─ src/modules/pages/editor/UserPageEdit.tsx  ← page editor (lazy-loaded)
            └─ src/modules/pages/editor/ribbons/PageRibbonBar.tsx  ← ribbon toolbar
```

### Key Routes

| Route | Page component |
|---|---|
| `/` | `src/pages/Index.tsx` — home feed |
| `/auth` | `src/pages/Auth.tsx` |
| `/user/:userId/pages/:slug` | `src/modules/pages/UserPage.tsx` |
| `/profile` | `src/pages/Profile.tsx` |
| `/post/:id` | `src/pages/Post.tsx` |
| `/cart` | ecommerce cart |
| `/purchases` | ecommerce purchases |
| `/collections` | `src/pages/Collections.tsx` |

### Entering Edit Mode

`UserPage.tsx` renders a read view by default. To enter edit mode in tests:

```ts
const editButton = page.getByTestId('edit-mode-toggle');
await editButton.waitFor({ state: 'visible', timeout: 15_000 });
await editButton.click();
// Verify ribbon is visible
await expect(
  page.locator('.tracking-widest', { hasText: 'DESIGN' })
).toBeVisible({ timeout: 15_000 });
```

### Common `data-testid` Selectors

(from existing specs — always prefer `getByTestId` over CSS selectors)

| Test ID | Component | Notes |
|---|---|---|
| `edit-mode-toggle` | UserPage | Enters/exits edit mode |
| `page-title-display` | PageRibbonBar | Page title (click to edit) |
| `page-title-input` | PageRibbonBar | Title input (after click) |
| `page-title-save` | PageRibbonBar | Save title button |
| `page-visibility-toggle` | PageRibbonBar | Toggle visible/hidden |
| `page-public-toggle` | PageRibbonBar | Toggle public/private |
| `page-card` | PageCard | A page rendered in the feed grid |

---

## Data Fetching — How the Client Talks to the Server

**The client never uses Supabase directly for data reads/writes** (except auth).
All data goes through the Express server API via fetch wrappers.

### Client Fetch Modules

| Module | Path | Endpoints |
|---|---|---|
| Categories | `src/modules/categories/client-categories.ts` | `/api/categories` |
| Pages | `src/modules/pages/client-pages.ts` | `/api/pages/*` |
| Posts | `src/modules/posts/client-posts.ts` | `/api/posts/*` |
| Pictures | `src/modules/posts/client-pictures.ts` | `/api/pictures/*` |
| User/Profile | `src/modules/user/client-user.ts` | `/api/profile/*` |
| Layouts | `src/modules/layout/client-layouts.ts` | `/api/layouts/*` |
| Search | `src/modules/search/client-search.ts` | `/api/search/*` |
| Types | `src/modules/types/client-types.ts` | `/api/types/*` |
| I18n | `src/modules/i18n/client-i18n.ts` | `/api/i18n/*` |
| ACL | `src/modules/user/client-acl.ts` | `/api/acl/*` |
| Ecommerce | `src/modules/ecommerce/client-ecommerce.ts` | `/api/ecommerce/*` |

### Fetch Pattern (example from `client-categories.ts`)

Every client module follows the same pattern:

```ts
const { data: sessionData } = await defaultSupabase.auth.getSession();
const token = sessionData.session?.access_token;
const headers: HeadersInit = {};
if (token) headers['Authorization'] = `Bearer ${token}`;

const res = await fetch(`/api/categories?${params}`, { headers });
```

1. Get the Supabase session token
2. Attach it as `Authorization: Bearer <token>`
3. Fetch from `/api/...` (proxied to server via Vite dev proxy or same origin in prod)

### Server DB Modules (API handlers)

Server-side code that backs those endpoints:

| Module | Path |
|---|---|
| Categories | `server/src/products/serving/db/db-categories.ts` |
| Users/Profiles | `server/src/products/serving/db/db-user.ts` |
| Posts/Feed | `server/src/products/serving/db/db-posts.ts` |
| Pages | `server/src/products/serving/pages/` |

---

## Writing a New Test — Step by Step

### 1. Create the Spec File

```
tests/my-feature.spec.ts
```

### 2. Scaffold

```ts
import { test, expect } from '@playwright/test';
import { loginUser, TEST_CONFIG } from './test-commons';

test.describe('My Feature', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
    });

    test('should do the thing', async ({ page }) => {
        // Navigate
        await page.goto(`${TEST_CONFIG.APP_URL}/some/route`);
        await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });

        // Interact
        await page.click('button:has-text("Action")');

        // Assert
        await expect(page.locator('text=Success')).toBeVisible();
    });
});
```

### 3. Add a Convenience Script (Optional)

In `package.json`:

```json
"test:my-feature": "playwright test tests/my-feature.spec.ts --project=chromium --workers=1"
```

### 4. Run It

```bash
npx playwright test tests/my-feature.spec.ts --project=chromium
```

---

## Concrete Examples

### Example 1: Login + Navigate to a User Page

```ts
import { test, expect } from '@playwright/test';
import { loginUser, TEST_CONFIG } from './test-commons';

test.describe('User Page Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
    });

    test('loads user page and shows title', async ({ page }) => {
        const pageUrl = `${TEST_CONFIG.APP_URL}/user/${TEST_CONFIG.USER.ID}/pages/${TEST_CONFIG.TEST_PAGE.SLUG}`;
        await page.goto(pageUrl);
        await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });

        // Page title should be visible
        await expect(page.locator('h1, [data-testid="page-title-display"]'))
            .toContainText(TEST_CONFIG.TEST_PAGE.TITLE, { timeout: 10_000 });
    });
});
```

### Example 2: Enter Edit Mode + Ribbon Interaction

(See existing test: `tests/pages-meta.spec.ts`)

```ts
test('toggle page visibility in editor', async ({ page }) => {
    const pageUrl = `${TEST_CONFIG.APP_URL}/user/${TEST_CONFIG.USER.ID}/pages/${TEST_CONFIG.TEST_PAGE.SLUG}`;
    await page.goto(pageUrl);

    // Enter edit mode
    const editBtn = page.getByTestId('edit-mode-toggle');
    await editBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await editBtn.click();
    await expect(page.locator('.tracking-widest', { hasText: 'DESIGN' }))
        .toBeVisible({ timeout: 15_000 });

    // Toggle visibility
    const toggle = page.getByTestId('page-visibility-toggle');
    await toggle.click();
    await expect(toggle).toContainText('Hidden');
    await toggle.click();
    await expect(toggle).toContainText('Visible');
});
```

### Example 3: Stripe E2E Checkout Flow

Full reference: `tests/stripe-test.spec.ts`  
Key patterns:
- Uses `test.setTimeout(120_000)` for long flows
- Navigates through product page → cart → checkout
- Interacts with Stripe iframe via `page.frameLocator()`
- Verifies purchase completion

---

## Best Practices

1. **Always use `test-commons.ts`** — import `loginUser` and `TEST_CONFIG`
2. **Prefer `getByTestId()`** over fragile CSS selectors
3. **Use generous timeouts** for network-heavy operations (`15_000`+)
4. **Set `test.setTimeout`** for long flows (checkout, uploads)
5. **Clean up after yourself** — restore any data you mutate (see title rename test)
6. **Screenshot on failure** — already configured in `playwright.config.ts`
7. **Run with `--workers=1`** for tests that share server state
8. **Don't call Supabase directly** — fetch through `/api/...` endpoints (same as the app does)

---

## Existing Test Specs

| Spec | Tests | Script |
|---|---|---|
| `tests/home.spec.ts` | Home page feed, posts & pages | `npm run test:home` |
| `tests/post.spec.ts` | Post page | `npm run test:post` |
| `tests/responsive.spec.ts` | Mobile viewports | `npm run test:responsive` |
| `tests/pages-meta.spec.ts` | Page editor meta fields | `npm run test:pages-meta` |
| `tests/stripe-test.spec.ts` | Stripe checkout flow | `npm run test:stripe` |
| `tests/wizard.spec.ts` | Wizard flow | `npm run test:wizard` |
| `tests/cache.spec.ts` | Cache behavior | — |
| `tests/example.spec.ts` | Screenshot captures | `npm run screenshots` |
