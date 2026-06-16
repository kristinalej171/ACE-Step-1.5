import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React and ReactDOM must be isolated first
            if (id.includes('/node_modules/react/') ||
                id.includes('/node_modules/react-dom/') ||
                id.includes('/node_modules/scheduler/')) {
              return 'react-vendor';
            }
            // Radix UI primitives
            if (id.includes('/node_modules/@radix-ui/')) {
              return 'ui-vendor';
            }
            // State management libraries
            if (id.includes('/node_modules/zustand/') ||
                id.includes('/node_modules/@tanstack/')) {
              return 'state-vendor';
            }
            // All other third-party libs
            return 'vendor';
          }
        },
      },
    },
  },
});