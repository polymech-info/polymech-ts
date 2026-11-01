export function pick(obj, path, options) {
    // Determine separator (default to "/")
    const separator = options?.separator ?? "/";
    // Split the path into keys
    const keys = path.split(separator);
    // Traverse the object
    let current = obj;
    for (const key of keys) {
        if (current == null || !(key in current)) {
            // If we can't go further, return defaultValue (if provided)
            return options?.defaultValue
                ?? undefined;
        }
        current = current[key];
    }
    // If we successfully traversed the entire path, return the value
    return current;
}
//# sourceMappingURL=pick.js.map