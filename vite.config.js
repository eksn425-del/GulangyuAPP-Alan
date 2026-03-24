import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',       // 允许局域网访问
    allowedHosts: true,    // 允许 ngrok
    proxy: {
      // 1. 转发数据接口
      '/api': {
        target: 'http://127.0.0.1:8000', // 确保指向 FastAPI 的 8000
        changeOrigin: true,
        secure: false,
      },
      // 2. 转发图片/音频静态文件 (新增！)
      '/static': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})