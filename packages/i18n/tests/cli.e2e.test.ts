import { expect, test, describe, vi } from 'vitest';
import * as cp from 'child_process';
import * as util from 'util';
import * as path from 'path';

const exec = util.promisify(cp.exec);

const CLI_PATH = path.resolve(__dirname, '../dist/main.js');

describe('i18n CLI E2E', () => {
    test('fails if source or destination language is not provided', async () => {
        try {
            await exec(`node ${CLI_PATH} translate --debug --src='./tests/example.md'`);
            expect.fail('Should have failed with non-zero exit code');
        } catch (error: any) {
            expect(error.stderr + error.stdout).toContain('No source or destination language provided');
        }
    });

    test('fails if API key is not provided', async () => {
        try {
            await exec(`node ${CLI_PATH} translate --srcLang='EN' --dstLang='ES' --debug --src='./tests/example.md'`, { env: {} });
            expect.fail('Should have failed with non-zero exit code');
        } catch (error: any) {
            expect(error.stderr + error.stdout).toContain('No API key provided');
        }
    });

    test('fails if no source path or text is specified', async () => {
        try {
            await exec(`node ${CLI_PATH} translate --srcLang='EN' --dstLang='ES' --debug`);
            expect.fail('Should have failed with non-zero exit code');
        } catch (error: any) {
            expect(error.stderr + error.stdout).toContain('No source path or text specified');
        }
    });
});

import { handler } from '../src/commands/translate.js';
import * as deepl from '../src/lib/deepl.js';

vi.mock('../src/lib/deepl.js', () => ({
    translate_deepl: vi.fn(),
    DeepLLanguages: {}
}));

describe('i18n CLI In-Process (Mocked)', () => {
    test('successfully translates text', async () => {
        const mockTranslateDeepL = deepl.translate_deepl as any;
        mockTranslateDeepL.mockResolvedValue({
            data: {
                translations: [{ text: 'Hola Mundo' }]
            }
        });

        const originalStdoutWrite = process.stdout.write;
        let stdoutData = '';
        process.stdout.write = (chunk: any) => {
            stdoutData += chunk;
            return true;
        };

        try {
            await handler({
                srcLang: 'EN',
                dstLang: 'ES',
                text: 'Hello World',
                api_key: 'mock-key',
                storeRoot: '',
                store: '',
                _: []
            });
            expect(mockTranslateDeepL).toHaveBeenCalled();
            expect(stdoutData).toContain('Hola Mundo');
        } finally {
            process.stdout.write = originalStdoutWrite;
        }
    });
});
