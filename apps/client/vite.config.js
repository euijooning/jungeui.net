import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const rootEnvDir = path.resolve(__dirname, '../..');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootEnvDir, '');
  return {
    plugins: [react(), tailwindcss()],
    root: '.',
    publicDir: 'public',
    envDir: rootEnvDir,
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-dom') || id.includes('react-router') || id.includes('react/')) {
                return 'vendor';
              }
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        '@ui-kit': path.resolve(__dirname, '../../shared/ui-kit'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
    server: {
      port: parseInt(env.VITE_CLIENT_PORT || '5182', 10),
      proxy: env.VITE_API_URL
        ? {
            '/api': { target: env.VITE_API_URL, changeOrigin: true },
            '/static': { target: env.VITE_API_URL, changeOrigin: true },
          }
        : {},
    },
  };
});
