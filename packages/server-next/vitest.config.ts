import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

const serverRoot = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(serverRoot, '.env') })
dotenv.config({
    path: path.join(serverRoot, '.env.zitadel.local'),
    override: true,
})

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        globals: true,
        environment: 'node',
        hookTimeout: 120_000,
        /** Load `config/vfs-test.json` (ch1/ch3 mounts) via vfs-config.ts */
        env: { NODE_ENV: 'test' },
        setupFiles: [path.join(serverRoot, 'src/__tests__/vitest-setup-postgres.ts')],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/seed.ts',
                '**/*.test.ts',
            ],
        },
    },
})
