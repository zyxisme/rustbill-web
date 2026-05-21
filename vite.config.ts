import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import vitePluginBrand from './src/vite-plugin-brand';

export default defineConfig({
  plugins: [react(), tailwindcss(), vitePluginBrand()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
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
