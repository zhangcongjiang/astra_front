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
        // 不重写路径，保留 /api 前缀
        // rewrite: (path) => path.replace(/^\/api/, ''),
        logLevel: 'debug',
        configure: (proxy, options) => {
          // 处理预检请求和正常请求的CORS头信息
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // 设置CORS相关的响应头 - 修复：当允许凭据时不能使用通配符
            const origin = req.headers.origin || 'http://localhost:5174';
            proxyRes.headers['Access-Control-Allow-Origin'] = origin;
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, X-CSRFToken';
            proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
            proxyRes.headers['Access-Control-Max-Age'] = '86400';
          });
        },
        onProxyReq: (proxyReq, req, res) => {
          // 重写Origin头为后端地址，解决CSRF Origin检查问题
          proxyReq.setHeader('Origin', 'http://127.0.0.1:8089');
          proxyReq.setHeader('Referer', 'http://127.0.0.1:8089/');
          
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
          if (req.headers['x-csrf-token']) {
            proxyReq.setHeader('x-csrf-token', req.headers['x-csrf-token']);
          }
        },
      },
      // 添加媒体文件代理配置
      '/media': {
        target: 'http://127.0.0.1:8089',
        changeOrigin: true,
        logLevel: 'debug',
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
