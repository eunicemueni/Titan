
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Priority: 1. Environment Variable, 2. Local fallback
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || ''),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext'
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
