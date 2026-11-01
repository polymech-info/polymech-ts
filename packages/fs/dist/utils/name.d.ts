export declare enum E_FilenameError {
    NONE = 0,// No error
    EMPTY = 1,// Empty or whitespace-only filename
    INVALID_CHAR = 2,// Contains invalid characters
    RESERVED_NAME = 4,// Matches a reserved system name
    LEADING_TRAILING_SPACE = 8,// Starts/ends with space
    ONLY_DOTS = 16
}
export declare enum E_Sanitize {
    NONE = 0,
    LOWERCASE = 1,// Convert to lowercase
    REPLACE_WHITESPACE = 2,// Replace spaces with underscores
    REMOVE_EMOJIS = 4
}
export interface I_ValidationResult {
    isValid: boolean;
    errorFlags: number;
}
/**
 * Sanitizes a filename by removing invalid characters and normalizing it.
 *
 * @param filename - The original filename
 * @param options - Configuration options
 * @returns Sanitized filename
 */
export declare function sanitizeFilename(filename?: string, flags?: E_Sanitize): string;
/**
 * Validates a filename and returns a flag-based error representation.
 *
 * @param filename - The filename to validate
 * @returns I_ValidationResult object with bitwise error flags
 */
export declare function validateFilename(filename: string): I_ValidationResult;
