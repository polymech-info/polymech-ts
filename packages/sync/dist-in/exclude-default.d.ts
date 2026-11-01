/**
 * Default exclusion list for VFS directory listings.
 * Entries are matched against file/directory names (not full paths).
 */
export declare const DEFAULT_EXCLUDES: readonly string[];
/** Returns true if the name should be excluded from listings. */
export declare function isExcluded(name: string): boolean;
/**
 * Build a copy filter for the default profile. Only path segments *relative to `sourceRoot`*
 * are checked — the full absolute path can contain unrelated segments (e.g. a repo `packages/`
 * folder) that would otherwise match {@link DEFAULT_EXCLUDES} by mistake.
 */
export declare function makeDefaultSyncPathFilter(sourceRoot: string): (absolutePath: string) => boolean;
