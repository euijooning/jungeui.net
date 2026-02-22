import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const rootEnvDir = path.resolve(__dirname, '../..')
const backofficeRoot = path.resolve(__dirname, '.')

// react-hook-form: npm 패키지에 index.esm.mjs가 없어 CJS 번들로 해결
// @popperjs/core: lib/esm 내부 상대 경로가 깨지므로 CJS 번들 사용
function backofficeResolve(dir) {
  return path.resolve(backofficeRoot, 'node_modules', dir)
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootEnvDir, '')
  const apiUrl = env.VITE_API_URL || ''
  return {
    plugins: [react()],
    envDir: rootEnvDir,
    resolve: {
      alias: {
        'react-hook-form': backofficeResolve('react-hook-form/dist/index.cjs.js'),
        '@popperjs/core': backofficeResolve('@popperjs/core/dist/cjs/popper.js'),
      },
    },
    optimizeDeps: {
      // react-hook-form, @popperjs/core: alias로 CJS 번들을 가리키므로 사전 번들해 ESM named export로 제공 (exclude 시 CJS가 그대로 나가 SyntaxError 발생)
    },
    server: {
      port: parseInt(env.VITE_BACKOFFICE_PORT || '5181', 10),
      proxy: apiUrl
        ? {
            '/api': {
              target: apiUrl,
              changeOrigin: true,
              secure: false,
            },
            '/static': {
              target: apiUrl,
              changeOrigin: true,
              secure: false,
            },
          }
        : {},
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor'
            }
          },
        },
      },
    },
  }
})

