import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import vike from 'vike/plugin';
import path from 'path';
import vitePluginBrand from './src/vite-plugin-brand';
import { vitePluginMarkdownHtml } from './src/vite-plugin-markdown-html';

export default defineConfig({
  plugins: [vike({ prerender: true }), react(), tailwindcss(), vitePluginBrand(), vitePluginMarkdownHtml()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/react-router/')) {
            return 'vendor-router';
          }
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/rustbill': {
        target: 'http://localhost:50051',
        changeOrigin: true,
      },
    },
    allowedHosts: true,
  },
});
