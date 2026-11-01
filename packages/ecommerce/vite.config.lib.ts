import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        react(),
        dts({
            include: ['src'],
            exclude: ['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/setupTests.ts'],
            insertTypesEntry: true,
            tsconfigPath: './tsconfig.lib.json',
        }),
    ],
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/lib-export.ts'),
            name: 'PmEcommerce',
            formats: ['es'],
            fileName: () => `pm-ecommerce.es.js`,
        },
        rollupOptions: {
            external: [
                'react',
                'react/jsx-runtime',
                'react-dom',
                'react-router-dom',
                '@tanstack/react-query',
                '@supabase/supabase-js',
                'lucide-react', // Icons
                'sonner', // Toast
                'zustand',
                'zustand/vanilla',
                'zustand/react',
                'zustand/middleware',
                'tailwind-merge'
            ],
        },
        outDir: 'dist-lib',
        emptyOutDir: true,
        sourcemap: true,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
