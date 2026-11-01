import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default {
  devtool: false,
  plugins: [
    new webpack.BannerPlugin({ banner: "#!/usr/bin/env node", raw: true })
  ],
  entry: {
    main_node: './dist-in/index.js',
    worker: './dist-in/worker.js'
  },
  target: 'node',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false
        }
      }
    ]
  },
  optimization: {
    minimize: false
  },
  resolve: {
    extensions: ['.js', '.mjs', '.ts'],
    extensionAlias: {
      '.js': ['.js', '.ts']
    },
    alias: {
      '@': path.resolve(__dirname, 'dist-in')
    }
  },
  output: {
    filename: '[name].cjs',
    path: path.resolve(__dirname, 'dist')
  },
  externals: {
    'sharp': 'commonjs sharp',
    'pino': 'commonjs pino',
    'thread-stream': 'commonjs thread-stream',
    'fluent-ffmpeg': 'commonjs fluent-ffmpeg',
    'pdfmake': 'commonjs pdfmake',
    'playwright-core': 'commonjs playwright-core',
    'canvas': 'commonjs canvas',
    '@scrapeless-ai/sdk': 'commonjs @scrapeless-ai/sdk',
    'jsdom': 'commonjs jsdom',
    '@mozilla/readability': 'commonjs @mozilla/readability',
    'turndown': 'commonjs turndown',
    'puppeteer-extra-plugin-stealth': 'commonjs puppeteer-extra-plugin-stealth',
    'sqlite3': 'commonjs sqlite3'
  }
}