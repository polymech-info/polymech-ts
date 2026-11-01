import * as path from 'path';
/**
 * Default exclusion list for VFS directory listings.
 * Entries are matched against file/directory names (not full paths).
 */
export const DEFAULT_EXCLUDES = [
    //internals 
    'vfs-settings.json',
    // Version control
    '.git',
    '.svn',
    '.hg',
    // Node / JS
    'node_modules',
    '.npm',
    '.yarn',
    '.pnp.cjs',
    '.pnp.loader.mjs',
    // OS junk — Windows
    'Thumbs.db',
    'desktop.ini',
    'ehthumbs.db',
    // OS junk — macOS
    '.DS_Store',
    '.AppleDouble',
    '.LSOverride',
    '.Spotlight-V100',
    '.Trashes',
    '.fseventsd',
    '.TemporaryItems',
    '__MACOSX',
    // IDE / editor
    '.vscode',
    '.idea',
    '.fleet',
    // Environment / secrets
    '.env',
    '.env.local',
    '.env.production',
    // Build / cache / output
    '.cache',
    '.turbo',
    '.next',
    '.nuxt',
    '.parcel-cache',
    '.tsbuildinfo',
    '.angular',
    '.svelte-kit',
    // Python
    '__pycache__',
    '.venv',
    'venv',
    '.eggs',
    '.mypy_cache',
    '.pytest_cache',
    '.ruff_cache',
    // Rust
    'target',
    // Coverage / test output
    'coverage',
    '.nyc_output',
    // Logs
    'npm-debug.log',
    'yarn-debug.log',
    'yarn-error.log',
    // Misc dev
    '.terraform',
    '.vagrant',
    'bower_components',
    // C / C++ / CMake
    'CMakeFiles',
    'CMakeCache.txt',
    'cmake_install.cmake',
    'CMakeScripts',
    'out',
    'compile_commands.json',
    // Visual Studio
    '.vs',
    'Debug',
    'Release',
    'x64',
    'x86',
    'ipch',
    'packages',
    'TestResults',
];
/** Returns true if the name should be excluded from listings. */
export function isExcluded(name) {
    if (name.startsWith('.'))
        return true; // all dot-files / dot-dirs
    return DEFAULT_EXCLUDES.includes(name);
}
/**
 * Build a copy filter for the default profile. Only path segments *relative to `sourceRoot`*
 * are checked — the full absolute path can contain unrelated segments (e.g. a repo `packages/`
 * folder) that would otherwise match {@link DEFAULT_EXCLUDES} by mistake.
 */
export function makeDefaultSyncPathFilter(sourceRoot) {
    const root = path.resolve(sourceRoot);
    return (absolutePath) => {
        if (!absolutePath)
            return false;
        const rel = path.relative(root, path.resolve(absolutePath));
        if (rel.startsWith('..')) {
            return true;
        }
        for (const seg of rel.split(/[/\\]+/)) {
            if (seg && isExcluded(seg)) {
                return false;
            }
        }
        return true;
    };
}
