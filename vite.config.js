import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // vueDevTools(),
  ],
  server: {
    watch: {
      usePolling: true,
    },
    //  host: "0.0.0.0", // 监听所有地址
    // port: 3000, // 端口号
    // https: false, // 是否开启https
    hmr: true, // 开启热更新
    open: true, // 自动打开浏览器
    // cors: true, // 允许跨域请求
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
