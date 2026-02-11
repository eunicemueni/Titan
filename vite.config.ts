import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Injecting all TITAN OS credentials directly into the client build
    'process.env.API_KEY': JSON.stringify('AIzaSyCxmktI5Kgb2nHfVHxs9UtSR9JCz5cTh0k'),
    'process.env.OXYLABS_USER': JSON.stringify('Eunnah100_QJl9q'),
    'process.env.OXYLABS_PASS': JSON.stringify('cV4sOJ=BSGFe1im'),
    'process.env.REDIS_URL': JSON.stringify('rediss://default:WR4PsdBO788Qyav9olhP50pmO9rLt80e@redis-13106.c17.us-east-1-4.ec2.cloud.redislabs.com:13106'),
    'process.env.NODE_ENV': JSON.stringify('production'),
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