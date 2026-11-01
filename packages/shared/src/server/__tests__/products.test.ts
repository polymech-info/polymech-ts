import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { identifyProductAction, getActionConfig, getAllProducts, getProductActions } from '../config/products';

describe('Product Configuration', () => {
    describe('identifyProductAction', () => {
        it('should identify competitors search action', () => {
            const result = identifyProductAction('/api/competitors', 'GET');

            expect(result.product).toBe('competitors');
            expect(result.action).toBe('search');
            expect(result.config).toBeDefined();
            expect(result.config?.costUnits).toBe(1.0);
            expect(result.config?.cancellable).toBe(true);
        });

        it('should identify competitors get_details action with parameter', () => {
            const result = identifyProductAction('/api/competitors/ChIJd8BlQ2BZwokRAFUEcm_qrcA', 'GET');

            expect(result.product).toBe('competitors');
            expect(result.action).toBe('get_details');
            expect(result.config).toBeDefined();
            expect(result.config?.costUnits).toBe(0.0);
            expect(result.config?.cancellable).toBe(false);
        });

        it('should identify images upload action', () => {
            const result = identifyProductAction('/api/images', 'POST');

            expect(result.product).toBe('images');
            expect(result.action).toBe('upload');
            expect(result.config).toBeDefined();
            expect(result.config?.costUnits).toBe(2.0);
            expect(result.config?.cancellable).toBe(true);
        });

        it('should identify images get action with parameter', () => {
            const result = identifyProductAction('/api/images/abc123', 'GET');

            expect(result.product).toBe('images');
            expect(result.action).toBe('get');
            expect(result.config?.costUnits).toBe(0.05);
        });

        it('should return null for untracked endpoints', () => {
            const result = identifyProductAction('/api/unknown', 'GET');

            expect(result.product).toBeNull();
            expect(result.action).toBeNull();
            expect(result.config).toBeNull();
        });

        it('should return null for wrong method', () => {
            const result = identifyProductAction('/api/competitors', 'POST');

            expect(result.product).toBeNull();
            expect(result.action).toBeNull();
        });

        it('should handle multiple path parameters', () => {
            const result = identifyProductAction('/api/images/abc123/xyz789', 'GET');

            // Should not match since pattern is /api/images/:id
            expect(result.product).toBeNull();
        });
    });

    describe('getActionConfig', () => {
        it('should get config for valid product and action', () => {
            const config = getActionConfig('competitors', 'search');

            expect(config).toBeDefined();
            expect(config?.endpoint).toBe('/api/competitors');
            expect(config?.method).toBe('GET');
            expect(config?.costUnits).toBe(1.0);
        });

        it('should return null for invalid product', () => {
            const config = getActionConfig('invalid', 'search');

            expect(config).toBeNull();
        });

        it('should return null for invalid action', () => {
            const config = getActionConfig('competitors', 'invalid');

            expect(config).toBeNull();
        });
    });

    describe('getAllProducts', () => {
        it('should return all product names', () => {
            const products = getAllProducts();

            expect(Array.isArray(products)).toBe(true);
            expect(products).toContain('competitors');
            expect(products).toContain('images');
            expect(products.length).toBeGreaterThan(0);
        });
    });

    describe('getProductActions', () => {
        it('should return all actions for competitors product', () => {
            const actions = getProductActions('competitors');

            expect(Array.isArray(actions)).toBe(true);
            expect(actions).toContain('search');
            expect(actions).toContain('get_details');
        });

        it('should return all actions for images product', () => {
            const actions = getProductActions('images');

            expect(Array.isArray(actions)).toBe(true);
            expect(actions).toContain('upload');
            expect(actions).toContain('get');
            expect(actions).toContain('update');
        });

        it('should return empty array for invalid product', () => {
            const actions = getProductActions('invalid');

            expect(Array.isArray(actions)).toBe(true);
            expect(actions.length).toBe(0);
        });
    });

    describe('Cost Units', () => {
        it('should have consistent cost units across products', () => {
            const competitorsSearch = getActionConfig('competitors', 'search');
            const competitorsDetails = getActionConfig('competitors', 'get_details');
            const imagesUpload = getActionConfig('images', 'upload');
            const imagesGet = getActionConfig('images', 'get');

            // Search/upload should be more expensive than get
            expect(competitorsSearch?.costUnits).toBeGreaterThan(competitorsDetails?.costUnits || 0);
            expect(imagesUpload?.costUnits).toBeGreaterThan(imagesGet?.costUnits || 0);

            // All cost units should be non-negative
            expect(competitorsSearch?.costUnits).toBeGreaterThan(0);
            expect(competitorsDetails?.costUnits).toBeGreaterThanOrEqual(0);
            expect(imagesUpload?.costUnits).toBeGreaterThan(0);
            expect(imagesGet?.costUnits).toBeGreaterThan(0);
        });
    });

    describe('Cancellable Actions', () => {
        it('should mark long-running actions as cancellable', () => {
            const competitorsSearch = getActionConfig('competitors', 'search');
            const imagesUpload = getActionConfig('images', 'upload');

            expect(competitorsSearch?.cancellable).toBe(true);
            expect(imagesUpload?.cancellable).toBe(true);
        });

        it('should mark quick actions as non-cancellable', () => {
            const competitorsDetails = getActionConfig('competitors', 'get_details');
            const imagesGet = getActionConfig('images', 'get');

            expect(competitorsDetails?.cancellable).toBe(false);
            expect(imagesGet?.cancellable).toBe(false);
        });
    });
});
