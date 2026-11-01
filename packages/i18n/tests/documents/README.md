# @polymech/deepl-mark

Translate markdown and MDX content using [DeepL](https://www.deepl.com/), powered by `mdast`.

Correctly handles headings, paragraphs, lists, tables (GFM), links, JSX components, frontmatter, and inline formatting — preserving structure while translating only the text.

## Install

```bash
npm install @polymech/deepl-mark
```

## Usage

```ts
import { translate } from '@polymech/deepl-mark';

const markdown = '# Hello World\n\nThis is a paragraph.';
const result = await translate(markdown, 'en', 'de');

console.log(result);
// # Hallo Welt
//
// Dies ist ein Absatz.
```

### Authentication

Provide your DeepL API key via **options** or **environment variable**:

```ts
// Option 1: pass directly
await translate(md, 'en', 'de', { apiKey: 'your-deepl-key' });

// Option 2: environment variable
// Set DEEPL_AUTH_KEY=your-deepl-key
await translate(md, 'en', 'de');
```

### Options

The optional 4th argument accepts a `TranslateOptions` object:

```ts
await translate(content, 'en', 'de', {
  // DeepL API key (falls back to DEEPL_AUTH_KEY env var)
  apiKey: '...',

  // DeepL translation options (tagHandling, splitSentences, formality, glossaryId, etc.)
  deeplOptions: {
    formality: 'more',
    glossaryId: '...',
  },

  // Frontmatter fields to include/exclude
  frontmatterFields: {
    include: ['title', 'description'],
    exclude: ['slug'],
  },

  // Markdown node types to include/exclude (defaults: exclude 'code')
  markdownNodes: {
    exclude: ['code'],
  },

  // HTML elements to include/exclude
  htmlElements: {
    exclude: ['pre', 'code'],
  },

  // JSX components to include/exclude (with attribute-level control)
  jsxComponents: {
    include: {
      Card: { children: true, attributes: ['header'] },
    },
  },
});
```

#### DeepL defaults

The following DeepL options are applied by default and can be overridden via `deeplOptions`:

| Option           | Default        |
|------------------|----------------|
| `tagHandling`    | `'html'`       |
| `splitSentences` | `'nonewlines'` |

### Supported content

- **Markdown** (`.md`) — headings, paragraphs, lists, blockquotes, tables (GFM), links, images
- **MDX** (`.mdx`) — JSX components and expressions
- **Frontmatter** — YAML frontmatter fields
- **HTML** — inline HTML elements and attributes

## API

### `translate(content, sourceLang, targetLang, options?)`

| Parameter    | Type                   | Description                                   |
|--------------|------------------------|-----------------------------------------------|
| `content`    | `string`               | Markdown or MDX string to translate            |
| `sourceLang` | `SourceLanguageCode`   | Source language (e.g. `'en'`, `'de'`, `'fr'`)  |
| `targetLang` | `TargetLanguageCode`   | Target language (e.g. `'de'`, `'en-US'`)       |
| `options`    | `TranslateOptions`     | Optional config (see above)                    |

Returns `Promise<string>` — the translated markdown.

## Scripts

```bash
npm test              # run all tests
npm run test:tables   # run table translation e2e test
npm run build         # build for distribution
```

## License

MIT
