import { readFile, writeFile } from 'node:fs/promises';
import np from 'node:path';
import { describe, test, expect } from 'vitest';
import { translate } from '../index';

const samplesDir = np.resolve('src/__test__');

describe('e2e', () => {
    test(
        'MarkdownTables',
        async () => {
            const source = await readFile(np.join(samplesDir, 'table.md'), 'utf-8');
            const result = await translate(source, 'en', 'de');

            const outPath = np.join(samplesDir, 'table.de.md');
            await writeFile(outPath, result, 'utf-8');

            const written = await readFile(outPath, 'utf-8');
            expect(written).toBe(result);
        },
        { timeout: 30_000 }
    );
});
