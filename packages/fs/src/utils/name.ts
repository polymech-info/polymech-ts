import { debug } from 'console';
import { EMOJIES_ALL, EMOJIES_MIN, EMOJIES_STD } from '../constants.js'

const RESERVED_NAMES = new Set([
    "con", "prn", "aux", "nul",
    "com1", "com2", "com3", "com4", "com5", "com6", "com7", "com8", "com9",
    "lpt1", "lpt2", "lpt3", "lpt4", "lpt5", "lpt6", "lpt7", "lpt8", "lpt9"
]);

// Validation error flags (bitwise)
export enum E_FilenameError {
    NONE = 0,                  // No error
    EMPTY = 1 << 0,            // Empty or whitespace-only filename
    INVALID_CHAR = 1 << 1,     // Contains invalid characters
    RESERVED_NAME = 1 << 2,    // Matches a reserved system name
    LEADING_TRAILING_SPACE = 1 << 3, // Starts/ends with space
    ONLY_DOTS = 1 << 4         // Filename is only "." or ".."
}

export enum E_Sanitize {
    NONE = 0,
    LOWERCASE = 1 << 0,      // Convert to lowercase
    REPLACE_WHITESPACE = 1 << 1,  // Replace spaces with underscores
    REMOVE_EMOJIS = 1 << 2   // Remove emoji characters
}

export interface I_ValidationResult {
    isValid: boolean;       // Overall validation status
    errorFlags: number;     // Bitwise error representation
}

/**
 * Sanitizes a filename by removing invalid characters and normalizing it.
 * 
 * @param filename - The original filename
 * @param options - Configuration options
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string = "", flags: E_Sanitize = E_Sanitize.REPLACE_WHITESPACE | E_Sanitize.REMOVE_EMOJIS): string {
    
    let sanitized = filename
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Strip accents
        .replace(/[^\w.\- ]/g, "") // Keep only alphanumeric, dot, hyphen, underscore, and space
        .trim(); // Remove leading/trailing spaces

    // Replace spaces with underscores if flag is set
    if (flags & E_Sanitize.REPLACE_WHITESPACE) {
        sanitized = sanitized.replace(/\s+/g, "_")
    }

    // Convert to lowercase if flag is set
    if (flags & E_Sanitize.LOWERCASE) {
        sanitized = sanitized.toLowerCase()
    }
    // Prevent empty filenames
    if (!sanitized || sanitized === "." || sanitized === "..") {
        return "untitled"
    }
    // Prevent reserved names (Windows)
    if (RESERVED_NAMES.has(sanitized.toLowerCase())) {
        return sanitized + "_safe"
    }

    // Prevent filenames that are just dots or empty
    if (!sanitized || sanitized === "." || sanitized === "..") {
        return "untitled"
    }

    // Remove emojis if flag is set
    if (flags & E_Sanitize.REMOVE_EMOJIS) {
        sanitized = sanitized.replace(EMOJIES_STD, "")
    }

    return sanitized
}

/**
 * Validates a filename and returns a flag-based error representation.
 * 
 * @param filename - The filename to validate
 * @returns I_ValidationResult object with bitwise error flags
 */
export function validateFilename(filename: string): I_ValidationResult {
    let errorFlags = E_FilenameError.NONE;
    const trimmed = filename.trim();

    if (!trimmed) {
        errorFlags |= E_FilenameError.EMPTY;
    }

    // Detect invalid characters (only allow alphanumeric, dot, hyphen, underscore)
    if (/[^a-zA-Z0-9._-]/.test(filename)) {
        errorFlags |= E_FilenameError.INVALID_CHAR;
    }

    // Prevent reserved filenames (Windows)
    if (RESERVED_NAMES.has(filename.toLowerCase())) {
        errorFlags |= E_FilenameError.RESERVED_NAME;
    }

    // Check for leading or trailing spaces
    if (/^\s|\s$/.test(filename)) {
        errorFlags |= E_FilenameError.LEADING_TRAILING_SPACE;
    }

    // Prevent filenames that are only "." or ".."
    if (filename === "." || filename === "..") {
        errorFlags |= E_FilenameError.ONLY_DOTS;
    }

    return {
        isValid: errorFlags === E_FilenameError.NONE,
        errorFlags
    };
}