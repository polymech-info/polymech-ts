import { transform } from 'esbuild';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';

const SRC = 'src';
const DIST = 'dist';

async function getFiles(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === '__test__' || entry.name === 'types') continue;
            files.push(...(await getFiles(full)));
        } else if (entry.name.endsWith('.ts')) {
            files.push(full);
        }
    }
    return files;
}

async function main() {
    const files = await getFiles(SRC);

    for (const file of files) {
        const input = await readFile(file, 'utf-8');
        const { code } = await transform(input, {
            format: 'esm',
            loader: 'ts',
            target: 'es2021'
        });

        const rel = relative(SRC, file).replace(/\.ts$/, '.js');
        const outPath = join(DIST, rel);

        await mkdir(dirname(outPath), { recursive: true });
        await writeFile(outPath, code);
    }

    console.log(`Built ${files.length} files to ${DIST}/`);
}

main();
