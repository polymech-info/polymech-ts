import { z } from '@hono/zod-openapi';
import { CompetitorResponseSchema, CompetitorDetailResponseSchema } from '@polymech/shared';

// Define Request Schema locally for server/OpenAPI compatibility
export const LocationRequestSchema = z.object({
    query: z.string().default('plastichub'),
    location: z.string().optional().default('barcelona, spain'),
    refresh: z.string().optional().default('false'),
    filterCountry: z.string().optional(),
    filterCity: z.string().optional(),
    filterContinent: z.string().optional(),
    filterType: z.string().optional(),
    concurrency: z.string().optional().default('5'),
    limit: z.string().optional().default('250'),
    zoom: z.string().optional().describe('Map zoom level'),
    excludedTypes: z.union([z.string(), z.array(z.string())]).optional().transform((val) => {
        if (!val) return undefined;
        if (typeof val === 'string') return [val];
        return val;
    }),
});

export const LocationResponseSchema = CompetitorResponseSchema;
export const LocationDetailResponseSchema = CompetitorDetailResponseSchema;

export type LocationRequest = z.infer<typeof LocationRequestSchema>;
export type LocationResponse = z.infer<typeof LocationResponseSchema>;
export type LocationDetailResponse = z.infer<typeof LocationDetailResponseSchema>;
