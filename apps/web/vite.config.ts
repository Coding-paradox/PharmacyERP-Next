import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3002,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // pnpm workspaces can expose React's CommonJS JSX runtime as a raw /@fs
  // module in dev mode. Pre-bundle it so Vite provides the named jsxDEV export.
  optimizeDeps: {
    include: ['react', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
});
