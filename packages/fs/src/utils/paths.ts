import path from "node:path"
import os from "node:os"

import { sanitizeFilename, validateFilename, E_FilenameError, E_Sanitize } from "./name.js"
import { sync as move } from "../move.js"
import { sync as exists } from "../exists.js"

export enum E_PathError {
	NONE = 0,
	INVALID_CHAR = 1 << 0,        // Invalid characters in path segments
	RESERVED_NAME = 1 << 1,       // Contains a Windows reserved filename
	LEADING_TRAILING_SPACE = 1 << 2, // Segment has leading/trailing spaces
	PATH_TOO_LONG = 1 << 3        // Path exceeds Windows MAX_PATH limit
}

export function sanitize(filePath: string, flags: E_Sanitize = E_Sanitize.REMOVE_EMOJIS): string {
	const segments = path.normalize(filePath).split(path.sep);
	const sanitizedSegments = segments.map(segment => sanitizeFilename(segment, flags))
	return sanitizedSegments.join(path.sep)
}

export interface I_PathValidationResult {
	isValid: boolean;
	errorFlags: number;
}

export function validatePath(filePath: string = ""): I_PathValidationResult {
	let errorFlags = E_PathError.NONE;
	
	// Check for Windows MAX_PATH limit
	if (os.platform() === "win32" && filePath.length > 260) {
		errorFlags |= E_PathError.PATH_TOO_LONG;
	}

	const segments = path.normalize(filePath).split(path.sep);

	for (const segment of segments) {
		if (!segment) continue
		const validation = validateFilename(segment)

		if (validation.errorFlags & E_FilenameError.INVALID_CHAR) {
			errorFlags |= E_PathError.INVALID_CHAR;
		}

		if (validation.errorFlags & E_FilenameError.RESERVED_NAME) {
			errorFlags |= E_PathError.RESERVED_NAME;
		}

		if (validation.errorFlags & E_FilenameError.LEADING_TRAILING_SPACE) {
			errorFlags |= E_PathError.LEADING_TRAILING_SPACE;
		}
	}
	return {
		isValid: errorFlags === E_PathError.NONE,
		errorFlags
	}
}

export function renameFileIfNeeded(filePath: string, flags: E_Sanitize): string {
	if(!exists(filePath)) {
		return filePath
	}
    const dir = path.dirname(filePath)
    const originalFilename = path.basename(filePath)
    const sanitizedFilename = sanitizeFilename(originalFilename, flags)
    if (originalFilename === sanitizedFilename) {
        return filePath;
    }
	const newPath = path.join(dir, sanitizedFilename)
    try {
        move(filePath, newPath)
        return newPath
    } catch (error) {
        return filePath
    }
}