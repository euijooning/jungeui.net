import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const rootEnvDir = path.resolve(__dirname, '../..');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootEnvDir, '');
  return {
    plugins: [react()],
    root: '.',
    publicDir: 'public',
    envDir: rootEnvDir,
    server: {
      port: parseInt(env.VITE_CLIENT_PORT || '5182', 10),
    },
  };
});
