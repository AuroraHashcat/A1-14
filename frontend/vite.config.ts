import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:5000';

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      hmr: {
        host: 'localhost',
        protocol: 'ws'
      },
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false
        },
        '/login': {
          target: backendUrl,
          changeOrigin: true,
          secure: false
        },
        '/register': {
          target: backendUrl,
          changeOrigin: true,
          secure: false
        },
        '/logout': {
          target: backendUrl,
          changeOrigin: true,
          secure: false
        },
        '/admin': {
          target: backendUrl,
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  };
});
