import { EMOJIES_STD } from '../constants.js';
const RESERVED_NAMES = new Set([
    "con", "prn", "aux", "nul",
    "com1", "com2", "com3", "com4", "com5", "com6", "com7", "com8", "com9",
    "lpt1", "lpt2", "lpt3", "lpt4", "lpt5", "lpt6", "lpt7", "lpt8", "lpt9"
]);
// Validation error flags (bitwise)
export var E_FilenameError;
(function (E_FilenameError) {
    E_FilenameError[E_FilenameError["NONE"] = 0] = "NONE";
    E_FilenameError[E_FilenameError["EMPTY"] = 1] = "EMPTY";
    E_FilenameError[E_FilenameError["INVALID_CHAR"] = 2] = "INVALID_CHAR";
    E_FilenameError[E_FilenameError["RESERVED_NAME"] = 4] = "RESERVED_NAME";
    E_FilenameError[E_FilenameError["LEADING_TRAILING_SPACE"] = 8] = "LEADING_TRAILING_SPACE";
    E_FilenameError[E_FilenameError["ONLY_DOTS"] = 16] = "ONLY_DOTS"; // Filename is only "." or ".."
})(E_FilenameError || (E_FilenameError = {}));
export var E_Sanitize;
(function (E_Sanitize) {
    E_Sanitize[E_Sanitize["NONE"] = 0] = "NONE";
    E_Sanitize[E_Sanitize["LOWERCASE"] = 1] = "LOWERCASE";
    E_Sanitize[E_Sanitize["REPLACE_WHITESPACE"] = 2] = "REPLACE_WHITESPACE";
    E_Sanitize[E_Sanitize["REMOVE_EMOJIS"] = 4] = "REMOVE_EMOJIS"; // Remove emoji characters
})(E_Sanitize || (E_Sanitize = {}));
/**
 * Sanitizes a filename by removing invalid characters and normalizing it.
 *
 * @param filename - The original filename
 * @param options - Configuration options
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename = "", flags = E_Sanitize.REPLACE_WHITESPACE | E_Sanitize.REMOVE_EMOJIS) {
    let sanitized = filename
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Strip accents
        .replace(/[^\w.\- ]/g, "") // Keep only alphanumeric, dot, hyphen, underscore, and space
        .trim(); // Remove leading/trailing spaces
    // Replace spaces with underscores if flag is set
    if (flags & E_Sanitize.REPLACE_WHITESPACE) {
        sanitized = sanitized.replace(/\s+/g, "_");
    }
    // Convert to lowercase if flag is set
    if (flags & E_Sanitize.LOWERCASE) {
        sanitized = sanitized.toLowerCase();
    }
    // Prevent empty filenames
    if (!sanitized || sanitized === "." || sanitized === "..") {
        return "untitled";
    }
    // Prevent reserved names (Windows)
    if (RESERVED_NAMES.has(sanitized.toLowerCase())) {
        return sanitized + "_safe";
    }
    // Prevent filenames that are just dots or empty
    if (!sanitized || sanitized === "." || sanitized === "..") {
        return "untitled";
    }
    // Remove emojis if flag is set
    if (flags & E_Sanitize.REMOVE_EMOJIS) {
        sanitized = sanitized.replace(EMOJIES_STD, "");
    }
    return sanitized;
}
/**
 * Validates a filename and returns a flag-based error representation.
 *
 * @param filename - The filename to validate
 * @returns I_ValidationResult object with bitwise error flags
 */
export function validateFilename(filename) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmFtZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9uYW1lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBNEIsV0FBVyxFQUFFLE1BQU0saUJBQWlCLENBQUE7QUFFdkUsTUFBTSxjQUFjLEdBQUcsSUFBSSxHQUFHLENBQUM7SUFDM0IsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSztJQUMxQixNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU07SUFDdEUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNO0NBQ3pFLENBQUMsQ0FBQztBQUVILG1DQUFtQztBQUNuQyxNQUFNLENBQU4sSUFBWSxlQU9YO0FBUEQsV0FBWSxlQUFlO0lBQ3ZCLHFEQUFRLENBQUE7SUFDUix1REFBYyxDQUFBO0lBQ2QscUVBQXFCLENBQUE7SUFDckIsdUVBQXNCLENBQUE7SUFDdEIseUZBQStCLENBQUE7SUFDL0IsZ0VBQWtCLENBQUEsQ0FBUywrQkFBK0I7QUFDOUQsQ0FBQyxFQVBXLGVBQWUsS0FBZixlQUFlLFFBTzFCO0FBRUQsTUFBTSxDQUFOLElBQVksVUFLWDtBQUxELFdBQVksVUFBVTtJQUNsQiwyQ0FBUSxDQUFBO0lBQ1IscURBQWtCLENBQUE7SUFDbEIsdUVBQTJCLENBQUE7SUFDM0IsNkRBQXNCLENBQUEsQ0FBRywwQkFBMEI7QUFDdkQsQ0FBQyxFQUxXLFVBQVUsS0FBVixVQUFVLFFBS3JCO0FBT0Q7Ozs7OztHQU1HO0FBQ0gsTUFBTSxVQUFVLGdCQUFnQixDQUFDLFdBQW1CLEVBQUUsRUFBRSxRQUFvQixVQUFVLENBQUMsa0JBQWtCLEdBQUcsVUFBVSxDQUFDLGFBQWE7SUFFaEksSUFB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