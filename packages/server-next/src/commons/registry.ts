/**
 * Registry for public endpoints that don't require authentication
 */
export class PublicEndpointRegistry {
    private static registry = new Set<string>();

    static register(path: string, method: string) {
        this.registry.add(`${method.toUpperCase()}:${path}`);
    }

    static getAll(): Array<{ path: string; method: string }> {
        return Array.from(this.registry).map(entry => {
            // Split only on the FIRST colon (METHOD:PATH)
            // Don't split on colons in path parameters like :identifier
            const colonIndex = entry.indexOf(':');
            const method = entry.substring(0, colonIndex);
            const path = entry.substring(colonIndex + 1);
            return { path, method };
        });
    }

    static isPublic(path: string, method: string): boolean {
        const methodUpper = method.toUpperCase();

        for (const registered of this.registry) {
            // Split only on the FIRST colon (METHOD:PATH)
            // Don't split on colons in path parameters like :identifier
            const colonIndex = registered.indexOf(':');
            const regMethod = registered.substring(0, colonIndex);
            const regPath = registered.substring(colonIndex + 1);

            if (regMethod !== methodUpper) continue;

            // Check if path matches pattern
            if (this.matchesRoute(path, regPath)) {
                return true;
            }
        }
        // Debug: log when a route is not found as public
        //  console.log(`[PublicEndpointRegistry] Route not found as public: ${methodUpper} ${path}`);
        //  console.log(`[PublicEndpointRegistry] Registered routes:`, Array.from(this.registry));
        return false;
    }

    private static matchesRoute(path: string, pattern: string): boolean {
        // Convert pattern to regex
        // Handle both :param (Express/Hono style) and {param} (OpenAPI style)
        // e.g., '/api/competitors/:place_id' or '/api/competitors/{place_id}' -> /^\/api\/competitors\/[^\/]+$/
        const regexPattern = pattern
            .replace(/:[^\\/]+/g, '[^/]+')      // Replace :param with regex
            .replace(/\{[^}]+\}/g, '[^/]+')     // Replace {param} with regex
            .replace(/\/\*$/, '/.*')           // Replace /* with /.*
            .replace(/\//g, '\\/');

        // Allow optional trailing slash
        const regex = new RegExp(`^${regexPattern}\\/?$`);
        return regex.test(path);
    }
}

/**
 * Registry for admin-only endpoints
 */
export class AdminEndpointRegistry {
    private static registry = new Set<string>();

    static register(path: string, method: string) {
        this.registry.add(`${method.toUpperCase()}:${path}`);
    }

    static isAdmin(path: string, method: string): boolean {
        const methodUpper = method.toUpperCase();

        for (const registered of this.registry) {
            // Split only on FIRST colon (METHOD:PATH); paths may contain ":param"
            const colonIndex = registered.indexOf(':');
            if (colonIndex === -1) continue;
            const regMethod = registered.substring(0, colonIndex);
            const regPath = registered.substring(colonIndex + 1);

            if (regMethod !== methodUpper) continue;

            if (this.matchesRoute(path, regPath)) {
                return true;
            }
        }
        return false;
    }

    private static matchesRoute(path: string, pattern: string): boolean {
        // Convert pattern to regex
        // Handle both :param (Express/Hono style) and {param} (OpenAPI style)
        // e.g., '/api/competitors/:place_id' or '/api/competitors/{place_id}' -> /^\/api\/competitors\/[^\/]+$/
        const regexPattern = pattern
            .replace(/:[^\\/]+/g, '[^/]+')      // Replace :param with regex
            .replace(/\{[^}]+\}/g, '[^/]+')     // Replace {param} with regex
            .replace(/\/\*$/, '/.*')           // Replace /* with /.*
            .replace(/\//g, '\\/');

        const regex = new RegExp(`^${regexPattern}\\/?$`);
        return regex.test(path);
    }
}
