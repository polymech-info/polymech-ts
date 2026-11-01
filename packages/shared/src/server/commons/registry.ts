import { ProductActionConfig, PRODUCT_ACTIONS } from '../config/products.js';

export interface BillableFunctionConfig extends ProductActionConfig {
    productId: string;
    actionId: string;
}

/**
 * Central registry for all billable functions
 * Manages configuration, costs, and metadata
 */
export class FunctionRegistry {
    private static registry = new Map<string, BillableFunctionConfig>();
    private static initialized = false;

    /**
     * Initialize the registry with default configurations
     */
    static initialize() {
        if (this.initialized) return;

        // Load legacy PRODUCT_ACTIONS
        for (const [productId, actions] of Object.entries(PRODUCT_ACTIONS)) {
            for (const [actionId, config] of Object.entries(actions)) {
                this.register({
                    productId,
                    actionId,
                    ...config
                });
            }
        }

        this.initialized = true;
    }

    /**
     * Register a new billable function
     */
    static register(config: BillableFunctionConfig) {
        const key = this.getKey(config.productId, config.actionId);
        this.registry.set(key, config);
    }

    /**
     * Get configuration for a specific function
     */
    static get(productId: string, actionId: string): BillableFunctionConfig | null {
        if (!this.initialized) this.initialize();
        const key = this.getKey(productId, actionId);
        return this.registry.get(key) || null;
    }

    /**
     * Get all registered functions
     */
    static getAll(): BillableFunctionConfig[] {
        if (!this.initialized) this.initialize();
        return Array.from(this.registry.values());
    }

    /**
     * Find a configuration by matching route endpoint and method
     * (Used for middleware backward compatibility)
     */
    static findByRoute(path: string, method: string): BillableFunctionConfig | null {
        if (!this.initialized) this.initialize();

        for (const config of this.registry.values()) {
            if (this.matchesRoute(path, config.endpoint) && method === config.method) {
                return config;
            }
        }
        return null;
    }

    private static getKey(productId: string, actionId: string): string {
        return `${productId}:${actionId}`;
    }

    private static matchesRoute(path: string, pattern: string): boolean {
        // Convert pattern to regex
        // Handle both :param (Express/Hono style) and {param} (OpenAPI style)
        // e.g., '/api/competitors/:place_id' or '/api/competitors/{place_id}' -> /^\/api\/competitors\/[^\/]+$/
        const regexPattern = pattern
            .replace(/:[^\\/]+/g, '[^/]+')      // Replace :param with regex
            .replace(/\{[^}]+\}/g, '[^/]+')     // Replace {param} with regex
            .replace(/\//g, '\\/');

        // Allow optional trailing slash
        const regex = new RegExp(`^${regexPattern}\\/?$`);
        return regex.test(path);
    }
}

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
            .replace(/:[^\/]+/g, '[^/]+')      // Replace :param with regex
            .replace(/\{[^}]+\}/g, '[^/]+')     // Replace {param} with regex
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
            const [regMethod, regPath] = registered.split(':');

            if (regMethod !== methodUpper) continue;

            // Check if path matches pattern
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
            .replace(/\//g, '\\/');

        const regex = new RegExp(`^${regexPattern}\\/?$`);
        return regex.test(path);
    }
}
