import { beforeAll, describe, expect, it } from 'vitest';
import { defaultPool, initPostgresPools } from '../postgres.js';
import {
    fetchUserSecretsSettingsPg,
    getApiKeyFromUserSettings,
} from '../../products/openai/db-openai-pg.js';

const canRun = !!process.env.DATABASE_URL_NEXT?.trim();
const ownerId = '00000000-0000-4000-8000-000000000001';

describe('db-openai-pg', () => {
    beforeAll(async () => {
        initPostgresPools();
        await defaultPool();
    });

    it('getApiKeyFromUserSettings reads nested api_keys', () => {
        expect(
            getApiKeyFromUserSettings(
                { api_keys: { openai_api_key: 'sk-test', openrouter_api_key: '' } },
                'openai_api_key',
            ),
        ).toBe('sk-test');
        expect(getApiKeyFromUserSettings({}, 'openrouter_api_key')).toBeUndefined();
        expect(getApiKeyFromUserSettings({ api_keys: {} }, 'serpapi_api_key')).toBeUndefined();
    });

    it.skipIf(!canRun)('fetchUserSecretsSettingsPg returns object', async () => {
        const s = await fetchUserSecretsSettingsPg(ownerId);
        expect(typeof s).toBe('object');
    });
});
