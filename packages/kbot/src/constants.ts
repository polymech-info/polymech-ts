export const MODULE_NAME = 'kbot'
export const EXCLUDE_GLOB = [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/coverage/**",
    "*.log",
    `.${MODULE_NAME}`,
    ".git"
]
export const MAX_FILE_SIZE = 1024 * 1024 * 2
export const API_PREFIX = 'osr'
export const PREFERENCES_FILE_NAME = 'preferences.md'
export const LOGGING_DIRECTORY = `.${MODULE_NAME}`
