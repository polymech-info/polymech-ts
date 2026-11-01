/**
 * Product and Action Mapping Configuration
 * Defines all trackable products, their actions, and associated metadata
 */

export interface ProductActionConfig {
    endpoint: string;
    method: string;
    costUnits: number;
    cancellable?: boolean;  // Whether this action can be cancelled
    description?: string;
}

export interface ProductConfig {
    [action: string]: ProductActionConfig;
}

export const PRODUCT_ACTIONS: Record<string, ProductConfig> = {
    competitors: {
        search: {
            endpoint: '/api/competitors',
            method: 'GET',
            costUnits: 1.0,
            cancellable: true,  // Search can be cancelled
            description: 'Search for competitors in a location',
        },
        get_details: {
            endpoint: '/api/competitors/:place_id',
            method: 'GET',
            costUnits: 0.0,
            cancellable: false,  // Quick lookup, not cancellable
            description: 'Get details for a specific competitor',
        },
        stream: {
            endpoint: '/api/competitors/stream',
            method: 'GET',
            costUnits: 1.0,  // Same cost as regular search
            cancellable: true,
            description: 'Stream competitors in real-time',
        },
        find_email: {
            endpoint: '/api/find/email/{place_id}',
            method: 'GET',
            costUnits: 2.0,  // Higher cost due to Puppeteer usage
            cancellable: true,  // Long-running, can be cancelled
            description: 'Find email addresses for a business using Puppeteer',
        },
    },
    images: {
        upload: {
            endpoint: '/api/images',
            method: 'POST',
            costUnits: 2.0,
            cancellable: true,
            description: 'Upload an image',
        },
        get: {
            endpoint: '/api/images/:id',
            method: 'GET',
            costUnits: 0.05,
            cancellable: false,
            description: 'Retrieve an image',
        },
        update: {
            endpoint: '/api/images/:id',
            method: 'PUT',
            costUnits: 1.5,
            cancellable: false,
            description: 'Update image metadata',
        },
    },
    mock: {
        job: {
            endpoint: '/api/mock/job',
            method: 'POST',
            costUnits: 0.0,
            cancellable: true,
            description: 'Mock job for testing',
        },
    },
    // Add more products here as they are developed
} as const;

/**
 * Match a request path and method to a product and action
 */
export function identifyProductAction(path: string, method: string): {
    product: string | null;
    action: string | null;
    config: ProductActionConfig | null;
} {
    for (const [product, actions] of Object.entries(PRODUCT_ACTIONS)) {
        for (const [action, config] of Object.entries(actions)) {
            if (matchesRoute(path, config.endpoint) && method === config.method) {
                return { product, action, config };
            }
        }
    }
    return { product: null, action: null, config: null };
}

/**
 * Check if a path matches a route pattern (supports :param syntax)
 */
function matchesRoute(path: string, pattern: string): boolean {
    // Convert pattern to regex
    // e.g., '/api/competitors/:place_id' or '/api/competitors/{place_id}' -> /^\/api\/competitors\/[^\/]+$/
    const regexPattern = pattern
        .replace(/:[^\/]+/g, '[^/]+')      // Replace :param with regex
        .replace(/\{[^}]+\}/g, '[^/]+')     // Replace {param} with regex
        .replace(/\//g, '\\/');             // Escape slashes

    // Allow optional trailing slash
    const regex = new RegExp(`^${regexPattern}\\/?$`);
    return regex.test(path);
}

/**
 * Get all products
 */
export function getAllProducts(): string[] {
    return Object.keys(PRODUCT_ACTIONS);
}

/**
 * Get all actions for a product
 */
export function getProductActions(product: string): string[] {
    return Object.keys(PRODUCT_ACTIONS[product] || {});
}

/**
 * Get configuration for a specific product action
 */
export function getActionConfig(product: string, action: string): ProductActionConfig | null {
    return PRODUCT_ACTIONS[product]?.[action] || null;
}
