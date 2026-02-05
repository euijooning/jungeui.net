import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const rootEnvDir = path.resolve(__dirname, '../..')

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootEnvDir, '')
  const apiUrl = env.VITE_API_URL || ''
  return {
    plugins: [react()],
    envDir: rootEnvDir,
    server: {
      port: parseInt(env.VITE_BACKOFFICE_PORT || '5181', 10),
      proxy: apiUrl
        ? {
            '/api': {
              target: apiUrl,
              changeOrigin: true,
              secure: false,
            },
          }
        : {},
    },
  }
})

