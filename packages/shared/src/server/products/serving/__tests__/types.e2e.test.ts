import { describe, it, expect, beforeAll } from 'vitest';
import { app } from '@/index.js';
import pino from 'pino';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Dedicated Test Logger
const testLogFile = path.join(logsDir, 'test-types.log');
const testLogger = pino({
    level: 'info',
    base: { module: 'test-logger-types' },
}, pino.transport({
    targets: [
        {
            target: 'pino/file',
            options: { destination: testLogFile, mkdir: true }
        },
        {
            target: 'pino-pretty',
            options: { colorize: true, destination: 1 }
        }
    ]
}));

// Config vars from env
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

describe('Type System Functional Tests', () => {
    let authToken: string | null = null;
    let createdEnumTypeId: string | null = null;
    let createdStructureTypeId: string | null = null;
    let stringTypeId: string | null = null;

    beforeAll(async () => {
        testLogger.info('Starting Types Functional Tests setup...');
        // Login to get token
        if (!TEST_EMAIL || !TEST_PASSWORD) {
            testLogger.warn('Skipping login - missing credentials');
            return;
        }

        const { supabase } = await import('../../../commons/supabase.js');
        const { data, error } = await supabase.auth.signInWithPassword({
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });

        if (error) {
            testLogger.error({ error }, 'Login failed');
            throw error;
        }
        authToken = data.session?.access_token || null;
        testLogger.info('Login successful');
    });

    it('should list primitive types', async () => {
        const res = await app.request('/api/types?kind=primitive');
        expect(res.status).toBe(200);
        const types = await res.json();
        expect(Array.isArray(types)).toBe(true);

        // Check for 'string' primitive
        const stringType = types.find((t: any) => t.name === 'string');
        expect(stringType).toBeDefined();
        stringTypeId = stringType?.id;
        testLogger.info({ stringTypeId }, 'Found string primitive type');
    });

    it('should create specialized enum type', async () => {
        if (!authToken) {
            testLogger.warn('Skipping create enum test - missing auth token');
            return;
        }

        const enumPayload = {
            name: `TestEnum_${Date.now()}`,
            kind: 'enum',
            description: 'A test enum created by functional tests',
            visibility: 'public',
            enumValues: [
                { value: 'OPTION_A', label: 'Option A', order: 1 },
                { value: 'OPTION_B', label: 'Option B', order: 2 }
            ]
        };

        const res = await app.request('/api/types', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(enumPayload)
        });

        expect(res.status).toBe(200);
        const createdType = await res.json();
        expect(createdType.id).toBeDefined();
        expect(createdType.name).toBe(enumPayload.name);
        expect(createdType.kind).toBe('enum');

        // API might return enumValues nested or separate? Assuming checking basic props first.
        createdEnumTypeId = createdType.id;
        testLogger.info({ createdEnumTypeId }, 'Created Enum Type');
    });

    it('should create structure type', async () => {
        if (!authToken || !stringTypeId) {
            testLogger.warn('Skipping create structure test - missing auth token or stringTypeId');
            return;
        }

        const structurePayload = {
            name: `TestStruct_${Date.now()}`,
            kind: 'structure',
            description: 'A test structure created by functional tests',
            visibility: 'public',
            structure_fields: [
                {
                    field_name: 'title',
                    field_type_id: stringTypeId,
                    required: true,
                    order: 1
                }
            ]
        };

        const res = await app.request('/api/types', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(structurePayload)
        });

        expect(res.status).toBe(200);
        const createdType = await res.json();
        expect(createdType.id).toBeDefined();
        expect(createdType.name).toBe(structurePayload.name);
        expect(createdType.kind).toBe('structure');

        createdStructureTypeId = createdType.id;
        testLogger.info({ createdStructureTypeId }, 'Created Structure Type');
    });

    it('should update type definition', async () => {
        if (!authToken || !createdStructureTypeId) {
            testLogger.warn('Skipping update test - missing token or type id');
            return;
        }

        const updatePayload = {
            description: 'Updated description for feature test',
            meta: { patched: true }
        };

        const res = await app.request(`/api/types/${createdStructureTypeId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatePayload)
        });

        expect(res.status).toBe(200);
        const updated = await res.json();
        expect(updated.description).toBe(updatePayload.description);
        expect(updated.meta.patched).toBe(true);
        testLogger.info('Updated Type Definition');
    });

    it('should delete types', async () => {
        if (!authToken) return;

        // Delete Structure
        if (createdStructureTypeId) {
            const res = await app.request(`/api/types/${createdStructureTypeId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            expect(res.status).toBe(200);
            testLogger.info('Deleted Structure Type');
        }

        // Delete Enum
        if (createdEnumTypeId) {
            const res = await app.request(`/api/types/${createdEnumTypeId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            expect(res.status).toBe(200);
            testLogger.info('Deleted Enum Type');
        }
    });

});
