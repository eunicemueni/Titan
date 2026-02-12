import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // This allows the frontend code (geminiService.ts) to access process.env.API_KEY
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    'process.env.OXYLABS_USER': JSON.stringify(process.env.OXYLABS_USER),
    'process.env.OXYLABS_PASS': JSON.stringify(process.env.OXYLABS_PASS),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext'
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001',
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
});