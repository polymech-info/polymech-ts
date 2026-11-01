import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    // Default to production for embed build usually, or respect mode

    return {
        root: '.',
        base: '/embed_assets/',
        plugins: [
            react(),
        ],
        build: {
            outDir: 'dist/client/embed', // Output into a subfolder of dist/client or separate dist
            emptyOutDir: true,
            assetsDir: '', // Don't use subfolder for assets to keep usage simple with base
            rollupOptions: {
                input: {
                    main: path.resolve(__dirname, 'embed.html'),
                },
            },
        },
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
        define: {
            'process.env.VITE_IS_EMBED': JSON.stringify('true'),
        }
    };
});
