import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";
import { componentTagger } from "lovable-tagger";
//import { analyzer } from 'vite-bundle-analyzer';
/*
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from 'vite-plugin-compression';

const rollupOptions = {
  output: {
    entryFileNames: 'assets/[name].js',
    chunkFileNames: 'assets/[name].js',
    assetFileNames: 'assets/[name].[ext]',
    manualChunks(id: string) {
      if (id.includes('node_modules')) {
        if (id.includes('recharts')) {
          return 'recharts';
        }
        return 'vendor';
      }
    },
  },
}
*/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_SERVER_IMAGE_API_URL || 'http://localhost:3333';

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        }
      }
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      //analyzer({ openAnalyzer: false}),
      // viteCompression({ algorithm: 'gzip' }),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        workbox: {
          maximumFileSizeToCacheInBytes: 3000000
        },
        injectManifest: {
          maximumFileSizeToCacheInBytes: 3000000
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
        manifest: false,
        devOptions: {
          enabled: true,
        },
      }),
      {
        name: 'async-css',
        enforce: 'post',
        transformIndexHtml(html: string) {
          return html.replace(
            /<link rel="stylesheet"([^>]*?)>/g,
            '<link rel="stylesheet"$1 media="print" onload="this.media=\'all\'">'
          );
        }
      }
    ].filter(Boolean),
    build: {
      sourcemap: true
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
