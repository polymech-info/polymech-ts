import { readFileSync } from 'fs';
import np from 'path';

const CWD = process.cwd();

// Load .env into process.env for tests
try {
	const env = readFileSync(np.resolve(CWD, '.env'), 'utf-8');
	for (const line of env.split('\n')) {
		const match = line.match(/^\s*([\w.-]+)\s*=\s*"?([^"]*)"?\s*$/);
		if (match) process.env[match[1]] ??= match[2];
	}
} catch { }

/** @type { import('vite').UserConfig } */
export default {
	resolve: {
		alias: {
			$types: np.resolve(CWD, './src/types/index.js'),
			$utils: np.resolve(CWD, './src/utils/index.js')
		}
	}
};
