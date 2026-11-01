# Translation Library Overview (`translate.ts`)

## Description
The `translate.ts` module serves as the core orchestration layer for the i18n package. It handles:
1.  Parsing and validating configuration options.
2.  Determining the translation mode (text vs. file).
3.  Resolving file paths and glob patterns.
4.  Dispatching files to appropriate translators based on file extension.
5.  Managing API interactions via the DeepL integration.

## Key Exports

### `translate(opts: IOptions)`
The main entry point for the translation process.
- **Parameters**: `opts` - Configuration object containing source paths, destination languages, API keys, etc.
- **Logic Flow**:
    1.  Validates required options (`api_key`, `src`/`text`, `dstLang`).
    2.  Resolves root paths and environmental variables.
    3.  Iterates through target languages (`dstLang`).
    4.  If `opts.text` is present: Calls `translateDeepL` directly for string translation.
    5.  If `opts.src` is present: Uses `p-map` to process files concurrently.

### `translateFiles(file, targets, options)`
Handles the translation of a specific file for a set of target languages.
- **Parameters**:
    - `file`: Source file path.
    - `targets`: Array of target file paths/languages.
    - `options`: Global configuration options.
- **Logic Flow**:
    1.  Identifies the correct translator using `getTranslator(file)`.
    2.  Checks for dry-run mode (`options.dry`).
    3.  Executes the translation for each target concurrently.

### `getTranslator(file: string)`
Utility function that returns the appropriate translator function based on the file extension.

## Supported File Types
The module uses a `TRANSLATORS` map to route files to specific handlers:

| Extension      | Handler           | Description |
| :--- | :--- | :--- |
| `.md`, `.html` | `translateMarkup` | Handles Markdown and HTML content preservation. |
| `.json`        | `translateJSON`   | Translates JSON values while preserving keys. |
| `.toml`        | `translateTOML`   | Translates TOML configuration files. |
| `.yaml`        | `translateYAML`   | Translates YAML configuration files. |
| `.xlsx`, `.xls`| `translateXLS`    | Handles Excel spreadsheet translation. |
| `.txt`         | `translateText`   | Simple text file translation. |

## Dependencies
- **`p-map`**: Used to manage concurrency for file processing and language iteration (limited to concurrency: 1 by default in `translateFiles`).
- **`path`**: For filesystem path resolution.
- **`@polymech/commons`**: specifically `globBase` for handling glob patterns in source paths.

## Glossary System

The package supports term consistency through a glossary system integrated with DeepL's glossary feature.

### 1. Storage Structure
Glossaries are stored locally in the configured `storeRoot` (default: `${OSR_ROOT}/i18n-store`):
-   **CSV Data**: `<storeRoot>/glossary/<SRC_LANG>/<DST_LANG>/glossary.csv` contains the term pairs.
-   **Metadata**: `<storeRoot>/glossary/<SRC_LANG>/<DST_LANG>/glossary.json` tracks the `glossaryId`, creation time, and content hash.

### 2. Synchronization Logic
To ensure the local glossary matches the one used by DeepL, the system checks for consistency before every translation request:

1.  **Hash Verification**: It calculates an MD5 hash of the local CSV file and compares it with the hash stored in the metadata file.
2.  **Auto-Update**:
    -   If the hashes differ (indicating local changes) or if the glossary is missing on the remote, it triggers an update.
    -   **Re-creation**: The old glossary is deleted from DeepL, and a new one is created using the current CSV content.
    -   **Metadata Update**: The new `glossaryId` and hash are saved locally.

### 3. Usage
When `translateDeepL` is called, it automatically:
-   Attempts to resolve/update the glossary for the requested language pair.
-   Injects the `glossary_id` into the DeepL API request options if a valid glossary exists.
