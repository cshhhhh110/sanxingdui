import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
const serverPort=8889
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 8800,
    open: true,
    compress:false,
    proxy: {
      '/api': {
        target: 'http://localhost:'+serverPort,
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/files': {
        target: 'http://localhost:'+serverPort,
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/file/, '')
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ["legacy-js-api"],
        // 移除自动注入，防止循环导入
        api: 'modern-compiler' // 使用新的 Sass API
      }
    }
  },
  // 定义环境变量
  define: {
    'import.meta.env.VITE_APP_BASE_API': JSON.stringify('/api')
  }
}) 