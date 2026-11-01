import { E_Sanitize } from "./name.js";
export declare enum E_PathError {
    NONE = 0,
    INVALID_CHAR = 1,// Invalid characters in path segments
    RESERVED_NAME = 2,// Contains a Windows reserved filename
    LEADING_TRAILING_SPACE = 4,// Segment has leading/trailing spaces
    PATH_TOO_LONG = 8
}
export declare function sanitize(filePath: string, flags?: E_Sanitize): string;
export interface I_PathValidationResult {
    isValid: boolean;
    errorFlags: number;
}
export declare function validatePath(filePath?: string): I_PathValidationResult;
export declare function renameFileIfNeeded(filePath: string, flags: E_Sanitize): string;
