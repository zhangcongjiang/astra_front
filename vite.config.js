import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
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
    cors: true, // 允许跨域请求
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8089',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        logLevel: 'debug',
        cookieDomainRewrite: 'localhost',
        configure: (proxy, options) => {
          // 处理预检请求和正常请求的CORS头信息
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // 设置CORS相关的响应头
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token';
            proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
            proxyRes.headers['Access-Control-Max-Age'] = '86400';
            // 如果是预检请求，直接返回204状态码

          });
        },
        onProxyReq: (proxyReq, req, res) => {
          // 手动转发必要的头信息
          if (req.headers['cookie']) {
            proxyReq.setHeader('cookie', req.headers['cookie']);
          }
          if (req.headers['authorization']) {
            proxyReq.setHeader('authorization', req.headers['authorization']);
          }
          if (req.headers['x-csrftoken']) {
            proxyReq.setHeader('x-csrftoken', req.headers['x-csrftoken']);
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
