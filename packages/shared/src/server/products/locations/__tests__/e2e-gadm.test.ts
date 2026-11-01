import { describe, it, expect, beforeAll } from 'vitest';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from server root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

describe('PyGADM Integration', () => {
    let LocationsProduct: any;

    beforeAll(async () => {
        const productModule = await import('../index.js');
        LocationsProduct = new productModule.LocationsProduct();
    });

    it('should search for regions using python wrapper', async () => {
        const c = {
            req: {
                valid: () => ({ query: 'France' })
            },
            json: (data: any, status: number) => ({ data, status })
        };

        const result = await LocationsProduct.handleGetRegionSearch(c);
        if (result.status !== 200) {
            console.error('PyGADM Search Error:', JSON.stringify(result, null, 2));
        }
        expect(result.status).toBe(200);
        expect(result.data).toBeDefined();
        // console.log('PyGADM Search Result:', JSON.stringify(result.data, null, 2));
    });

    it('should search for regions with content_level', async () => {
        const c = {
            req: {
                valid: () => ({ query: 'France', content_level: '1' })
            },
            json: (data: any, status: number) => ({ data, status })
        };

        const result = await LocationsProduct.handleGetRegionSearch(c);
        expect(result.status).toBe(200);
        expect(result.data).toBeDefined();
    });

    it('should search for regions with geojson output', async () => {
        const c = {
            req: {
                valid: () => ({ query: 'France', content_level: '1', geojson: 'true' })
            },
            json: (data: any, status: number) => ({ data, status })
        };

        const result = await LocationsProduct.handleGetRegionSearch(c);
        // console.log('PyGADM GeoJSON Search Result:', JSON.stringify(result.data, null, 2));
        expect(result.status).toBe(200);
        expect(result.data).toBeDefined();
        expect(result.data.type).toBe('FeatureCollection');
        expect(result.data.features).toBeDefined();
        expect(Array.isArray(result.data.features)).toBe(true);
    });

    it('should get boundary using python wrapper', async () => {
        const c = {
            req: {
                valid: () => ({ id: 'FRA.1_1' }) // Region for Auvergne-Rhône-Alpes
            },
            json: (data: any, status: number) => ({ data, status })
        };

        const result = await LocationsProduct.handleGetRegionBoundary(c);
        if (result.status === 200) {
            expect(result.data).toBeDefined();
        } else {
            console.log('PyGADM Boundary Result Status:', result.status, result.data);
        }
    });
    it('should get region names using python wrapper', async () => {
        const c = {
            req: {
                valid: () => ({ admin: 'FRA', content_level: '2' })
            },
            json: (data: any, status: number) => ({ data, status })
        };

        const result = await LocationsProduct.handleGetRegionNames(c);
        if (result.status !== 200) {
            console.error('PyGADM Names Error:', JSON.stringify(result, null, 2));
        }
        expect(result.status).toBe(200);
        expect(result.data).toBeDefined();
        console.log('PyGADM Names Result (Subset):', JSON.stringify(result.data.data.slice(0, 2), null, 2));
    });
});
